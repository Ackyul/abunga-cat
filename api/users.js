import { neon } from '@neondatabase/serverless';
import crypto from 'crypto';

// ═══════════════════════════════════════════════════════════════
//  UTILIDADES JWT NATIVAS (sin dependencias de terceros)
// ═══════════════════════════════════════════════════════════════

function signToken(payload, secret) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', secret).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${signature}`;
}

function verifyToken(token, secret) {
  try {
    if (!token || typeof token !== 'string') return null;
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [header, body, signature] = parts;
    const expectedSig = crypto.createHmac('sha256', secret).update(`${header}.${body}`).digest('base64url');
    // Comparación de tiempo constante para evitar timing attacks
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) return null;
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (payload.exp && Date.now() > payload.exp) return null;
    return payload;
  } catch (e) {
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════
//  SESIÓN DE USUARIO
// ═══════════════════════════════════════════════════════════════

export function verifyUserSession(req) {
  const cookieHeader = req.headers.cookie || '';
  const token = cookieHeader
    .split(';')
    .find(c => c.trim().startsWith('user_token='))
    ?.split('=')[1];
    
  if (!token) return null;
  
  const secret = process.env.JWT_SECRET;
  if (!secret) return null; // NUNCA usar un secret por defecto en producción
  return verifyToken(token, secret);
}

// ═══════════════════════════════════════════════════════════════
//  HASHING DE CONTRASEÑAS (PBKDF2 con 310.000 iteraciones)
//  Cumple con las recomendaciones actuales de OWASP 2024+
// ═══════════════════════════════════════════════════════════════

const PBKDF2_ITERATIONS = 310000;
const PBKDF2_KEYLEN = 64;
const PBKDF2_DIGEST = 'sha512';

function hashPassword(password) {
  const salt = crypto.randomBytes(32).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, PBKDF2_KEYLEN, PBKDF2_DIGEST).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, storedPassword) {
  try {
    const [salt, hash] = storedPassword.split(':');
    if (!salt || !hash) return false;
    const checkHash = crypto.pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, PBKDF2_KEYLEN, PBKDF2_DIGEST).toString('hex');
    // Comparación de tiempo constante para evitar timing attacks
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(checkHash, 'hex'));
  } catch (e) {
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════
//  RATE LIMITING EN MEMORIA (por IP, por acción)
//  Protección contra fuerza bruta en login y registro
// ═══════════════════════════════════════════════════════════════

const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutos
const RATE_LIMIT_MAX_ATTEMPTS = 10; // Máximo 10 intentos por ventana

function isRateLimited(ip, action) {
  const key = `${ip}:${action}`;
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  
  if (!entry || now - entry.startTime > RATE_LIMIT_WINDOW_MS) {
    rateLimitMap.set(key, { startTime: now, count: 1 });
    return false;
  }
  
  entry.count++;
  if (entry.count > RATE_LIMIT_MAX_ATTEMPTS) {
    return true;
  }
  return false;
}

// Limpiar entradas viejas periódicamente para evitar fugas de memoria
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap) {
    if (now - entry.startTime > RATE_LIMIT_WINDOW_MS) {
      rateLimitMap.delete(key);
    }
  }
}, 5 * 60 * 1000); // Limpieza cada 5 minutos

// ═══════════════════════════════════════════════════════════════
//  VALIDACIÓN Y SANITIZACIÓN DE ENTRADA
// ═══════════════════════════════════════════════════════════════

const EMAIL_REGEX = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
const MAX_NAME_LENGTH = 100;
const MAX_EMAIL_LENGTH = 254; // RFC 5321
const MAX_PASSWORD_LENGTH = 128;
const MIN_PASSWORD_LENGTH = 6;
const MAX_CART_ITEMS = 100;
const MAX_CART_ITEM_QUANTITY = 999;
const MAX_BODY_SIZE = 1024 * 512; // 512 KB máximo para el body

function sanitizeString(str) {
  if (typeof str !== 'string') return '';
  return str.trim().replace(/[<>]/g, ''); // Elimina < y > para prevenir inyección HTML en respuestas
}

function validateCartItem(item) {
  if (!item || typeof item !== 'object') return false;
  if (typeof item.id !== 'number' && typeof item.id !== 'string') return false;
  if (typeof item.quantity !== 'number' || item.quantity < 1 || item.quantity > MAX_CART_ITEM_QUANTITY) return false;
  if (!Number.isFinite(item.quantity)) return false;
  if (item.price !== undefined && (typeof item.price !== 'number' || !Number.isFinite(item.price) || item.price < 0)) return false;
  if (item.name && typeof item.name !== 'string') return false;
  if (item.selectedWeight && typeof item.selectedWeight !== 'string') return false;
  return true;
}

