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
  console.log('🔗 Conectando a Neon Postgres para agregar columnas de recuperación...');
  try {
    // Agregar columnas de recuperación si no existen
    await sql`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS recovery_code VARCHAR(6)`;
    await sql`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS recovery_expires TIMESTAMP`;
    console.log('✅ Columnas recovery_code y recovery_expires agregadas con éxito (o ya existían).');
  } catch (error) {
    console.error('❌ Error al agregar columnas:', error);
  }
}

run();
