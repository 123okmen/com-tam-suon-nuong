const { execSync } = require('child_process');
const path = require('path');

console.log('Testing build in', __dirname);
try {
  const out = execSync('npm run build', { cwd: __dirname, encoding: 'utf-8' });
  console.log('BUILD SUCCESS:\n', out);
} catch (err) {
  console.error('BUILD ERROR LOG:\n', err.stdout || '', err.stderr || '', err.message);
}
