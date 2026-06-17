import dotenv from 'dotenv';
import { neon } from '@neondatabase/serverless';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('\n❌ ERROR: La variable DATABASE_URL no está definida en el archivo .env\n');
  console.log('Por favor crea un archivo .env en la raíz del proyecto y agrega tu cadena de conexión:');
  console.log('DATABASE_URL=postgres://usuario:contraseña@servidor/base_de_datos?sslmode=require\n');
  process.exit(1);
}

const sql = neon(databaseUrl);

async function init() {
  console.log('🔗 Conectando a Neon Postgres...');
  try {
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    
    // Remover comentarios SQL y dividir por punto y coma al final de línea
    const cleanSql = schemaSql.replace(/--.*\n/g, '');
    const commands = cleanSql
      .split(/;\s*$/m)
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0);
      
    console.log(`🚀 Ejecutando ${commands.length} comandos SQL en Neon...`);
    
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      // Restauramos el punto y coma final para la ejecución estándar
      await sql.query(command);
    }
    
    console.log('\n✅ ¡Base de datos inicializada y productos sembrados con éxito!\n');
  } catch (error) {
    console.error('\n❌ Error al inicializar la base de datos:', error);
    process.exit(1);
  }
}

init();
