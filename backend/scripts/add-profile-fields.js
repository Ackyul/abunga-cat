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
  console.log('🔗 Conectando a Neon Postgres para agregar columnas de perfil (phone y google_email)...');
  try {
    await sql`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS phone VARCHAR(20)`;
    await sql`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS google_email VARCHAR(255) UNIQUE`;
    console.log('✅ Columnas phone y google_email agregadas con éxito (o ya existían).');
  } catch (error) {
    console.error('❌ Error al agregar columnas:', error);
  }
}

run();
