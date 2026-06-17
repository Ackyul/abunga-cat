import { neon } from '@neondatabase/serverless';

const FALLBACK_PRODUCTS = [
  {"id": 1, "name":"Láminas de Fresa","tipo":"Láminas","fruta":"Fresa","image":null,"precio":10.00,"precios":null,"brand":"Abunga"},
  {"id": 2, "name":"Láminas de Tamarindo","tipo":"Láminas","fruta":"Tamarindo","image":null,"precio":10.00,"precios":null,"brand":"Abunga"},
  {"id": 3, "name":"Láminas de Piña","tipo":"Láminas","fruta":"Piña","image":null,"precio":10.00,"precios":null,"brand":"Abunga"},
  {"id": 4, "name":"Láminas de Coco","tipo":"Láminas","fruta":"Coco","image":null,"precio":10.00,"precios":null,"brand":"Abunga"},
  {"id": 5, "name":"Láminas de Acaí","tipo":"Láminas","fruta":"Acaí","image":null,"precio":10.00,"precios":null,"brand":"Abunga"},
  {"id": 6, "name":"Láminas de Maracuyá","tipo":"Láminas","fruta":"Maracuyá","image":null,"precio":10.00,"precios":null,"brand":"Abunga"},
  {"id": 7, "name":"Láminas de Sandía","tipo":"Láminas","fruta":"Sandía","image":null,"precio":10.00,"precios":null,"brand":"Abunga"},
  {"id": 8, "name":"Láminas de Papaya","tipo":"Láminas","fruta":"Papaya","image":null,"precio":10.00,"precios":null,"brand":"Abunga"},
  {"id": 9, "name":"Láminas de Cacao","tipo":"Láminas","fruta":"Cacao","image":null,"precio":10.00,"precios":null,"brand":"Abunga"},
  {"id": 10, "name":"Fresa Deshidratada","tipo":"Fruta","fruta":"Fresa","image":null,"precio":13.00,"precios":{"50gr": 13, "100gr": 25, "500gr": 120, "1kg": 220},"brand":"Abunga"},
  {"id": 11, "name":"Plátano Deshidratado","tipo":"Fruta","fruta":"Plátano","image":null,"precio":8.00,"precios":{"50gr": 8, "100gr": 15, "500gr": 70, "1kg": 130},"brand":"Abunga"},
  {"id": 12, "name":"Mango Deshidratado","tipo":"Fruta","fruta":"Mango","image":null,"precio":10.00,"precios":{"50gr": 10, "100gr": 20, "500gr": 95, "1kg": 180},"brand":"Abunga"},
  {"id": 13, "name":"Papaya Deshidratada","tipo":"Fruta","fruta":"Papaya","image":null,"precio":8.00,"precios":{"50gr": 8, "100gr": 16, "500gr": 70, "1kg": 130},"brand":"Abunga"},
  {"id": 14, "name":"Piña Deshidratada","tipo":"Fruta","fruta":"Piña","image":null,"precio":9.00,"precios":{"50gr": 9, "100gr": 18, "500gr": 85, "1kg": 160},"brand":"Abunga"},
  {"id": 15, "name":"Manzana Deshidratada","tipo":"Fruta","fruta":"Manzana","image":null,"precio":10.00,"precios":{"50gr": 10, "100gr": 20, "500gr": 95, "1kg": 180},"brand":"Abunga"},
  {"id": 16, "name":"Ritual Calma","tipo":"Infusión","fruta":"Manzana","image":null,"precio":10.00,"precios":null,"brand":"Abunga"},
  {"id": 17, "name":"Ritual Energía Tropical","tipo":"Infusión","fruta":"Piña y naranja","image":null,"precio":10.00,"precios":null,"brand":"Abunga"},
  {"id": 18, "name":"Ritual Defensa","tipo":"Infusión","fruta":"Fresa y arandano","image":null,"precio":10.00,"precios":null,"brand":"Abunga"},
  {"id": 19, "name":"Ritual Digestión","tipo":"Infusión","fruta":"Piña","image":null,"precio":10.00,"precios":null,"brand":"Abunga"},
  {"id": 20, "name":"Manzana Deshidratada con Canela","tipo":"Fruta","fruta":"Manzana","image":null,"precio":10.00,"precios":null,"brand":"Abunga"},
  {"id": 21, "name":"Naranja Deshidratada","tipo":"Fruta","fruta":"Naranja","image":null,"precio":10.00,"precios":null,"brand":"Abunga"}
];

export default async function handler(req, res) {
  // Configuración de cabeceras CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const databaseUrl = process.env.DATABASE_URL;

  // Fallback si la base de datos no está configurada (útil para desarrollo y demostración)
  if (!databaseUrl) {
    console.warn('⚠️ ADVERTENCIA: DATABASE_URL no está configurada. Usando fallback de productos locales.');
    if (req.method === 'GET') {
      return res.status(200).json(FALLBACK_PRODUCTS);
    }
    return res.status(503).json({ 
      error: 'Base de datos no configurada y la acción requiere base de datos.',
      message: 'Configura DATABASE_URL para habilitar operaciones de escritura (POST, PUT, DELETE).' 
    });
  }

  try {
    const sql = neon(databaseUrl);

    // GET: Obtener todos los productos
    if (req.method === 'GET') {
      const products = await sql`SELECT * FROM productos ORDER BY id ASC`;
      return res.status(200).json(products);
    }

    // POST: Crear nuevo producto
    if (req.method === 'POST') {
      const { name, tipo, fruta, image, precio, precios, brand } = req.body || {};
      if (!name || !tipo || !fruta) {
        return res.status(400).json({ error: 'name, tipo y fruta son requeridos.' });
      }

      const queryPrecios = precios ? JSON.stringify(precios) : null;
      const result = await sql`
        INSERT INTO productos (name, tipo, fruta, image, precio, precios, brand)
        VALUES (${name}, ${tipo}, ${fruta}, ${image || null}, ${precio || null}, ${queryPrecios}, ${brand || 'Abunga'})
        RETURNING *
      `;
      return res.status(201).json(result[0]);
    }

    // PUT: Actualizar un producto existente
    if (req.method === 'PUT') {
      const { id, name, tipo, fruta, image, precio, precios, brand } = req.body || {};
      if (!id) {
        return res.status(400).json({ error: 'id del producto es requerido.' });
      }

      const queryPrecios = precios ? JSON.stringify(precios) : null;
      const result = await sql`
        UPDATE productos
        SET name = ${name}, tipo = ${tipo}, fruta = ${fruta}, image = ${image}, precio = ${precio}, precios = ${queryPrecios}, brand = ${brand}
        WHERE id = ${id}
        RETURNING *
      `;
      if (result.length === 0) {
        return res.status(404).json({ error: 'Producto no encontrado.' });
      }
      return res.status(200).json(result[0]);
    }

    // DELETE: Eliminar un producto
    if (req.method === 'DELETE') {
      const { id } = req.query || {};
      if (!id) {
        return res.status(400).json({ error: 'El parámetro id es requerido.' });
      }

      const result = await sql`
        DELETE FROM productos
        WHERE id = ${id}
        RETURNING *
      `;
      if (result.length === 0) {
        return res.status(404).json({ error: 'Producto no encontrado.' });
      }
      return res.status(200).json({ message: 'Producto eliminado.', product: result[0] });
    }

    return res.status(405).json({ error: 'Método no permitido.' });
  } catch (error) {
    console.error('❌ Error en API productos:', error);
    return res.status(500).json({ 
      error: 'Error de base de datos o interno.', 
      details: error.message,
      fallbackUsed: false 
    });
  }
}
