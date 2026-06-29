/**
 * PRELOAD - Load dotenv before ES modules resolve
 * This file should be loaded with -r flag: node -r ./preload.js server.js
 */
const path = require('path');
const result = require('dotenv').config({ 
  path: path.join(__dirname, '.env') 
});

if (result.parsed) {
  console.log(`[preload] ✅ Loaded ${Object.keys(result.parsed).length} env vars from .env`);
} else if (result.error) {
  console.error('[preload] ❌ Failed to load .env:', result.error.message);
}

