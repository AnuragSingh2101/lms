import dotenv from 'dotenv';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const statusFile = path.join(__dirname, 'db-status.txt');

dotenv.config({ override: true });

const testConnection = async () => {
  const uri = process.env.MONGODB_URI;
  const maskedUri = uri ? uri.replace(/:([^@]+)@/, ':****@') : 'undefined';

  let statusText = `Database Connection Test Run at: ${new Date().toLocaleString()}\n`;
  statusText += `Using URI: ${maskedUri}\n\n`;

  console.log('Starting DB Connection Test...');
  try {
    if (!uri) {
      throw new Error('MONGODB_URI is not defined in the environment variables (.env file)');
    }

    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    statusText += `STATUS: CONNECTED SUCCESS!\n`;
    statusText += `Connected successfully to host: ${mongoose.connection.host}\n`;
    console.log('CONNECTED SUCCESS!');
  } catch (error) {
    statusText += `STATUS: CONNECTION FAILED!\n`;
    statusText += `Error Message: ${error.message}\n`;
    statusText += `Error Code: ${error.code || 'N/A'}\n`;
    statusText += `Stack Trace:\n${error.stack}\n`;
    console.error('CONNECTION FAILED:', error.message);
  } finally {
    await mongoose.disconnect();
    fs.writeFileSync(statusFile, statusText, 'utf8');
    console.log(`Results written to: ${statusFile}`);
  }
};

testConnection();