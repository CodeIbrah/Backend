const http = require('http');

const services = [
  { name: 'Main API', port: 3000, path: '/api/v1/health' },
  { name: 'Payment Service', port: 3003, path: '/health' },
  { name: 'Notifications Service', port: 3004, path: '/health' },
];

function checkService({ name, port, path }) {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${port}${path}`, { timeout: 3000 }, (res) => {
      if (res.statusCode >= 200 && res.statusCode < 400) {
        console.log(`\x1b[32m✓ ${name}\x1b[0m (port ${port}) - \x1b[32mHealthy\x1b[0m`);
        resolve(true);
      } else {
        console.log(`\x1b[33m⚠ ${name}\x1b[0m (port ${port}) - Status: ${res.statusCode}`);
        resolve(false);
      }
    });

    req.on('error', () => {
      console.log(`\x1b[31m✗ ${name}\x1b[0m (port ${port}) - \x1b[31mOffline\x1b[0m`);
      resolve(false);
    });

    req.on('timeout', () => {
      req.destroy();
      console.log(`\x1b[31m✗ ${name}\x1b[0m (port ${port}) - \x1b[31mTimeout\x1b[0m`);
      resolve(false);
    });
  });
}

async function checkAll() {
  console.log('\n\x1b[1m🔍 Checking service health...\x1b[0m\n');

  const results = await Promise.all(services.map(checkService));
  const healthy = results.filter(Boolean).length;

  console.log(`\n\x1b[1m${healthy}/${services.length}\x1b[0m services healthy\n`);

  if (healthy === services.length) {
    console.log('\x1b[32m✨ All services are running!\x1b[0m');
    process.exit(0);
  } else {
    console.log('\x1b[33m⚠ Some services are not running. Start them with: npm run dev:all\x1b[0m');
    process.exit(1);
  }
}

checkAll();
