const http = require('http');
http.get('http://localhost:3000/api/v1/health', (res) => {
  let d = '';
  res.on('data', (c) => d += c);
  res.on('end', () => console.log('STATUS:', res.statusCode, 'BODY:', d));
}).on('error', (e) => console.log('ERR:', e.message));
