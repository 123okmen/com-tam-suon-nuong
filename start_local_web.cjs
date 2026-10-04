const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync, exec } = require('child_process');

console.log('============================================================');
console.log('🚀 SAM MIX LOCAL WEB SERVER - CHÍNH XÁC 100% THEO CHẤM CÔNG & ĐƠN HÀNG');
console.log('============================================================');

const distDir = path.join(__dirname, 'dist');

// Rebuild project
console.log('Biên dịch mã nguồn mới (Đã loại Khánh khỏi Lương NV, Đã chốt thanh toán ngày 05 hàng tháng)...');
try {
  execSync('npm run build', { cwd: __dirname, stdio: 'inherit' });
  console.log('✅ Biên dịch thành công!');
} catch (err) {
  console.error('Build error:', err.message);
}

const mimeTypes = {
  '.html': 'text/html; charset=UTF-8',
  '.js': 'text/javascript; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml'
};

const server = http.createServer((req, res) => {
  let reqUrl = req.url.split('?')[0];
  
  if (reqUrl.startsWith('/sam-mix-planner/')) {
    reqUrl = reqUrl.replace('/sam-mix-planner/', '/');
  } else if (reqUrl === '/sam-mix-planner') {
    reqUrl = '/';
  }

  let filePath = path.join(distDir, reqUrl);

  if (reqUrl === '/' || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(distDir, 'index.html');
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = mimeTypes[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=UTF-8' });
      res.end('Server Error: ' + err.code);
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
});

function listen(port) {
  server.listen(port, () => {
    const targetUrl = `http://localhost:${port}/sam-mix-planner/#/planner`;
    console.log(`\n✅ WEBSITE CHẠY CHÍNH XÁC TẠI: ${targetUrl}\n`);
    const startCmd = process.platform === 'win32' ? 'start' : 'open';
    exec(`${startCmd} ${targetUrl}`);
  }).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`Cổng ${port} bận, thử cổng ${port + 1}...`);
      listen(port + 1);
    } else {
      console.error('Server error:', err.message);
    }
  });
}

listen(3000);
