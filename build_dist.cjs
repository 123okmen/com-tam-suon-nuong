const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('============================================================');
console.log('🚀 SAM MIX BUILDER & DEPLOYMENT PACKAGER');
console.log('============================================================');

const isWin = process.platform === 'win32';
const npmCmd = isWin ? 'npm.cmd' : 'npm';

try {
  console.log('Building Vite bundle for production...');
  const out = execSync(`${npmCmd} run build`, { cwd: __dirname, encoding: 'utf-8', stdio: 'inherit' });
  console.log('✅ Vite build completed successfully!');
} catch (e) {
  console.error('\n❌ BUILD FAILED! Quá trình deploy đã bị dừng lại để không đẩy code lỗi lên web.');
  process.exit(1);
}
