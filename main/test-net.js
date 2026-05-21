const net = require('net');
const client = new net.Socket();
client.connect(5432, '127.0.0.1', () => {
  console.log('Connected to PostgreSQL port');
  client.on('data', (data) => {
    console.log('Received:', data.toString('hex'));
    client.destroy();
  });
});
client.on('error', (err) => {
  console.error('Error:', err.message);
});
setTimeout(() => {
  console.log('Timeout');
  process.exit(0);
}, 3000);
