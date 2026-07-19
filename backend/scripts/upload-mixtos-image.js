import dotenv from 'dotenv';
import { neon } from '@neondatabase/serverless';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const databaseUrl = process.env.DATABASE_URL;
const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

if (!databaseUrl) {
  console.error('❌ DATABASE_URL is not set.');
  process.exit(1);
}
if (!cloudName || !apiKey || !apiSecret) {
  console.error('❌ Cloudinary configuration missing.');
  process.exit(1);
}

const sql = neon(databaseUrl);

async function uploadAndSeed() {
  try {
    const imagePath = path.join(__dirname, '../../frontend/public/mixtos.png');
    if (!fs.existsSync(imagePath)) {
      console.error(`❌ Image not found at path: ${imagePath}`);
      process.exit(1);
    }

    console.log('📖 Reading mixtos.png image file...');
    const fileBuffer = fs.readFileSync(imagePath);
    const base64Image = `data:image/png;base64,${fileBuffer.toString('base64')}`;

    console.log('🚀 Uploading image to Cloudinary...');
    const folder = 'abunga-products';
    const timestamp = Math.round(Date.now() / 1000);
    const paramsToSign = `folder=${folder}&timestamp=${timestamp}`;
    const signature = crypto
      .createHash('sha256')
      .update(paramsToSign + apiSecret)
      .digest('hex');

    const formData = new URLSearchParams();
    formData.append('file', base64Image);
    formData.append('api_key', apiKey);
    formData.append('timestamp', timestamp.toString());
    formData.append('signature', signature);
    formData.append('folder', folder);

    const cloudinaryRes = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString(),
      }
    );

    const data = await cloudinaryRes.json();
    if (!cloudinaryRes.ok || data.error) {
      console.error('❌ Cloudinary upload failed:', data);
      process.exit(1);
    }

    const secureUrl = data.secure_url;
    console.log(`✅ Uploaded successfully. Cloudinary URL: ${secureUrl}`);

    console.log('🔗 Connecting to database and updating productos...');
    const result = await sql`
      UPDATE productos 
      SET image = ${secureUrl} 
      WHERE tipo = 'Mix' OR name = 'Mix de Frutas Deshidratadas';
    `;
    console.log('✅ Database updated successfully.');
  } catch (error) {
    console.error('❌ Error during process:', error);
    process.exit(1);
  }
}

uploadAndSeed();
