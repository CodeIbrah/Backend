const http = require('http');

function makeRequest(path, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: `/api/v1${path}`,
      method,
      headers: { 'Content-Type': 'application/json' },
    };
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runTests() {
  const results = [];
  const endpoints = [
    { path: '/health', method: 'GET' },
    { path: '/ops', method: 'GET' },
    {
      path: '/auth/register',
      method: 'POST',
      body: { email: 'test@test.com', password: 'Test1234!', name: 'Test User' },
    },
    {
      path: '/auth/login',
      method: 'POST',
      body: { email: 'test@test.com', password: 'Test1234!' },
    },
    { path: '/users', method: 'GET' },
    { path: '/analytics/overview', method: 'GET' },
    { path: '/reports', method: 'GET' },
    { path: '/activity-log', method: 'GET' },
  ];

  for (const ep of endpoints) {
    const start = Date.now();
    try {
      const res = await makeRequest(ep.path, ep.method, ep.body);
      const duration = Date.now() - start;
      results.push({
        endpoint: ep.path,
        method: ep.method,
        status: res.status,
        duration: `${duration}ms`,
        success: res.status < 400,
      });
    } catch (err) {
      results.push({
        endpoint: ep.path,
        method: ep.method,
        status: 'ERROR',
        duration: `${Date.now() - start}ms`,
        error: err.message,
      });
    }
  }

  console.log('\n=== ENDPOINT TEST RESULTS ===');
  results.forEach((r) => {
    const status = r.success ? 'PASS' : 'FAIL';
    console.log(
      `${status} | ${r.method.padEnd(6)} | ${r.endpoint.padEnd(30)} | ${r.status} | ${r.duration}`,
    );
  });

  const passed = results.filter((r) => r.success).length;
  console.log(`\nTotal: ${passed}/${results.length} passed`);
}

runTests().catch(console.error);
