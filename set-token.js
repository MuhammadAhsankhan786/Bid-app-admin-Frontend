/**
 * Simple script to set admin token
 * Usage: node set-token.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const tokenFilePath = path.join(__dirname, '.admin_token');

console.log('========================================');
console.log('Admin Token Setup');
console.log('========================================');
console.log('');
console.log('To get your admin token:');
console.log('1. Open admin panel in browser and login');
console.log('2. Press F12 to open browser console');
console.log('3. Type: localStorage.getItem("token")');
console.log('4. Copy the token that appears');
console.log('');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Paste your admin token here: ', (token) => {
  rl.close();
  
  if (!token || token.trim() === '') {
    console.log('❌ No token provided. Exiting...');
    process.exit(1);
  }
  
  const cleanToken = token.trim();
  
  try {
    fs.writeFileSync(tokenFilePath, cleanToken, 'utf8');
    console.log('');
    console.log('✅ Token saved successfully!');
    console.log(`   Saved to: ${tokenFilePath}`);
    console.log('');
    console.log('Now you can run: npm run test:apis');
    console.log('');
  } catch (error) {
    console.error('❌ Error saving token:', error.message);
    process.exit(1);
  }
});

