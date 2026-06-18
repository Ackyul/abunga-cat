import crypto from 'crypto';
import { verifySession } from './auth.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

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
      return res.status(502).json({ error: 'Error al subir imagen a Cloudinary.', details: data.error?.message });
    }

    return res.status(200).json({
      url: data.secure_url,
      public_id: data.public_id,
      width: data.width,
      height: data.height,
    });
  } catch (err) {
    console.error('Error en upload:', err);
    return res.status(500).json({ error: 'Error interno al procesar la imagen.', details: err.message });
  }
}
