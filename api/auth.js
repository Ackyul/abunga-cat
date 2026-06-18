import crypto from 'crypto';

// Utilidades JWT Nativas de Alta Velocidad (sin dependencias de terceros)
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

export function verifySession(req) {
  const cookieHeader = req.headers.cookie || '';
  const token = cookieHeader
    .split(';')
    .find(c => c.trim().startsWith('admin_token='))
    ?.split('=')[1];
    
  if (!token) return null;
  
  const secret = process.env.JWT_SECRET || 'default-super-secret-jwt-key';
  return verifyToken(token, secret);
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const jwtSecret = process.env.JWT_SECRET || 'default-super-secret-jwt-key';
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminEmail = process.env.ADMIN_EMAIL;
  
  // Analizar la ruta para simular sub-rutas (ej: /api/auth/login, /api/auth/google)
  const url = req.url || '';
  const action = url.split('?')[0].split('/').pop();

  // 1. GET /api/auth/session -> Comprobar si hay sesión activa
  if (action === 'session' && req.method === 'GET') {
    const session = verifySession(req);
    if (session) {
      return res.status(200).json({ authenticated: true, email: session.email });
    }
    return res.status(200).json({ authenticated: false });
  }

  // 2. POST /api/auth/login -> Login por Contraseña
  if (action === 'login' && req.method === 'POST') {
    const { password } = req.body || {};
    if (!adminPassword) {
      return res.status(500).json({ error: 'ADMIN_PASSWORD no está configurado en el servidor.' });
    }
    
    if (password === adminPassword) {
      const token = signToken({ 
        email: adminEmail || 'admin@abunga.com', 
        exp: Date.now() + 24 * 60 * 60 * 1000 // 24 horas
      }, jwtSecret);
      
      const host = req.headers.host || '';
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
      return res.status(500).json({ error: 'GOOGLE_CLIENT_ID no está configurado en el servidor.' });
    }

    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const redirectUri = encodeURIComponent(`${protocol}://${host}/api/auth/callback`);

    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=openid%20email%20profile`;
    
    // Redirigir directamente al consentimiento de Google
    res.writeHead(302, { Location: googleAuthUrl });
    return res.end();
  }

  // 4. GET /api/auth/callback -> Callback de Google OAuth
  if (action === 'callback' && req.method === 'GET') {
    const { code } = req.query || {};
    if (!code) {
      return res.status(400).json({ error: 'Código de autorización de Google faltante.' });
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    
    if (!clientId || !clientSecret) {
      return res.status(500).json({ error: 'Configuración OAuth de Google incompleta en el servidor.' });
    }

    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const redirectUri = `${protocol}://${host}/api/auth/callback`;

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
        return res.status(401).json({ error: 'Fallo al obtener el token de acceso de Google.', details: tokenData });
      }

      // 4.2 Obtener los datos del usuario de Google
      const userResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` }
      });
      const userData = await userResponse.json();

      const userEmail = userData.email;
      if (!userEmail) {
        return res.status(400).json({ error: 'No se pudo obtener el correo de Google.' });
      }

      // 4.3 Validar que el correo del usuario sea exactamente el del Administrador autorizado
      if (!adminEmail || userEmail.toLowerCase() !== adminEmail.toLowerCase()) {
        return res.status(403).write(`
          <html>
            <head><meta charset="utf-8"/><title>Acceso Denegado</title></head>
            <body style="font-family:sans-serif; text-align:center; padding:50px; background:#fafafa;">
              <div style="max-width:500px; margin:auto; background:white; padding:40px; border-radius:20px; box-shadow:0 4px 12px rgba(0,0,0,0.1);">
                <h1 style="color:#e24052; font-size:36px; margin-bottom:10px;">Acceso Denegado</h1>
                <p style="color:#666; font-size:16px; line-height:1.6;">El correo <strong>${userEmail}</strong> no está autorizado para administrar este sitio.</p>
                <a href="/admin" style="display:inline-block; margin-top:20px; background:#95b721; color:white; padding:12px 24px; border-radius:30px; text-decoration:none; font-weight:bold;">Volver al Login</a>
              </div>
            </body>
          </html>
        `);
      }

      // 4.4 Generar Token de sesión y redirigir
      const token = signToken({ 
        email: userEmail, 
        exp: Date.now() + 24 * 60 * 60 * 1000 // 24 horas
      }, jwtSecret);

      const hostHeader = req.headers.host || '';
      const isLocal = hostHeader.includes('localhost') || hostHeader.includes('127.0.0.1');
      const secureF = isLocal ? '' : 'Secure;';
      res.setHeader('Set-Cookie', `admin_token=${token}; Path=/; HttpOnly; ${secureF} SameSite=Strict; Max-Age=86400`);
      
      // Redirigir de vuelta al panel de administrador
      res.writeHead(302, { Location: '/admin' });
      return res.end();
    } catch (err) {
      console.error('Error durante intercambio de OAuth:', err);
      return res.status(500).json({ error: 'Excepción interna en la autenticación de Google.', details: err.message });
    }
  }

  // 5. POST /api/auth/logout -> Cerrar Sesión
  if (action === 'logout' && req.method === 'POST') {
    res.setHeader('Set-Cookie', 'admin_token=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT');
    return res.status(200).json({ success: true });
  }

  return res.status(404).json({ error: 'Acción de autenticación no encontrada.' });
}
