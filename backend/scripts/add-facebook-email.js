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
  console.log('🔗 Conectando a Neon Postgres para agregar columna facebook_email...');
  try {
    await sql`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS facebook_email VARCHAR(255) UNIQUE`;
    console.log('✅ Columna facebook_email agregada con éxito (o ya existía).');
  } catch (error) {
    console.error('❌ Error al agregar columna facebook_email:', error);
  }
}

run();
