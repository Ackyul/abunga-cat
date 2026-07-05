import crypto from 'crypto';
import { verifySession } from './auth.js';

export default async function handler(req, res) {
  // Cabeceras de seguridad
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');

  const allowedOrigin = req.headers.origin || '';
  const host = req.headers.host || '';
  const isLocalDev = host.includes('localhost') || host.includes('127.0.0.1');
  
  if (isLocalDev) {
    res.setHeader('Access-Control-Allow-Origin', allowedOrigin || '*');
  } else {
    res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido.' });

  // Requiere sesión admin
  const session = verifySession(req);
  if (!session) {
    return res.status(401).json({ error: 'No autorizado. Inicia sesión como administrador.' });
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    return res.status(500).json({ error: 'Cloudinary no está configurado en el servidor.' });
  }

  try {
    const { file, folder = 'abunga-products' } = req.body || {};

    if (!file) {
      return res.status(400).json({ error: 'El campo "file" (base64) es requerido.' });
    }

    // Validar tamaño del archivo (máximo ~5MB en base64)
    if (typeof file !== 'string' || file.length > 7 * 1024 * 1024) {
      return res.status(413).json({ error: 'El archivo excede el tamaño máximo permitido (5MB).' });
    }

    // Validar que el folder solo contenga caracteres seguros
    if (!/^[a-zA-Z0-9_-]+$/.test(folder)) {
      return res.status(400).json({ error: 'Nombre de carpeta no válido.' });
    }

    // Generar firma para Cloudinary (upload firmado)
    const timestamp = Math.round(Date.now() / 1000);
    const paramsToSign = `folder=${folder}&timestamp=${timestamp}`;
    const signature = crypto
      .createHash('sha256')
      .update(paramsToSign + apiSecret)
      .digest('hex');

    // Subir a Cloudinary via REST API
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
      console.error('Error Cloudinary:', data);
      return res.status(502).json({ error: 'Error al subir imagen.' });
    }

    return res.status(200).json({
      url: data.secure_url,
      public_id: data.public_id,
      width: data.width,
      height: data.height,
    });
  } catch (err) {
    console.error('Error en upload:', err);
    return res.status(500).json({ error: 'Error interno al procesar la imagen.' });
  }
}
