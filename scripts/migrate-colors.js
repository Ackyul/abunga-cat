import { neon } from '@neondatabase/serverless';
import 'dotenv/config';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('❌ DATABASE_URL no está configurado');
  process.exit(1);
}

const sql = neon(databaseUrl);

async function migrate() {
  console.log('🔗 Conectando a Neon Postgres...');
  try {
    await sql`ALTER TABLE productos ADD COLUMN IF NOT EXISTS bg_color VARCHAR(20) DEFAULT NULL`;
    console.log('✅ Columna bg_color agregada');
    await sql`ALTER TABLE productos ADD COLUMN IF NOT EXISTS text_color VARCHAR(20) DEFAULT NULL`;
    console.log('✅ Columna text_color agregada');
    console.log('\n✅ Migración completada con éxito');
  } catch (error) {
    console.error('❌ Error en migración:', error);
    process.exit(1);
  }
}

migrate();
