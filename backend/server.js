import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import crypto from 'crypto';
import { neon } from '@neondatabase/serverless';

// Cargar variables de entorno
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración de la base de datos
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('❌ CRITICAL ERROR: DATABASE_URL no está configurada.');
  process.exit(1);
}
const rawSql = neon(databaseUrl);

// Clase para encolar operaciones secuencialmente y evitar condiciones de carrera o sobrecarga en la DB
class RequestQueue {
  constructor() {
    this.queue = [];
    this.running = false;
  }
  
  add(fn) {
    return new Promise((resolve, reject) => {
      this.queue.push({ fn, resolve, reject });
      this.next();
    });
  }
  
  async next() {
    if (this.running || this.queue.length === 0) return;
    this.running = true;
    const { fn, resolve, reject } = this.queue.shift();
    try {
      const res = await fn();
      resolve(res);
    } catch (err) {
      reject(err);
    } finally {
      this.running = false;
      this.next();
    }
  }
}

const dbWriteQueue = new RequestQueue();

// Función helper con lógica de reintentos exponencial y jitter para mitigar errores transitorios de red/DB
async function executeSafeSql(operation, maxRetries = 5) {
  let attempt = 0;
  while (true) {
    try {
      return await operation();
    } catch (err) {
      attempt++;
      const errCode = String(err.code || '');
      const errMessage = String(err.message || '').toLowerCase();
      
      const isTransient = 
        errCode.startsWith('08') || // Errores de conexión
        errCode === '40001' ||      // Falla de serialización
        errCode === '40P01' ||      // Deadlock
        errCode === '55P03' ||      // Bloqueo no disponible
        errCode === '57P01' ||      // Apagado del administrador (admin_shutdown)
        errMessage.includes('timeout') ||
        errMessage.includes('socket') ||
        errMessage.includes('connection reset') ||
        errMessage.includes('connection refused') ||
        errMessage.includes('max connection') ||
        errMessage.includes('rate limit') ||
        errMessage.includes('too many connections') ||
        errMessage.includes('abort');
        
      if (isTransient && attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 150 + Math.floor(Math.random() * 150);
        console.warn(`[DB WARNING] Error transitorio detectado (Código: ${errCode}, Mensaje: ${err.message}). Reintentando en ${delay}ms... (Intento ${attempt}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        if (errCode === '23505') {
          console.warn(`[DB WARNING] Violación de restricción única (Código: 23505): ${err.message}`);
        }
        throw err;
      }
    }
  }
}

// Wrapper seguro de la instancia de neon sql que maneja cola de escrituras y reintentos transitorios
const sql = async (strings, ...values) => {
  const isWriteQuery = () => {
    if (!strings || !strings[0]) return false;
    const clean = strings.join('').trim().toUpperCase();
    return clean.startsWith('INSERT') || clean.startsWith('UPDATE') || clean.startsWith('DELETE');
  };

  const operation = () => executeSafeSql(() => rawSql(strings, ...values));
  
  if (isWriteQuery()) {
    return dbWriteQueue.add(operation);
  }
  return operation();
};

// Configuración de JWT
const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
  console.error('❌ CRITICAL ERROR: JWT_SECRET no está configurada.');
  process.exit(1);
}

// ═══════════════════════════════════════════════════════════════
//  MIDDLEWARES Y SEGURIDAD
// ═══════════════════════════════════════════════════════════════

// CORS dinámico para permitir entornos locales y de producción
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://abungasaborqueretumba.com',
  'https://www.abungasaborqueretumba.com'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Bloqueado por CORS: origen no permitido.'));
    }
  },
  credentials: true
}));

app.use(express.json({ limit: '10mb' })); // Permitir imágenes base64 grandes en uploads
app.use(cookieParser());

// Cabeceras de seguridad personalizadas
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.setHeader('Pragma', 'no-cache');
  next();
});

// Rate limiting simple en memoria para autenticación
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutos
const RATE_LIMIT_MAX_ATTEMPTS = 5;

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

// Limpieza periódica de rate limiting
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap) {
    if (now - entry.startTime > RATE_LIMIT_WINDOW_MS) {
      rateLimitMap.delete(key);
    }
  }
}, 5 * 60 * 1000);

// ═══════════════════════════════════════════════════════════════
//  UTILIDADES JWT Y HASHING
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
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) return null;
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (payload.exp && Date.now() > payload.exp) return null;
    return payload;
  } catch (e) {
    return null;
  }
}

// PBKDF2 Hashing
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
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(checkHash, 'hex'));
  } catch (e) {
    return false;
  }
}

// Sanitizadores y validadores
function sanitizeString(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const MIN_PASSWORD_LENGTH = 6;
const MAX_PASSWORD_LENGTH = 128;
const MAX_NAME_LENGTH = 50;
const MAX_EMAIL_LENGTH = 254;
const MAX_CART_ITEMS = 50;
const MAX_CART_ITEM_QUANTITY = 99;

function validateCartItem(item) {
  if (!item || typeof item !== 'object') return false;
  if (typeof item.id !== 'number') return false;
  if (typeof item.name !== 'string' || item.name.length > 255) return false;
  if (item.image !== null && (typeof item.image !== 'string' || item.image.length > 500)) return false;
  if (typeof item.price !== 'number' || isNaN(item.price) || item.price < 0) return false;
  if (typeof item.quantity !== 'number' || item.quantity < 1 || item.quantity > MAX_CART_ITEM_QUANTITY) return false;
  if (typeof item.selectedWeight !== 'string' || item.selectedWeight.length > 20) return false;
  if (item.brand && (typeof item.brand !== 'string' || item.brand.length > 100)) return false;
  if (item.fruits && !Array.isArray(item.fruits)) return false;
  return true;
}

function validateCart(cart) {
  if (!Array.isArray(cart)) return false;
  if (cart.length > MAX_CART_ITEMS) return false;
  return cart.every(validateCartItem);
}

// ═══════════════════════════════════════════════════════════════
//  MIDDLEWARES DE VERIFICACIÓN DE SESIÓN (AUTORIZACIÓN)
// ═══════════════════════════════════════════════════════════════

// Sesión de Admin
function verifySessionMiddleware(req, res, next) {
  const token = req.cookies.admin_token;
  if (!token) {
    return res.status(401).json({ error: 'No autorizado. Debe iniciar sesión como administrador.' });
  }
  
  const payload = verifyToken(token, jwtSecret);
  if (!payload || payload.role !== 'admin') {
    return res.status(401).json({ error: 'No autorizado. Debe iniciar sesión como administrador.' });
  }
  
  req.adminEmail = payload.email;
  next();
}

// Sesión de Cliente
function verifyUserSessionMiddleware(req, res, next) {
  const token = req.cookies.user_token;
  if (!token) {
    return res.status(401).json({ error: 'No autorizado. Debe iniciar sesión.' });
  }
  
  const payload = verifyToken(token, jwtSecret);
  if (!payload || !payload.id) {
    return res.status(401).json({ error: 'No autorizado. Debe iniciar sesión.' });
  }
  
  req.userId = payload.id;
  req.userEmail = payload.email;
  next();
}

// Helper para cookies en local vs prod
function setCookie(res, name, value, maxAge, path = '/') {
  const secure = process.env.NODE_ENV === 'production';
  res.cookie(name, value, {
    path,
    httpOnly: true,
    secure,
    sameSite: secure ? 'Strict' : 'Lax',
    maxAge: maxAge * 1000
  });
}

// ═══════════════════════════════════════════════════════════════
//  1. ADMIN AUTH ENDPOINTS (/api/auth)
// ═══════════════════════════════════════════════════════════════

// GET /api/auth/session
app.get('/api/auth/session', (req, res) => {
  const token = req.cookies.admin_token;
  if (token) {
    const session = verifyToken(token, jwtSecret);
    if (session && session.role === 'admin') {
      return res.status(200).json({ authenticated: true, email: session.email });
    }
  }
  return res.status(200).json({ authenticated: false });
});

// POST /api/auth/login
app.post('/api/auth/login', (req, res) => {
  return res.status(403).json({ error: 'El inicio de sesión por contraseña está desactivado. Use Google OAuth.' });
});

// POST /api/auth/logout
app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('admin_token', { path: '/' });
  return res.status(200).json({ success: true });
});

// GET /api/auth/google -> Redirección a Google OAuth (Admin)
app.get('/api/auth/google', (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return res.status(500).json({ error: 'Servicio OAuth no disponible.' });
  }

  const stateToken = crypto.randomBytes(32).toString('hex');
  const protocol = req.headers['x-forwarded-proto'] || req.protocol;
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const redirectUri = encodeURIComponent(`${protocol}://${host}/api/auth/callback`);

  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=openid%20email%20profile&state=${stateToken}`;
  
  res.cookie('admin_oauth_state', stateToken, {
    path: '/api/auth/callback',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Lax',
    maxAge: 600 * 1000
  });
  
  res.redirect(googleAuthUrl);
});

// GET /api/auth/callback -> Callback de Google OAuth (Admin)
app.get('/api/auth/callback', async (req, res) => {
  const { code, state } = req.query || {};
  if (!code) {
    return res.status(400).json({ error: 'Código de autorización faltante.' });
  }

  const storedState = req.cookies.admin_oauth_state;
  if (!state || !storedState || state !== storedState) {
    return res.status(403).json({ error: 'Validación de seguridad fallida.' });
  }

  res.clearCookie('admin_oauth_state', { path: '/api/auth/callback' });

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const adminEmail = process.env.ADMIN_EMAIL;

  if (!clientId || !clientSecret) {
    return res.status(500).json({ error: 'Configuración OAuth incompleta.' });
  }

  const protocol = req.headers['x-forwarded-proto'] || req.protocol;
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const redirectUri = `${protocol}://${host}/api/auth/callback`;

  try {
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      })
    });

    const tokenData = await tokenResponse.json();
    if (!tokenData.access_token) {
      return res.status(401).json({ error: 'Fallo en la autenticación de Google.' });
    }

    const userResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });
    const userData = await userResponse.json();

    const userEmail = userData.email;
    if (!userEmail) {
      return res.status(400).json({ error: 'No se pudo obtener el correo.' });
    }

    if (!adminEmail || userEmail.toLowerCase() !== adminEmail.toLowerCase()) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.status(403).end(`
        <div style="font-family:sans-serif; text-align:center; padding:50px;">
          <h1>Acceso Denegado</h1>
          <p>La cuenta no está autorizada para administrar este sitio.</p>
          <a href="/admin">Volver</a>
        </div>
      `);
    }

    const token = signToken({ 
      email: userEmail,
      role: 'admin',
      iat: Date.now(),
      exp: Date.now() + 24 * 60 * 60 * 1000
    }, jwtSecret);

    setCookie(res, 'admin_token', token, 86400);
    res.redirect('/admin');
  } catch (err) {
    console.error('OAuth Callback Error:', err);
    return res.status(500).json({ error: 'Error durante la autenticación.' });
  }
});

