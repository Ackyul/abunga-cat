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
//  ENVÍO DE EMAILS MEDIANTE RESEND
// ═══════════════════════════════════════════════════════════════

async function sendRecoveryEmail(email, code) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("⚠️ Advertencia: RESEND_API_KEY no está configurada en .env.");
    return false;
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: "Abunga Seguridad <seguridad@abungasaborqueretumba.com>",
        to: [email],
        subject: "Código de recuperación de contraseña - Abunga",
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #eee; border-radius: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
            <div style="text-align: center; margin-bottom: 20px;">
              <h2 style="color: #95b721; margin: 0; font-size: 28px; font-weight: 800;">abunga</h2>
              <p style="color: #666; margin: 5px 0 0 0; font-size: 14px; text-transform: uppercase; letter-spacing: 2px;">Snacks Naturales</p>
            </div>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
            <h3 style="color: #333; font-size: 20px; font-weight: 700; margin-bottom: 15px;">Recuperación de Contraseña</h3>
            <p style="color: #555; line-height: 1.6; font-size: 16px;">Has solicitado restablecer tu contraseña de Abunga. Utiliza el siguiente código de verificación de 6 dígitos para completar el proceso:</p>
            <div style="text-align: center; margin: 30px 0;">
              <span style="display: inline-block; font-family: monospace; font-size: 36px; font-weight: 900; letter-spacing: 6px; background-color: #f9f9f9; padding: 15px 30px; border-radius: 15px; border: 2px dashed #95b721; color: #a20087; box-shadow: inset 0 2px 4px rgba(0,0,0,0.02);">
                ${code}
              </span>
            </div>
            <p style="color: #888; font-size: 13px; line-height: 1.5;">Este código es de un solo uso y expirará en <strong>15 minutos</strong> por motivos de seguridad.</p>
            <p style="color: #555; line-height: 1.6; font-size: 16px;">Si tú no solicitaste este cambio, puedes ignorar este correo con total tranquilidad. Tu cuenta sigue estando segura.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
            <p style="color: #aaa; font-size: 11px; text-align: center; margin: 0;">© ${new Date().getFullYear()} Abunga · Arequipa, Perú. Todos los derechos reservados.</p>
          </div>
        `
      })
    });

    if (!res.ok) {
      const errData = await res.json();
      console.error("❌ Error de Resend API:", errData);
      return false;
    }
    return true;
  } catch (err) {
    console.error("❌ Error de red con Resend:", err);
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════
//  RATE LIMITING EN MEMORIA (por IP, por acción)
//  Protección contra fuerza bruta en login, registro y recuperación
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
  return str.trim().replace(/[<>]/g, ''); // Elimina < y > para prevenir inyección HTML
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

  // CORS estricto
  const allowedOrigin = req.headers.origin || '';
  const host = req.headers.host || '';
  const isLocalDev = host.includes('localhost') || host.includes('127.0.0.1');
  
  if (isLocalDev) {
    res.setHeader('Access-Control-Allow-Origin', allowedOrigin || '*');
  } else {
    res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Validar tamaño del body
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
      if (isRateLimited(clientIp, 'register')) {
        return res.status(429).json({ error: 'Demasiados intentos. Intenta de nuevo en 15 minutos.' });
      }

      const { name, email, password } = req.body || {};
      
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

      setSessionCookie(user);
      
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
        const users = await sql`SELECT id, name, email, cart, created_at FROM usuarios WHERE id = ${session.id}`;
        if (users.length > 0) {
          return res.status(200).json({ authenticated: true, user: users[0] });
        }
      }
      return res.status(200).json({ authenticated: false });
    }

    // ─── 5. POST /api/users/forgot-password ──────────────────────
    if (action === 'forgot-password' && req.method === 'POST') {
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

      const userResult = await sql`SELECT id FROM usuarios WHERE email = ${cleanEmail}`;
      if (userResult.length === 0) {
        // Responder con éxito simulado para evitar enumeración de usuarios
        return res.status(200).json({ success: true, message: 'Si el correo está registrado, recibirás un código de verificación.' });
      }

      // Código de 6 dígitos aleatorio
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos de validez

      await sql`
        UPDATE usuarios 
        SET recovery_code = ${code}, recovery_expires = ${expires} 
        WHERE email = ${cleanEmail}
      `;

      const sent = await sendRecoveryEmail(cleanEmail, code);
      console.log(`[RECOVERY CODE FOR ${cleanEmail}]: ${code} (Enviado: ${sent ? 'SÍ' : 'NO - Resend no configurado o fallido'})`);

      return res.status(200).json({ 
        success: true, 
        message: 'Si el correo está registrado, recibirás un código de verificación.',
        // Si no se pudo enviar y estamos en desarrollo local, exponemos el código para que prueben sin problemas
        ...(isLocalDev && !sent ? { devCode: code } : {})
      });
    }

    // ─── 6. POST /api/users/reset-password ──────────────────────
    if (action === 'reset-password' && req.method === 'POST') {
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
    }

    // ─── 6b. GET /api/users/google -> Redirección a Google OAuth
    if (action === 'google' && req.method === 'GET') {
      const clientId = process.env.GOOGLE_CLIENT_ID;
      const isLocalhost = host.includes('localhost') || host.includes('127.0.0.1');

      // Si no hay clientId y es desarrollo local, redirigimos directamente a callback con mock parameters
      if (!clientId && isLocalhost) {
        const protocol = req.headers['x-forwarded-proto'] || 'http';
        const forwardedHost = req.headers['x-forwarded-host'] || req.headers.host;
        const mockCallbackUrl = `${protocol}://${forwardedHost}/api/users/callback?code=mock_code&state=mock_state`;
        
        const secureFlag = isLocalhost ? '' : 'Secure;';
        res.setHeader('Set-Cookie', `oauth_state=mock_state; Path=/api/users/callback; HttpOnly; ${secureFlag} SameSite=Lax; Max-Age=600`);
        
        res.writeHead(302, { Location: mockCallbackUrl });
        return res.end();
      }

      if (!clientId) {
        return res.status(500).json({ error: 'Servicio OAuth no disponible (Falta GOOGLE_CLIENT_ID).' });
      }

      // Generar un state token anti-CSRF para el flujo OAuth
      const stateToken = crypto.randomBytes(32).toString('hex');
      const protocol = req.headers['x-forwarded-proto'] || 'http';
      const forwardedHost = req.headers['x-forwarded-host'] || req.headers.host;
      const redirectUri = encodeURIComponent(`${protocol}://${forwardedHost}/api/users/callback`);

      const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=openid%20email%20profile&state=${stateToken}`;
      
      // Guardar state en cookie temporal para validar en callback
      const secureFlag = isLocalhost ? '' : 'Secure;';
      res.setHeader('Set-Cookie', `oauth_state=${stateToken}; Path=/api/users/callback; HttpOnly; ${secureFlag} SameSite=Lax; Max-Age=600`);
      
      res.writeHead(302, { Location: googleAuthUrl });
      return res.end();
    }

    // ─── 6c. GET /api/users/callback -> Callback de Google OAuth
    if (action === 'callback' && req.method === 'GET') {
      const { code, state } = req.query || {};
      if (!code) {
        return res.status(400).json({ error: 'Código de autorización faltante.' });
      }

      // Validar state token anti-CSRF
      const cookieHeader = req.headers.cookie || '';
      const storedState = cookieHeader
        .split(';')
        .find(c => c.trim().startsWith('oauth_state='))
        ?.split('=')[1];

      if (!state || !storedState || state !== storedState) {
        console.warn('⚠️ OAuth state mismatch - posible CSRF detectado');
        return res.status(403).json({ error: 'Validación de seguridad fallida. Intenta de nuevo.' });
      }

      const isLocalhost = host.includes('localhost') || host.includes('127.0.0.1');
      // Limpiar la cookie de state
      const secureFlag = isLocalhost ? '' : 'Secure;';
      res.setHeader('Set-Cookie', `oauth_state=; Path=/api/users/callback; HttpOnly; ${secureFlag} SameSite=Lax; Max-Age=0`);

      let userName = '';
      let userEmail = '';

      const clientId = process.env.GOOGLE_CLIENT_ID;
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

      // Si no hay el mock_code local
      if (code === 'mock_code' && isLocalhost && (!clientId || !clientSecret)) {
        userName = 'Usuario Google Test';
        userEmail = 'test-google@example.com';
      } else {
        if (!clientId || !clientSecret) {
          return res.status(500).json({ error: 'Configuración OAuth incompleta en el servidor.' });
        }

        const protocol = req.headers['x-forwarded-proto'] || 'http';
        const forwardedHost = req.headers['x-forwarded-host'] || req.headers.host;
        const redirectUri = `${protocol}://${forwardedHost}/api/users/callback`;

        try {
          // Intercambiar código por token de acceso
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

          // Obtener los datos del usuario de Google
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
          console.error('Error al verificar OAuth con Google:', err);
          return res.status(500).json({ error: 'Error de red durante la autenticación de Google.' });
        }
      }

      // Buscar si el usuario ya existe en la DB
      try {
        const cleanEmail = userEmail.toLowerCase();
        let users = await sql`SELECT id, name, email, cart, created_at FROM usuarios WHERE email = ${cleanEmail}`;
        let user;

        if (users.length === 0) {
          // Si no existe, registrar el usuario nuevo con contraseña mock inútil
          const cleanName = sanitizeString(userName).substring(0, 50);
          const dummyPassword = hashPassword('oauth-google-' + crypto.randomBytes(16).toString('hex'));
          
          const insertResult = await sql`
            INSERT INTO usuarios (name, email, password_hash, cart)
            VALUES (${cleanName}, ${cleanEmail}, ${dummyPassword}, '[]'::jsonb)
            RETURNING id, name, email, cart, created_at
          `;
          user = insertResult[0];
        } else {
          user = users[0];
        }

        // Establecer la cookie de sesión y redirigir
        setSessionCookie(user);
        res.writeHead(302, { Location: '/profile' });
        return res.end();
      } catch (err) {
        console.error('Error de base de datos en Google Callback:', err);
        return res.status(500).json({ error: 'Error al iniciar sesión en la base de datos.' });
      }
    }

    // ─── 7. Operaciones que requieren sesión activa ──────────────
    const session = verifyUserSession(req);
    if (!session) {
      return res.status(401).json({ error: 'No autorizado. Debe iniciar sesión.' });
    }

    // POST /api/users/change-password
    if (action === 'change-password' && req.method === 'POST') {
      const { currentPassword, newPassword } = req.body || {};
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Todos los campos son requeridos.' });
      }

      if (typeof newPassword !== 'string' || newPassword.length < MIN_PASSWORD_LENGTH || newPassword.length > MAX_PASSWORD_LENGTH) {
        return res.status(400).json({ error: `La nueva contraseña debe tener entre ${MIN_PASSWORD_LENGTH} y ${MAX_PASSWORD_LENGTH} caracteres.` });
      }

      const userResult = await sql`SELECT * FROM usuarios WHERE id = ${session.id}`;
      if (userResult.length === 0) {
        return res.status(404).json({ error: 'Usuario no encontrado.' });
      }

      const user = userResult[0];
      const isPasswordCorrect = verifyPassword(currentPassword, user.password_hash);
      if (!isPasswordCorrect) {
        return res.status(400).json({ error: 'La contraseña actual es incorrecta.' });
      }

      const newHash = hashPassword(newPassword);
      await sql`UPDATE usuarios SET password_hash = ${newHash} WHERE id = ${session.id}`;

      return res.status(200).json({ success: true, message: 'Contraseña actualizada con éxito.' });
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
    console.error('❌ Error en API de usuarios:', error);
    return res.status(500).json({ error: 'Error interno del servidor.' });
  }
}
