import { neon } from '@neondatabase/serverless';

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
  // Configuración de cabeceras CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const databaseUrl = process.env.DATABASE_URL;

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

    return res.status(405).json({ error: 'Método no permitido.' });
  } catch (error) {
    console.error('❌ Error en API noticias:', error);
    return res.status(500).json({ 
      error: 'Error de base de datos o interno.', 
      details: error.message 
    });
  }
}
