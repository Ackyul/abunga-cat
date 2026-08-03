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
  console.log('🔗 Conectando a Neon Postgres para agregar columnas de regalo de bienvenida (welcome_gift, welcome_gift_prize)...');
  try {
    await sql`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS welcome_gift BOOLEAN DEFAULT FALSE`;
    await sql`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS welcome_gift_prize VARCHAR(100)`;
    console.log('✅ Columnas welcome_gift y welcome_gift_prize agregadas con éxito (o ya existían).');
  } catch (error) {
    console.error('❌ Error al agregar columnas:', error);
  }
}

run();
