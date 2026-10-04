import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('=== SAM MIX PLANNER AUTO DEPLOYER ===');

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
  try { runCmd('git commit -m "Auto deploy PlannerPage with Payroll Calculator"'); } catch {}
  runCmd('git push origin master');
  runCmd('npm run build');
  runCmd('npx gh-pages -d dist');
  console.log('\n✅ DEPLOYED TO GITHUB PAGES SUCCESSFULLY!');
} catch (e) {
  console.error('\n❌ DEPLOYMENT FAILED:', e.message);
}
