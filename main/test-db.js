const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
console.log('Datasource URL:', process.env.DATABASE_URL);
p.$connect()
  .then(() => {
    console.log('Connected!');
    return p.$queryRaw`SELECT 1 as test`;
  })
  .then((r) => {
    console.log('OK', r);
    process.exit(0);
  })
  .catch((e) => {
    console.error('ERR', e.message);
    process.exit(1);
  });
