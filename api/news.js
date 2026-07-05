import { neon } from '@neondatabase/serverless';
import { verifySession } from './auth.js';

const FALLBACK_NEWS = [
  {
    "id": 1,
    "title": "¡Lanzamiento de nuestra web!",
    "content": "Bienvenidos a nuestra nueva tienda en línea de Abunga. Ahora puedes armar tus mixtos deshidratados de forma personalizada desde la comodidad de tu hogar.",
    "image": null,
    "created_at": new Date().toISOString()
  }
];

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
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const databaseUrl = process.env.DATABASE_URL;
  const session = verifySession(req);

  if (!databaseUrl) {
    console.warn('⚠️ ADVERTENCIA: DATABASE_URL no está configurada. Usando fallback de noticias locales.');
    if (req.method === 'GET') {
      return res.status(200).json(FALLBACK_NEWS);
    }
    return res.status(503).json({ 
      error: 'Base de datos no configurada y la acción requiere base de datos.'
    });
  }

  try {
    const sql = neon(databaseUrl);

    // GET: Obtener todas las noticias/novedades
    if (req.method === 'GET') {
      const news = await sql`SELECT * FROM noticias ORDER BY created_at DESC`;
      return res.status(200).json(news);
    }

    // A partir de aquí todas las operaciones de escritura REQUIEREN SESIÓN ADMIN
    if (!session) {
      return res.status(401).json({ error: 'No autorizado. Debes iniciar sesión como administrador.' });
    }

    // POST: Agregar noticia
    if (req.method === 'POST') {
      const { title, content, image } = req.body || {};
      if (!title || !content) {
        return res.status(400).json({ error: 'title y content son requeridos.' });
      }

      const result = await sql`
        INSERT INTO noticias (title, content, image)
        VALUES (${title}, ${content}, ${image || null})
        RETURNING *
      `;
      return res.status(201).json(result[0]);
    }

    // DELETE: Eliminar una noticia
    if (req.method === 'DELETE') {
      const { id } = req.query || {};
      if (!id) {
        return res.status(400).json({ error: 'El parámetro id es requerido.' });
      }

      const result = await sql`
        DELETE FROM noticias
        WHERE id = ${id}
        RETURNING *
      `;
      if (result.length === 0) {
        return res.status(404).json({ error: 'Noticia no encontrada.' });
      }
      return res.status(200).json({ message: 'Noticia eliminada.', news: result[0] });
    }

    return res.status(405).json({ error: 'Método no permitido.' });
  } catch (error) {
    console.error('❌ Error en API noticias:', error);
    return res.status(500).json({ error: 'Error interno del servidor.' });
  }
}
