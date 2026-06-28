const { Client } = require('pg');
const client = new Client({
  host: '127.0.0.1',
  port: 5432,
  database: 'backend_db',
  user: 'postgres',
  password: 'postgres',
});
client.connect((err) => {
  if (err) {
    console.error('Connect error:', err.message);
    process.exit(1);
  }
  console.log('Connected!');
  client.query('SELECT 1 as test', (err, res) => {
    if (err) {
      console.error('Query error:', err.message);
      process.exit(1);
    }
    console.log('OK', res.rows);
    client.end();
  });
});
