const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('============================================================');
console.log('🚀 SAM MIX BUILDER & DEPLOYMENT PACKAGER');
console.log('============================================================');

try {
  console.log('Building Vite bundle for production...');
  const out = execSync('npm run build', { cwd: __dirname, encoding: 'utf-8' });
  console.log('✅ Vite build completed successfully!');
} catch (e) {
  console.error('Build failed:', e.message);
}
