const net = require('net');
const c = new net.Socket();
c.connect(3000, '127.0.0.1', () => {
  console.log('CONNECTED');
  c.destroy();
  process.exit(0);
});
c.on('error', (e) => {
  console.log('ERROR:', e.message);
  process.exit(1);
});
setTimeout(() => {
  console.log('TIMEOUT');
  process.exit(1);
}, 3000);
