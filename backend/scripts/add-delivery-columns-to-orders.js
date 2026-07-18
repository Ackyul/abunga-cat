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
  console.log('🔗 Conectando a Neon Postgres para agregar columnas de rastreo y despacho (tracking_url y delivery_id)...');
  try {
    await sql`ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS tracking_url TEXT`;
    await sql`ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS delivery_id VARCHAR(100)`;
    console.log('✅ Columnas de despacho agregadas con éxito (o ya existían).');
  } catch (error) {
    console.error('❌ Error al agregar columnas a la tabla pedidos:', error);
  }
}

run();
