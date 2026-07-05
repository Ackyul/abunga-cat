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
//  SESIÓN DE ADMINISTRADOR
// ═══════════════════════════════════════════════════════════════

export function verifySession(req) {
  const cookieHeader = req.headers.cookie || '';
  const token = cookieHeader
    .split(';')
    .find(c => c.trim().startsWith('admin_token='))
    ?.split('=')[1];
    
  if (!token) return null;
  
  const secret = process.env.JWT_SECRET;
  if (!secret) return null; // NUNCA usar un secret por defecto
  return verifyToken(token, secret);
}

// ═══════════════════════════════════════════════════════════════
//  RATE LIMITING EN MEMORIA (protección contra fuerza bruta)
// ═══════════════════════════════════════════════════════════════

const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutos
const RATE_LIMIT_MAX_ATTEMPTS = 5; // Máximo 5 intentos para admin login

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

// Limpiar entradas viejas periódicamente
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap) {
    if (now - entry.startTime > RATE_LIMIT_WINDOW_MS) {
      rateLimitMap.delete(key);
    }
  }
}, 5 * 60 * 1000);

// ═══════════════════════════════════════════════════════════════
//  HANDLER PRINCIPAL
// ═══════════════════════════════════════════════════════════════

export default async function handler(req, res) {
  // Cabeceras de seguridad
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.setHeader('Pragma', 'no-cache');

  const allowedOrigin = req.headers.origin || '';
  const host = req.headers.host || '';
  const isLocalDev = host.includes('localhost') || host.includes('127.0.0.1');
  
  if (isLocalDev) {
    res.setHeader('Access-Control-Allow-Origin', allowedOrigin || '*');
  } else {
    res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const jwtSecret = process.env.JWT_SECRET;
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminEmail = process.env.ADMIN_EMAIL;
  
  if (!jwtSecret) {
    console.error('CRITICAL: JWT_SECRET no está configurado.');
    return res.status(500).json({ error: 'Servicio no disponible temporalmente.' });
  }

  const url = req.url || '';
  const action = url.split('?')[0].split('/').pop();
  const clientIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown';

  // 1. GET /api/auth/session -> Comprobar si hay sesión activa
  if (action === 'session' && req.method === 'GET') {
    const session = verifySession(req);
    if (session) {
      return res.status(200).json({ authenticated: true, email: session.email });
    }
    return res.status(200).json({ authenticated: false });
  }

  // 2. POST /api/auth/login -> Login por Contraseña (admin)
  if (action === 'login' && req.method === 'POST') {
    // Rate limiting estricto para el panel admin
    if (isRateLimited(clientIp, 'admin_login')) {
      console.warn(`⚠️ Rate limit alcanzado para IP: ${clientIp} en admin login`);
      return res.status(429).json({ error: 'Demasiados intentos de inicio de sesión. Intenta de nuevo en 15 minutos.' });
    }

    const { password } = req.body || {};
    if (!adminPassword) {
      return res.status(500).json({ error: 'Servicio no disponible temporalmente.' });
    }
    
    if (!password || typeof password !== 'string' || password.length > 200) {
      return res.status(401).json({ error: 'Contraseña de administrador incorrecta.' });
    }

    // Comparación de tiempo constante para la contraseña de admin
    const passwordBuffer = Buffer.from(password);
    const adminBuffer = Buffer.from(adminPassword);
    
    let isMatch = false;
    if (passwordBuffer.length === adminBuffer.length) {
      isMatch = crypto.timingSafeEqual(passwordBuffer, adminBuffer);
    } else {
      // Si longitudes difieren, hacer comparación ficticia para mantener timing constante
      crypto.timingSafeEqual(adminBuffer, adminBuffer);
      isMatch = false;
    }

    if (isMatch) {
      const token = signToken({ 
        email: adminEmail || 'admin@abunga.com',
        role: 'admin',
        iat: Date.now(),
        exp: Date.now() + 24 * 60 * 60 * 1000 // 24 horas
      }, jwtSecret);
      
      const isLocalhost = host.includes('localhost') || host.includes('127.0.0.1');
      const secureFlag = isLocalhost ? '' : 'Secure;';
      res.setHeader('Set-Cookie', `admin_token=${token}; Path=/; HttpOnly; ${secureFlag} SameSite=Strict; Max-Age=86400`);
      return res.status(200).json({ success: true, email: adminEmail || 'admin@abunga.com' });
    }
    
    return res.status(401).json({ error: 'Contraseña de administrador incorrecta.' });
  }

  // 3. GET /api/auth/google -> Redirección a Google OAuth
  if (action === 'google' && req.method === 'GET') {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      return res.status(500).json({ error: 'Servicio OAuth no disponible.' });
    }

    // Generar un state token anti-CSRF para el flujo OAuth
    const stateToken = crypto.randomBytes(32).toString('hex');
    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const forwardedHost = req.headers['x-forwarded-host'] || req.headers.host;
    const redirectUri = encodeURIComponent(`${protocol}://${forwardedHost}/api/auth/callback`);

    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=openid%20email%20profile&state=${stateToken}`;
    
    // Guardar state en cookie temporal para validar en callback
    const isLocalhost = host.includes('localhost') || host.includes('127.0.0.1');
    const secureFlag = isLocalhost ? '' : 'Secure;';
    res.setHeader('Set-Cookie', `oauth_state=${stateToken}; Path=/api/auth/callback; HttpOnly; ${secureFlag} SameSite=Lax; Max-Age=600`);
    
    res.writeHead(302, { Location: googleAuthUrl });
    return res.end();
  }

  // 4. GET /api/auth/callback -> Callback de Google OAuth
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

    // Limpiar la cookie de state
    res.setHeader('Set-Cookie', 'oauth_state=; Path=/api/auth/callback; HttpOnly; Secure; SameSite=Lax; Max-Age=0');

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    
    if (!clientId || !clientSecret) {
      return res.status(500).json({ error: 'Configuración OAuth incompleta.' });
    }

    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const forwardedHost = req.headers['x-forwarded-host'] || req.headers.host;
    const redirectUri = `${protocol}://${forwardedHost}/api/auth/callback`;

    try {
      // 4.1 Intercambiar código por token de acceso
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

      // 4.2 Obtener los datos del usuario de Google
      const userResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` }
      });
      const userData = await userResponse.json();

      const userEmail = userData.email;
      if (!userEmail) {
        return res.status(400).json({ error: 'No se pudo obtener el correo.' });
      }

      // 4.3 Validar que sea el Administrador autorizado
      if (!adminEmail || userEmail.toLowerCase() !== adminEmail.toLowerCase()) {
        // No revelar qué correo se usó en la respuesta HTML - usar texto genérico
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.status(403).end(`
          <html>
            <head><meta charset="utf-8"/><title>Acceso Denegado</title></head>
            <body style="font-family:sans-serif; text-align:center; padding:50px; background:#fafafa;">
              <div style="max-width:500px; margin:auto; background:white; padding:40px; border-radius:20px; box-shadow:0 4px 12px rgba(0,0,0,0.1);">
                <h1 style="color:#e24052; font-size:36px; margin-bottom:10px;">Acceso Denegado</h1>
                <p style="color:#666; font-size:16px; line-height:1.6;">La cuenta proporcionada no está autorizada para administrar este sitio.</p>
                <a href="/admin" style="display:inline-block; margin-top:20px; background:#95b721; color:white; padding:12px 24px; border-radius:30px; text-decoration:none; font-weight:bold;">Volver al Login</a>
              </div>
            </body>
          </html>
        `);
      }

      // 4.4 Generar Token de sesión y redirigir
      const token = signToken({ 
        email: userEmail,
        role: 'admin',
        iat: Date.now(),
        exp: Date.now() + 24 * 60 * 60 * 1000 // 24 horas
      }, jwtSecret);

      const isLocal = host.includes('localhost') || host.includes('127.0.0.1');
      const secureF = isLocal ? '' : 'Secure;';
      res.setHeader('Set-Cookie', `admin_token=${token}; Path=/; HttpOnly; ${secureF} SameSite=Strict; Max-Age=86400`);
      
      res.writeHead(302, { Location: '/admin' });
      return res.end();
    } catch (err) {
      console.error('Error durante OAuth:', err);
      // NO exponer detalles del error
      return res.status(500).json({ error: 'Error durante la autenticación.' });
    }
  }

  // 5. POST /api/auth/logout -> Cerrar Sesión
  if (action === 'logout' && req.method === 'POST') {
    const isLocalhost = host.includes('localhost') || host.includes('127.0.0.1');
    const secureFlag = isLocalhost ? '' : 'Secure;';
    res.setHeader('Set-Cookie', `admin_token=; Path=/; HttpOnly; ${secureFlag} SameSite=Strict; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT`);
    return res.status(200).json({ success: true });
  }

  return res.status(404).json({ error: 'Acción no encontrada.' });
}
