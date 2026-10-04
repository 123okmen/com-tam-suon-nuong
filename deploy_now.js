import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('=== COM TAM SUON NUONG AUTO DEPLOYER ===');

function runCmd(cmd) {
  console.log(`> Running: ${cmd}`);
  try {
    const out = execSync(cmd, { cwd: __dirname, encoding: 'utf-8', stdio: 'inherit', env: { ...process.env, PATH: process.env.PATH + ';C:\\Program Files\\Git\\cmd' } });
    return out;
  } catch (err) {
    console.error(`Command failed: ${cmd}`, err.message);
    throw err;
  }
}

try {
  runCmd('git add .');
  try { runCmd('git commit -m "Deploy Com Tam Suon Nuong web app"'); } catch {}
  runCmd('git push origin master');
  runCmd('npm.cmd run build');
  runCmd('npx.cmd gh-pages -d dist');
  console.log('\n✅ DEPLOYED TO GITHUB PAGES SUCCESSFULLY!');
  console.log('🌐 Link web: https://123okmen.github.io/com-tam-suon-nuong/#/order');
} catch (e) {
  console.error('\n❌ DEPLOYMENT FAILED:', e.message);
}
