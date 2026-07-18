import dotenv from 'dotenv';
import { neon } from '@neondatabase/serverless';

dotenv.config();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ ERROR: La variable DATABASE_URL no está definida.');
  process.exit(1);
}

const sql = neon(databaseUrl);

async function run() {
  console.log('🔗 Conectando a Neon Postgres para crear la tabla de pedidos...');
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS pedidos (
        id SERIAL PRIMARY KEY,
        codigo VARCHAR(20) UNIQUE NOT NULL,
        usuario_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
        nombre_cliente VARCHAR(255) NOT NULL,
        telefono_cliente VARCHAR(50) NOT NULL,
        ciudad VARCHAR(100) NOT NULL,
        direccion TEXT NOT NULL,
        latitud NUMERIC(10, 8) NOT NULL,
        longitud NUMERIC(11, 8) NOT NULL,
        referencia TEXT,
        items JSONB NOT NULL,
        subtotal NUMERIC(10, 2) NOT NULL,
        costo_envio NUMERIC(10, 2) NOT NULL,
        total NUMERIC(10, 2) NOT NULL,
        estado VARCHAR(50) DEFAULT 'Pendiente de Pago',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('✅ Tabla "pedidos" creada con éxito (o ya existía).');
  } catch (error) {
    console.error('❌ Error al crear la tabla:', error);
  }
}

run();
