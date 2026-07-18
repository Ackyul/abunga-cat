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
  console.log('🔗 Conectando a Neon Postgres para agregar columnas de ubicación y dirección a la tabla usuarios...');
  try {
    await sql`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS ciudad VARCHAR(100)`;
    await sql`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS region VARCHAR(100)`;
    await sql`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS distrito VARCHAR(100)`;
    await sql`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS direccion TEXT`;
    await sql`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS referencia TEXT`;
    await sql`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS latitud DOUBLE PRECISION`;
    await sql`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS longitud DOUBLE PRECISION`;
    console.log('✅ Columnas de dirección agregadas con éxito (o ya existían).');
  } catch (error) {
    console.error('❌ Error al agregar columnas:', error);
  }
}

run();