// ═══════════════════════════════════════════════════════════════
//  2. CLIENT USER AUTH ENDPOINTS (/api/users)
// ═══════════════════════════════════════════════════════════════

// POST /api/users/register
app.post('/api/users/register', async (req, res) => {
  const clientIp = req.ip || 'unknown';
  if (isRateLimited(clientIp, 'register')) {
    return res.status(429).json({ error: 'Demasiados intentos. Intenta de nuevo en 15 minutos.' });
  }

  const { name, email, password, phone } = req.body || {};
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Nombre, correo y contraseña son requeridos.' });
  }

  const cleanName = sanitizeString(name);
  const cleanEmail = sanitizeString(email).toLowerCase();
  const cleanPhone = phone ? sanitizeString(phone) : null;

  if (cleanName.length < 2 || cleanName.length > MAX_NAME_LENGTH) {
    return res.status(400).json({ error: `El nombre debe tener entre 2 y ${MAX_NAME_LENGTH} caracteres.` });
  }
  if (!EMAIL_REGEX.test(cleanEmail) || cleanEmail.length > MAX_EMAIL_LENGTH) {
    return res.status(400).json({ error: 'El formato de correo no es válido.' });
  }
  if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH || password.length > MAX_PASSWORD_LENGTH) {
    return res.status(400).json({ error: `La contraseña debe tener entre ${MIN_PASSWORD_LENGTH} y ${MAX_PASSWORD_LENGTH} caracteres.` });
  }

  try {
    const existingUser = await sql`SELECT id FROM usuarios WHERE email = ${cleanEmail}`;
    if (existingUser.length > 0) {
      return res.status(400).json({ error: 'El correo electrónico ya está registrado.' });
    }

    const passwordHash = hashPassword(password);
    const result = await sql`
      INSERT INTO usuarios (name, email, password_hash, phone, cart)
      VALUES (${cleanName}, ${cleanEmail}, ${passwordHash}, ${cleanPhone}, '[]'::jsonb)
      RETURNING id, name, email, phone, google_email, cart, created_at
    `;
    
    const user = result[0];
    const token = signToken({ id: user.id, email: user.email, iat: Date.now(), exp: Date.now() + 30 * 24 * 60 * 60 * 1000 }, jwtSecret);
    setCookie(res, 'user_token', token, 2592000);

    return res.status(201).json({ success: true, user });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

// POST /api/users/login
app.post('/api/users/login', async (req, res) => {
  const clientIp = req.ip || 'unknown';
  if (isRateLimited(clientIp, 'login')) {
    return res.status(429).json({ error: 'Demasiados intentos. Intenta de nuevo en 15 minutos.' });
  }

  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'Correo y contraseña son requeridos.' });
  }

  const cleanEmail = sanitizeString(email).toLowerCase();
  if (!EMAIL_REGEX.test(cleanEmail) || typeof password !== 'string' || password.length > MAX_PASSWORD_LENGTH) {
    return res.status(401).json({ error: 'Correo electrónico o contraseña incorrectos.' });
  }

  try {
    const users = await sql`SELECT * FROM usuarios WHERE email = ${cleanEmail}`;
    if (users.length === 0) {
      hashPassword('dummy-password-timing-safe');
      return res.status(401).json({ error: 'Correo electrónico o contraseña incorrectos.' });
    }

    const user = users[0];
    const isPasswordCorrect = verifyPassword(password, user.password_hash);
    if (!isPasswordCorrect) {
      return res.status(401).json({ error: 'Correo electrónico o contraseña incorrectos.' });
    }

    const token = signToken({ id: user.id, email: user.email, iat: Date.now(), exp: Date.now() + 30 * 24 * 60 * 60 * 1000 }, jwtSecret);
    setCookie(res, 'user_token', token, 2592000);

    const { password_hash, ...safeUser } = user;
    return res.status(200).json({ success: true, user: safeUser });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

// POST /api/users/logout
app.post('/api/users/logout', (req, res) => {
  res.clearCookie('user_token', { path: '/' });
  return res.status(200).json({ success: true });
});

// GET /api/users/session
app.get('/api/users/session', async (req, res) => {
  const token = req.cookies.user_token;
  if (token) {
    const session = verifyToken(token, jwtSecret);
    if (session && session.id) {
      try {
        const users = await sql`SELECT id, name, email, phone, google_email, cart, created_at FROM usuarios WHERE id = ${session.id}`;
        if (users.length > 0) {
          return res.status(200).json({ authenticated: true, user: users[0] });
        }
      } catch (err) {
        console.error(err);
      }
    }
  }
  return res.status(200).json({ authenticated: false });
});

// POST /api/users/forgot-password
app.post('/api/users/forgot-password', async (req, res) => {
  const clientIp = req.ip || 'unknown';
  if (isRateLimited(clientIp, 'forgot_password')) {
    return res.status(429).json({ error: 'Demasiados intentos. Intenta de nuevo en 15 minutos.' });
  }

  const { email } = req.body || {};
  if (!email) {
    return res.status(400).json({ error: 'El correo electrónico es requerido.' });
  }

  const cleanEmail = sanitizeString(email).toLowerCase();
  if (!EMAIL_REGEX.test(cleanEmail)) {
    return res.status(400).json({ error: 'Formato de correo electrónico inválido.' });
  }

  try {
    const userResult = await sql`SELECT id FROM usuarios WHERE email = ${cleanEmail}`;
    if (userResult.length === 0) {
      return res.status(200).json({ success: true, message: 'Si el correo está registrado, recibirás un código de verificación.' });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 15 * 60 * 1000);

    await sql`
      UPDATE usuarios 
      SET recovery_code = ${code}, recovery_expires = ${expires} 
      WHERE email = ${cleanEmail}
    `;

    console.log(`[RECOVERY CODE FOR ${cleanEmail}]: ${code}`); // Exponer en consola para dev y diagnóstico

    return res.status(200).json({ 
      success: true, 
      message: 'Si el correo está registrado, recibirás un código de verificación.',
      // Devolver devCode en local dev para facilitar pruebas
      devCode: code
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

// POST /api/users/reset-password
app.post('/api/users/reset-password', async (req, res) => {
  const clientIp = req.ip || 'unknown';
  if (isRateLimited(clientIp, 'reset_password')) {
    return res.status(429).json({ error: 'Demasiados intentos. Intenta de nuevo en 15 minutos.' });
  }

  const { email, code, newPassword } = req.body || {};
  if (!email || !code || !newPassword) {
    return res.status(400).json({ error: 'Todos los campos son requeridos.' });
  }

  const cleanEmail = sanitizeString(email).toLowerCase();
  const cleanCode = sanitizeString(code).trim();

  if (typeof newPassword !== 'string' || newPassword.length < MIN_PASSWORD_LENGTH || newPassword.length > MAX_PASSWORD_LENGTH) {
    return res.status(400).json({ error: `La contraseña debe tener entre ${MIN_PASSWORD_LENGTH} y ${MAX_PASSWORD_LENGTH} caracteres.` });
  }

  try {
    const userResult = await sql`SELECT id, recovery_code, recovery_expires FROM usuarios WHERE email = ${cleanEmail}`;
    if (userResult.length === 0) {
      return res.status(400).json({ error: 'Código o correo incorrecto.' });
    }

    const user = userResult[0];
    if (!user.recovery_code || !user.recovery_expires) {
      return res.status(400).json({ error: 'No se ha solicitado recuperación de contraseña.' });
    }

    const now = new Date();
    const expires = new Date(user.recovery_expires);

    if (now > expires) {
      return res.status(400).json({ error: 'El código ha expirado.' });
    }

    const codeBuffer = Buffer.from(user.recovery_code);
    const inputBuffer = Buffer.from(cleanCode);
    
    let isCodeValid = false;
    if (codeBuffer.length === inputBuffer.length) {
      isCodeValid = crypto.timingSafeEqual(codeBuffer, inputBuffer);
    } else {
      crypto.timingSafeEqual(codeBuffer, codeBuffer);
    }

    if (!isCodeValid) {
      return res.status(400).json({ error: 'Código de verificación incorrecto.' });
    }

    const passwordHash = hashPassword(newPassword);
    await sql`
      UPDATE usuarios 
      SET password_hash = ${passwordHash}, recovery_code = NULL, recovery_expires = NULL 
      WHERE email = ${cleanEmail}
    `;

    return res.status(200).json({ success: true, message: 'Tu contraseña ha sido restablecida con éxito.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

// GET /api/users/google -> Redirección a Google OAuth (Cliente)
app.get('/api/users/google', (req, res) => {
  const { connect } = req.query || {};
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const isLocalhost = req.headers.host.includes('localhost') || req.headers.host.includes('127.0.0.1');

  let connectUserId = null;
  if (connect === 'true') {
    const token = req.cookies.user_token;
    if (token) {
      const session = verifyToken(token, jwtSecret);
      if (session && session.id) {
        connectUserId = session.id;
      }
    }
    if (!connectUserId) {
      return res.status(401).json({ error: 'Debes iniciar sesión para conectar Google.' });
    }
  }

  const stateToken = connectUserId ? `connect:${connectUserId}:${crypto.randomBytes(16).toString('hex')}` : crypto.randomBytes(32).toString('hex');

  // Si no hay clientId en local dev, redirige inmediatamente con mock parameters para facilitar desarrollo local
  if (!clientId && isLocalhost) {
    const protocol = req.headers['x-forwarded-proto'] || req.protocol;
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const mockCallbackUrl = `${protocol}://${host}/api/users/callback?code=mock_code&state=${stateToken}`;
    
    res.cookie('oauth_state', stateToken, {
      path: '/api/users/callback',
      httpOnly: true,
      secure: false,
      sameSite: 'Lax',
      maxAge: 600 * 1000
    });
    
    return res.redirect(mockCallbackUrl);
  }

  if (!clientId) {
    return res.status(500).json({ error: 'Servicio OAuth no disponible.' });
  }

  const protocol = req.headers['x-forwarded-proto'] || req.protocol;
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const redirectUri = encodeURIComponent(`${protocol}://${host}/api/users/callback`);

  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=openid%20email%20profile&state=${stateToken}`;
  
  res.cookie('oauth_state', stateToken, {
    path: '/api/users/callback',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Lax',
    maxAge: 600 * 1000
  });
  
  res.redirect(googleAuthUrl);
});

// GET /api/users/callback -> Callback de Google OAuth (Cliente)
app.get('/api/users/callback', async (req, res) => {
  const { code, state } = req.query || {};
  if (!code) {
    return res.status(400).json({ error: 'Código de autorización faltante.' });
  }

  const storedState = req.cookies.oauth_state;
  if (!state || !storedState || state !== storedState) {
    console.warn('⚠️ OAuth CSRF detectado.');
    return res.status(403).json({ error: 'Validación de seguridad fallida.' });
  }

  res.clearCookie('oauth_state', { path: '/api/users/callback' });

  let userName = '';
  let userEmail = '';

  const isLocalhost = req.headers.host.includes('localhost') || req.headers.host.includes('127.0.0.1');
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (code === 'mock_code' && isLocalhost && (!clientId || !clientSecret)) {
    userName = 'Usuario Google Test';
    userEmail = 'test-google@example.com';
  } else {
    if (!clientId || !clientSecret) {
      return res.status(500).json({ error: 'Configuración OAuth incompleta en el servidor.' });
    }

    const protocol = req.headers['x-forwarded-proto'] || req.protocol;
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const redirectUri = `${protocol}://${host}/api/users/callback`;

    try {
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
        })
      });

      const tokenData = await tokenResponse.json();
      if (!tokenData.access_token) {
        return res.status(401).json({ error: 'Fallo en la autenticación de Google.' });
      }

      const userResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` }
      });
      const userData = await userResponse.json();

      userEmail = userData.email;
      userName = userData.name || userData.given_name || 'Usuario de Google';
      if (!userEmail) {
        return res.status(400).json({ error: 'No se pudo obtener el correo de Google.' });
      }
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Error de red durante la autenticación de Google.' });
    }
  }

  try {
    const cleanEmail = userEmail.toLowerCase();
    
    // Verificamos si es una acción de conectar cuenta
    if (state && state.startsWith('connect:')) {
      const parts = state.split(':');
      const userId = parseInt(parts[1], 10);
      
      // Comprobar si ese google_email ya está vinculado a OTRO usuario diferente
      const existingGoogleUser = await sql`SELECT id FROM usuarios WHERE google_email = ${cleanEmail} AND id != ${userId}`;
      if (existingGoogleUser.length > 0) {
        return res.redirect('/profile?connect_error=email_already_linked');
      }
      
      // Actualizamos el usuario
      await sql`UPDATE usuarios SET google_email = ${cleanEmail} WHERE id = ${userId}`;
      return res.redirect('/profile?connect_success=true');
    }

    // Flujo normal de login
    let users = await sql`
      SELECT id, name, email, phone, google_email, cart, created_at 
      FROM usuarios 
      WHERE email = ${cleanEmail} OR google_email = ${cleanEmail}
    `;
    let user;

    if (users.length === 0) {
      const cleanName = sanitizeString(userName).substring(0, 50);
      const dummyPassword = hashPassword('oauth-google-' + crypto.randomBytes(16).toString('hex'));
      
      const insertResult = await sql`
        INSERT INTO usuarios (name, email, password_hash, google_email, cart)
        VALUES (${cleanName}, ${cleanEmail}, ${dummyPassword}, ${cleanEmail}, '[]'::jsonb)
        RETURNING id, name, email, phone, google_email, cart, created_at
      `;
      user = insertResult[0];
    } else {
      user = users[0];
    }

    const token = signToken({ id: user.id, email: user.email, iat: Date.now(), exp: Date.now() + 30 * 24 * 60 * 60 * 1000 }, jwtSecret);
    setCookie(res, 'user_token', token, 2592000);
    
    res.redirect('/profile');
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error al iniciar sesión en la base de datos.' });
  }
});

// ═══════════════════════════════════════════════════════════════
//  OPERACIONES LOGUEADAS DE CLIENTE (CON MIDDLEWARE)
// ═══════════════════════════════════════════════════════════════

// POST /api/users/change-password
app.post('/api/users/change-password', verifyUserSessionMiddleware, async (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Todos los campos son requeridos.' });
  }

  if (typeof newPassword !== 'string' || newPassword.length < MIN_PASSWORD_LENGTH || newPassword.length > MAX_PASSWORD_LENGTH) {
    return res.status(400).json({ error: `La nueva contraseña debe tener entre ${MIN_PASSWORD_LENGTH} y ${MAX_PASSWORD_LENGTH} caracteres.` });
  }

  try {
    const userResult = await sql`SELECT * FROM usuarios WHERE id = ${req.userId}`;
    if (userResult.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    const user = userResult[0];
    const isPasswordCorrect = verifyPassword(currentPassword, user.password_hash);
    if (!isPasswordCorrect) {
      return res.status(400).json({ error: 'La contraseña actual es incorrecta.' });
    }

    const newHash = hashPassword(newPassword);
    await sql`UPDATE usuarios SET password_hash = ${newHash} WHERE id = ${req.userId}`;

    return res.status(200).json({ success: true, message: 'Contraseña actualizada con éxito.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error interno.' });
  }
});

// POST /api/users/update-profile
app.post('/api/users/update-profile', verifyUserSessionMiddleware, async (req, res) => {
  const { name, phone } = req.body || {};
  if (!name) {
    return res.status(400).json({ error: 'El nombre es requerido.' });
  }

  const cleanName = sanitizeString(name);
  const cleanPhone = phone ? sanitizeString(phone) : null;

  if (cleanName.length < 2 || cleanName.length > MAX_NAME_LENGTH) {
    return res.status(400).json({ error: `El nombre debe tener entre 2 y ${MAX_NAME_LENGTH} caracteres.` });
  }

  try {
    const result = await sql`
      UPDATE usuarios
      SET name = ${cleanName}, phone = ${cleanPhone}
      WHERE id = ${req.userId}
      RETURNING id, name, email, phone, google_email, cart, created_at
    `;
    if (result.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }
    return res.status(200).json({ success: true, user: result[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error al actualizar el perfil.' });
  }
});

// POST /api/users/disconnect-google
app.post('/api/users/disconnect-google', verifyUserSessionMiddleware, async (req, res) => {
  try {
    const result = await sql`
      UPDATE usuarios
      SET google_email = NULL
      WHERE id = ${req.userId}
      RETURNING id, name, email, phone, google_email, cart, created_at
    `;
    if (result.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }
    return res.status(200).json({ success: true, user: result[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error al desvincular Google.' });
  }
});

// GET /api/users/cart
app.get('/api/users/cart', verifyUserSessionMiddleware, async (req, res) => {
  try {
    const result = await sql`SELECT cart FROM usuarios WHERE id = ${req.userId}`;
    if (result.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }
    return res.status(200).json(result[0].cart || []);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error al obtener el carrito.' });
  }
});

// PUT /api/users/cart
app.put('/api/users/cart', verifyUserSessionMiddleware, async (req, res) => {
  const { cart } = req.body || {};
  if (!validateCart(cart)) {
    return res.status(400).json({ error: 'El carrito contiene datos inválidos.' });
  }

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

  try {
    const result = await sql`
      UPDATE usuarios
      SET cart = ${JSON.stringify(sanitizedCart)}
      WHERE id = ${req.userId}
      RETURNING cart
    `;
    
    if (result.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }
    return res.status(200).json(result[0].cart);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error al guardar el carrito.' });
  }
});

// ═══════════════════════════════════════════════════════════════
//  3. PRODUCT CATALOG ENDPOINTS (/api/products)
// ═══════════════════════════════════════════════════════════════

// GET /api/products
app.get('/api/products', async (req, res) => {
  // Comprobar si hay sesión admin activa para ver productos ocultos
  let adminSession = null;
  const adminToken = req.cookies.admin_token;
  if (adminToken) {
    adminSession = verifyToken(adminToken, jwtSecret);
  }

  try {
    let products;
    if (adminSession && adminSession.role === 'admin') {
      products = await sql`SELECT * FROM productos ORDER BY id ASC`;
    } else {
      products = await sql`SELECT * FROM productos WHERE visible = true ORDER BY id ASC`;
    }
    return res.status(200).json(products);
  } catch (err) {
    console.error('Error fetching products:', err);
    return res.status(500).json({ error: 'Error al obtener los productos.' });
  }
});

// POST /api/products (Admin only)
app.post('/api/products', verifySessionMiddleware, async (req, res) => {
  const { name, tipo, fruta, image, precio, precios, brand, visible, bg_color, text_color } = req.body || {};
  if (!name || !tipo || !fruta) {
    return res.status(400).json({ error: 'name, tipo y fruta son requeridos.' });
  }

  const queryPrecios = precios ? JSON.stringify(precios) : null;
  const isVisible = visible !== false;
  
  try {
    const result = await sql`
      INSERT INTO productos (name, tipo, fruta, image, precio, precios, brand, visible, bg_color, text_color)
      VALUES (${name}, ${tipo}, ${fruta}, ${image || null}, ${precio || null}, ${queryPrecios}, ${brand || 'Abunga'}, ${isVisible}, ${bg_color || null}, ${text_color || null})
      RETURNING *
    `;
    return res.status(201).json(result[0]);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error al crear producto.' });
  }
});

// PUT /api/products (Admin only)
app.put('/api/products', verifySessionMiddleware, async (req, res) => {
  const { id, name, tipo, fruta, image, precio, precios, brand, visible, bg_color, text_color } = req.body || {};
  if (!id) {
    return res.status(400).json({ error: 'id del producto es requerido.' });
  }

  const queryPrecios = precios ? JSON.stringify(precios) : null;
  const isVisible = visible !== false;

  try {
    const result = await sql`
      UPDATE productos
      SET name = ${name}, tipo = ${tipo}, fruta = ${fruta}, image = ${image}, precio = ${precio}, precios = ${queryPrecios}, brand = ${brand}, visible = ${isVisible}, bg_color = ${bg_color || null}, text_color = ${text_color || null}
      WHERE id = ${id}
      RETURNING *
    `;
    if (result.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado.' });
    }
    return res.status(200).json(result[0]);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error al actualizar producto.' });
  }
});

// DELETE /api/products (Admin only)
app.delete('/api/products', verifySessionMiddleware, async (req, res) => {
  const { id } = req.query || {};
  if (!id) {
    return res.status(400).json({ error: 'El parámetro id es requerido.' });
  }

  try {
    const result = await sql`
      DELETE FROM productos
      WHERE id = ${id}
      RETURNING *
    `;
    if (result.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado.' });
    }
    return res.status(200).json({ message: 'Producto eliminado.', product: result[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error al eliminar producto.' });
  }
});

// ═══════════════════════════════════════════════════════════════
//  4. NEWS ENDPOINTS (/api/news)
// ═══════════════════════════════════════════════════════════════

// GET /api/news
app.get('/api/news', async (req, res) => {
  try {
    const news = await sql`SELECT * FROM noticias ORDER BY created_at DESC`;
    return res.status(200).json(news);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error al obtener novedades.' });
  }
});

// POST /api/news (Admin only)
app.post('/api/news', verifySessionMiddleware, async (req, res) => {
  const { title, content, image } = req.body || {};
  if (!title || !content) {
    return res.status(400).json({ error: 'title y content son requeridos.' });
  }

  try {
    const result = await sql`
      INSERT INTO noticias (title, content, image)
      VALUES (${title}, ${content}, ${image || null})
      RETURNING *
    `;
    return res.status(201).json(result[0]);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error al crear noticia.' });
  }
});

// DELETE /api/news (Admin only)
app.delete('/api/news', verifySessionMiddleware, async (req, res) => {
  const { id } = req.query || {};
  if (!id) {
    return res.status(400).json({ error: 'El parámetro id es requerido.' });
  }

  try {
    const result = await sql`
      DELETE FROM noticias
      WHERE id = ${id}
      RETURNING *
    `;
    if (result.length === 0) {
      return res.status(404).json({ error: 'Noticia no encontrada.' });
    }
    return res.status(200).json({ message: 'Noticia eliminada.', news: result[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error al eliminar noticia.' });
  }
});

// ═══════════════════════════════════════════════════════════════
//  5. CLOUDINARY UPLOAD ENDPOINT (/api/upload)
// ═══════════════════════════════════════════════════════════════

// POST /api/upload (Admin only)
app.post('/api/upload', verifySessionMiddleware, async (req, res) => {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    return res.status(500).json({ error: 'Cloudinary no está configurado en el servidor.' });
  }

  const { file, folder = 'abunga-products' } = req.body || {};
  if (!file) {
    return res.status(400).json({ error: 'El campo "file" (base64) es requerido.' });
  }

  if (typeof file !== 'string' || file.length > 7 * 1024 * 1024) {
    return res.status(413).json({ error: 'El archivo excede el tamaño máximo permitido (5MB).' });
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(folder)) {
    return res.status(400).json({ error: 'Nombre de carpeta no válido.' });
  }

  try {
    const timestamp = Math.round(Date.now() / 1000);
    const paramsToSign = `folder=${folder}&timestamp=${timestamp}`;
    const signature = crypto
      .createHash('sha256')
      .update(paramsToSign + apiSecret)
      .digest('hex');

    const formData = new URLSearchParams();
    formData.append('file', file);
    formData.append('api_key', apiKey);
    formData.append('timestamp', timestamp.toString());
    formData.append('signature', signature);
    formData.append('folder', folder);

    const cloudinaryRes = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString(),
      }
    );

    const data = await cloudinaryRes.json();
    if (!cloudinaryRes.ok || data.error) {
      console.error('Cloudinary API Error:', data);
      return res.status(502).json({ error: 'Error al subir la imagen a Cloudinary.' });
    }

    return res.status(200).json({
      url: data.secure_url,
      public_id: data.public_id,
      width: data.width,
      height: data.height,
    });
  } catch (err) {
    console.error('Upload Process Error:', err);
    return res.status(500).json({ error: 'Error interno al procesar la carga de la imagen.' });
  }
});

// ═══════════════════════════════════════════════════════════════
//  INICIALIZACIÓN DEL SERVIDOR
// ═══════════════════════════════════════════════════════════════

app.listen(PORT, () => {
  console.log(`🚀 Servidor backend Express ejecutándose en http://localhost:${PORT}`);
  console.log(`🔒 Entorno: ${process.env.NODE_ENV || 'development'}`);
});