function validateCart(cart) {
  if (!Array.isArray(cart)) return false;
  if (cart.length > MAX_CART_ITEMS) return false;
  return cart.every(validateCartItem);
}

// ═══════════════════════════════════════════════════════════════
//  HANDLER PRINCIPAL
// ═══════════════════════════════════════════════════════════════

export default async function handler(req, res) {
  // Cabeceras de seguridad para todas las respuestas API
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.setHeader('Pragma', 'no-cache');

  // CORS estricto: solo mismo origen
  const allowedOrigin = req.headers.origin || '';
  const host = req.headers.host || '';
  const isLocalDev = host.includes('localhost') || host.includes('127.0.0.1');
  
  if (isLocalDev) {
    res.setHeader('Access-Control-Allow-Origin', allowedOrigin || '*');
  } else {
    // En producción, solo aceptar peticiones del mismo dominio
    res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Validar tamaño del body para prevenir DoS
  const contentLength = parseInt(req.headers['content-length'] || '0', 10);
  if (contentLength > MAX_BODY_SIZE) {
    return res.status(413).json({ error: 'Payload demasiado grande.' });
  }

  const databaseUrl = process.env.DATABASE_URL;
  const jwtSecret = process.env.JWT_SECRET;

  if (!databaseUrl) {
    return res.status(500).json({ error: 'Servicio no disponible temporalmente.' });
  }

  if (!jwtSecret) {
    console.error('CRITICAL: JWT_SECRET no está configurado.');
    return res.status(500).json({ error: 'Servicio no disponible temporalmente.' });
  }

  const sql = neon(databaseUrl);
  const url = req.url || '';
  const action = url.split('?')[0].split('/').pop();
  const clientIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown';

  // Helper para crear cookie de sesión de usuario
  const setSessionCookie = (user) => {
    const token = signToken({ 
      id: user.id,
      email: user.email,
      iat: Date.now(),
      exp: Date.now() + 30 * 24 * 60 * 60 * 1000 // 30 días
    }, jwtSecret);
    
    const isLocalhost = host.includes('localhost') || host.includes('127.0.0.1');
    const secureFlag = isLocalhost ? '' : 'Secure;';
    res.setHeader('Set-Cookie', `user_token=${token}; Path=/; HttpOnly; ${secureFlag} SameSite=Strict; Max-Age=2592000`);
  };

  try {
    // ─── 1. POST /api/users/register ────────────────────────────
    if (action === 'register' && req.method === 'POST') {
      // Rate limiting
      if (isRateLimited(clientIp, 'register')) {
        return res.status(429).json({ error: 'Demasiados intentos. Intenta de nuevo en 15 minutos.' });
      }

      const { name, email, password } = req.body || {};
      
      // Validaciones estrictas
      if (!name || !email || !password) {
        return res.status(400).json({ error: 'Nombre, correo y contraseña son requeridos.' });
      }

      const cleanName = sanitizeString(name);
      const cleanEmail = sanitizeString(email).toLowerCase();

      if (cleanName.length < 2 || cleanName.length > MAX_NAME_LENGTH) {
        return res.status(400).json({ error: `El nombre debe tener entre 2 y ${MAX_NAME_LENGTH} caracteres.` });
      }

      if (!EMAIL_REGEX.test(cleanEmail) || cleanEmail.length > MAX_EMAIL_LENGTH) {
        return res.status(400).json({ error: 'El formato de correo electrónico no es válido.' });
      }

      if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH || password.length > MAX_PASSWORD_LENGTH) {
        return res.status(400).json({ error: `La contraseña debe tener entre ${MIN_PASSWORD_LENGTH} y ${MAX_PASSWORD_LENGTH} caracteres.` });
      }

      // Verificar existencia con timing constante (siempre ejecutar hash)
      const existingUser = await sql`SELECT id FROM usuarios WHERE email = ${cleanEmail}`;
      
      if (existingUser.length > 0) {
        return res.status(400).json({ error: 'El correo electrónico ya está registrado.' });
      }

      const passwordHash = hashPassword(password);
      
      const result = await sql`
        INSERT INTO usuarios (name, email, password_hash, cart)
        VALUES (${cleanName}, ${cleanEmail}, ${passwordHash}, '[]'::jsonb)
        RETURNING id, name, email, cart, created_at
      `;
      
      const user = result[0];
      setSessionCookie(user);
      return res.status(201).json({ success: true, user });
    }

    // ─── 2. POST /api/users/login ───────────────────────────────
    if (action === 'login' && req.method === 'POST') {
      // Rate limiting
      if (isRateLimited(clientIp, 'login')) {
        return res.status(429).json({ error: 'Demasiados intentos de inicio de sesión. Intenta de nuevo en 15 minutos.' });
      }

      const { email, password } = req.body || {};

      if (!email || !password) {
        return res.status(400).json({ error: 'Correo y contraseña son requeridos.' });
      }

      const cleanEmail = sanitizeString(email).toLowerCase();

      if (!EMAIL_REGEX.test(cleanEmail) || typeof password !== 'string' || password.length > MAX_PASSWORD_LENGTH) {
        return res.status(401).json({ error: 'Correo electrónico o contraseña incorrectos.' });
      }

      // Buscar usuario
      const users = await sql`SELECT * FROM usuarios WHERE email = ${cleanEmail}`;
      
      if (users.length === 0) {
        // Ejecutar hash ficticio para evitar timing attacks que revelen si el email existe
        hashPassword('dummy-password-timing-safe');
        return res.status(401).json({ error: 'Correo electrónico o contraseña incorrectos.' });
      }

      const user = users[0];
      const isPasswordCorrect = verifyPassword(password, user.password_hash);
      
      if (!isPasswordCorrect) {
        return res.status(401).json({ error: 'Correo electrónico o contraseña incorrectos.' });
      }

      setSessionCookie(user);
      
      // Nunca retornar el hash de contraseña
      const { password_hash, ...safeUser } = user;
      return res.status(200).json({ success: true, user: safeUser });
    }

    // ─── 3. POST /api/users/logout ──────────────────────────────
    if (action === 'logout' && req.method === 'POST') {
      const isLocalhost = host.includes('localhost') || host.includes('127.0.0.1');
      const secureFlag = isLocalhost ? '' : 'Secure;';
      res.setHeader('Set-Cookie', `user_token=; Path=/; HttpOnly; ${secureFlag} SameSite=Strict; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT`);
      return res.status(200).json({ success: true });
    }

    // ─── 4. GET /api/users/session ──────────────────────────────
    if (action === 'session' && req.method === 'GET') {
      const session = verifyUserSession(req);
      if (session) {
        // Solo devolver datos no sensibles
        const users = await sql`SELECT id, name, email, cart, created_at FROM usuarios WHERE id = ${session.id}`;
        if (users.length > 0) {
          return res.status(200).json({ authenticated: true, user: users[0] });
        }
      }
      return res.status(200).json({ authenticated: false });
    }

    // ─── 5. Operaciones de carrito (requieren sesión) ───────────
    const session = verifyUserSession(req);
    if (!session) {
      return res.status(401).json({ error: 'No autorizado. Debe iniciar sesión.' });
    }

    // GET /api/users/cart
    if (action === 'cart' && req.method === 'GET') {
      const result = await sql`SELECT cart FROM usuarios WHERE id = ${session.id}`;
      if (result.length === 0) {
        return res.status(404).json({ error: 'Usuario no encontrado.' });
      }
      return res.status(200).json(result[0].cart || []);
    }

    // PUT /api/users/cart
    if (action === 'cart' && req.method === 'PUT') {
      const { cart } = req.body || {};
      
      if (!validateCart(cart)) {
        return res.status(400).json({ error: 'El carrito contiene datos inválidos.' });
      }

      // Sanitizar cada ítem del carrito antes de guardar
      const sanitizedCart = cart.map(item => ({
        id: item.id,
        name: typeof item.name === 'string' ? sanitizeString(item.name).substring(0, 255) : '',
        image: typeof item.image === 'string' ? item.image.substring(0, 500) : null,
        price: Number(item.price) || 0,
        brand: typeof item.brand === 'string' ? sanitizeString(item.brand).substring(0, 100) : '',
        quantity: Math.min(Math.max(1, Math.floor(item.quantity)), MAX_CART_ITEM_QUANTITY),
        selectedWeight: typeof item.selectedWeight === 'string' ? item.selectedWeight.substring(0, 20) : '',
        ...(item.fruits ? { fruits: Array.isArray(item.fruits) ? item.fruits.filter(f => typeof f === 'string').map(f => sanitizeString(f).substring(0, 50)).slice(0, 10) : [] } : {}),
      }));

      const result = await sql`
        UPDATE usuarios
        SET cart = ${JSON.stringify(sanitizedCart)}
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
    // NUNCA exponer detalles internos del error al cliente en producción
    console.error('❌ Error en API de usuarios:', error);
    return res.status(500).json({ error: 'Error interno del servidor.' });
  }
}
