import { neon } from '@neondatabase/serverless';
import crypto from 'crypto';

// Utilidades JWT Nativas
function signToken(payload, secret) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', secret).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${signature}`;
}

function verifyToken(token, secret) {
  try {
    const [header, body, signature] = token.split('.');
    const expectedSig = crypto.createHmac('sha256', secret).update(`${header}.${body}`).digest('base64url');
    if (signature !== expectedSig) return null;
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (payload.exp && Date.now() > payload.exp) return null;
    return payload;
  } catch (e) {
    return null;
  }
}

// Utilidad para extraer y verificar la sesión de usuario
export function verifyUserSession(req) {
  const cookieHeader = req.headers.cookie || '';
  const token = cookieHeader
    .split(';')
    .find(c => c.trim().startsWith('user_token='))
    ?.split('=')[1];
    
  if (!token) return null;
  
  const secret = process.env.JWT_SECRET || 'default-super-secret-jwt-key';
  return verifyToken(token, secret);
}

// Utilidades para Hashing de Contraseñas Seguras (PBKDF2)
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, storedPassword) {
  try {
    const [salt, hash] = storedPassword.split(':');
    const checkHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    return hash === checkHash;
  } catch (e) {
    return false;
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    return res.status(500).json({ error: 'DATABASE_URL no está configurada en el servidor.' });
  }

  const sql = neon(databaseUrl);
  const jwtSecret = process.env.JWT_SECRET || 'default-super-secret-jwt-key';
  const url = req.url || '';
  const action = url.split('?')[0].split('/').pop();

  // Helper para crear cookie de sesión de usuario
  const setSessionCookie = (user) => {
    const token = signToken({ 
      id: user.id,
      email: user.email,
      exp: Date.now() + 30 * 24 * 60 * 60 * 1000 // 30 días
    }, jwtSecret);
    
    const host = req.headers.host || '';
    const isLocalhost = host.includes('localhost') || host.includes('127.0.0.1');
    const secureFlag = isLocalhost ? '' : 'Secure;';
    res.setHeader('Set-Cookie', `user_token=${token}; Path=/; HttpOnly; ${secureFlag} SameSite=Strict; Max-Age=2592000`);
  };

  try {
    // 1. POST /api/users/register -> Registrar un nuevo usuario
    if (action === 'register' && req.method === 'POST') {
      const { name, email, password } = req.body || {};
      
      if (!name || !email || !password) {
        return res.status(400).json({ error: 'Nombre, correo y contraseña son requeridos.' });
      }

      if (password.length < 6) {
        return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres.' });
      }

      // Validar si el email ya existe
      const existingUser = await sql`SELECT id FROM usuarios WHERE email = ${email.toLowerCase()}`;
      if (existingUser.length > 0) {
        return res.status(400).json({ error: 'El correo electrónico ya está registrado.' });
      }

      const passwordHash = hashPassword(password);
      
      // Crear el usuario
      const result = await sql`
        INSERT INTO usuarios (name, email, password_hash, cart)
        VALUES (${name}, ${email.toLowerCase()}, ${passwordHash}, '[]'::jsonb)
        RETURNING id, name, email, cart, created_at
      `;
      
      const user = result[0];
      setSessionCookie(user);
      return res.status(201).json({ success: true, user });
    }

    // 2. POST /api/users/login -> Iniciar sesión
    if (action === 'login' && req.method === 'POST') {
      const { email, password } = req.body || {};

      if (!email || !password) {
        return res.status(400).json({ error: 'Correo y contraseña son requeridos.' });
      }

      // Buscar usuario
      const users = await sql`SELECT * FROM usuarios WHERE email = ${email.toLowerCase()}`;
      if (users.length === 0) {
        return res.status(401).json({ error: 'Correo electrónico o contraseña incorrectos.' });
      }

      const user = users[0];
      const isPasswordCorrect = verifyPassword(password, user.password_hash);
      
      if (!isPasswordCorrect) {
        return res.status(401).json({ error: 'Correo electrónico o contraseña incorrectos.' });
      }

      setSessionCookie(user);
      
      // Retornar información del usuario sin el hash de contraseña
      const { password_hash, ...safeUser } = user;
      return res.status(200).json({ success: true, user: safeUser });
    }

    // 3. POST /api/users/logout -> Cerrar sesión
    if (action === 'logout' && req.method === 'POST') {
      res.setHeader('Set-Cookie', 'user_token=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT');
      return res.status(200).json({ success: true });
    }

    // 4. GET /api/users/session -> Comprobar sesión de usuario activa
    if (action === 'session' && req.method === 'GET') {
      const session = verifyUserSession(req);
      if (session) {
        const users = await sql`SELECT id, name, email, cart, created_at FROM usuarios WHERE id = ${session.id}`;
        if (users.length > 0) {
          return res.status(200).json({ authenticated: true, user: users[0] });
        }
      }
      return res.status(200).json({ authenticated: false });
    }

    // 5. Operaciones de carrito (Requieren sesión de usuario activa)
    const session = verifyUserSession(req);
    if (!session) {
      return res.status(401).json({ error: 'No autorizado. Debe iniciar sesión.' });
    }

    // GET /api/users/cart -> Obtener el carrito del usuario de la DB
    if (action === 'cart' && req.method === 'GET') {
      const result = await sql`SELECT cart FROM usuarios WHERE id = ${session.id}`;
      if (result.length === 0) {
        return res.status(404).json({ error: 'Usuario no encontrado.' });
      }
      return res.status(200).json(result[0].cart || []);
    }

    // PUT /api/users/cart -> Actualizar el carrito del usuario en la DB
    if (action === 'cart' && req.method === 'PUT') {
      const { cart } = req.body || {};
      if (!Array.isArray(cart)) {
        return res.status(400).json({ error: 'El carrito debe ser un arreglo válido.' });
      }

      const result = await sql`
        UPDATE usuarios
        SET cart = ${JSON.stringify(cart)}
        WHERE id = ${session.id}
        RETURNING cart
      `;
      
      if (result.length === 0) {
        return res.status(404).json({ error: 'Usuario no encontrado.' });
      }
      return res.status(200).json(result[0].cart);
    }

    return res.status(404).json({ error: 'Acción no encontrada.' });
  } catch (error) {
    console.error('❌ Error en API de usuarios:', error);
    return res.status(500).json({ error: 'Error interno del servidor.', details: error.message });
  }
}
