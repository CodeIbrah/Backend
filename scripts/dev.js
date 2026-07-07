const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const isWindows = process.platform === 'win32';

/**
 * Load a .env file and merge into process.env (like dotenv).
 * Won't override already-set variables.
 */
function loadEnvFile(envPath) {
  try {
    const content = fs.readFileSync(envPath, 'utf-8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      let value = trimmed.slice(eqIdx + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  } catch {
    // .env file is optional
  }
}

// Load root .env so all services inherit these defaults
loadEnvFile(path.join(__dirname, '..', '.env'));

const services = [
  { name: 'main', cwd: 'main', port: 3000, color: '\x1b[32m' },
  { name: 'auth-service', cwd: 'microservices/auth-service', port: 3001, color: '\x1b[36m' },
  { name: 'users-service', cwd: 'microservices/users-service', port: 3002, color: '\x1b[33m' },
  {
    name: 'notifications-service',
    cwd: 'microservices/notifications-service',
    port: 3003,
    color: '\x1b[35m',
  },
  { name: 'payment-service', cwd: 'microservices/payment-service', port: 3004, color: '\x1b[34m' },
  { name: 'invoice-service', cwd: 'microservices/invoice-service', port: 3006, color: '\x1b[31m' },
  { name: 'mail-service', cwd: 'microservices/mail-service', port: 3007, color: '\x1b[37m' },
  { name: 'sms-service', cwd: 'microservices/sms-service', port: 3008, color: '\x1b[38m' },
  { name: 'api-test-ui', cwd: 'apps/api-test-ui', port: 5173, color: '\x1b[35m' },
].map((s) => ({
  ...s,
  command: isWindows ? 'npm.cmd' : 'npm',
  args: ['run', 'dev'],
  cwd: path.join(__dirname, '..', s.cwd),
}));

const processes = [];

function log(service, data, color) {
  const lines = data
    .toString()
    .split('\\n')
    .filter((l) => l.trim());
  lines.forEach((line) => {
    console.log(`${color}[${service}]\x1b[0m ${line}`);
  });
}

function startService(service) {
  return new Promise((resolve, reject) => {
    console.log(`${service.color}[${service.name}]\x1b[0m Starting on port ${service.port}...`);

    const proc = spawn(service.command, service.args, {
      cwd: service.cwd,
      env: { ...process.env, PORT: service.port.toString() },
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: true,
    });

    proc.stdout.on('data', (data) => log(service.name, data, service.color));
    proc.stderr.on('data', (data) => log(service.name, data, service.color));

    proc.on('error', (err) => {
      console.error(`${service.color}[${service.name}]\x1b[0m Error: ${err.message}`);
      reject(err);
    });

    proc.on('exit', (code) => {
      console.log(`${service.color}[${service.name}]\x1b[0m Exited with code ${code}`);
      resolve(code);
    });

    processes.push({ name: service.name, proc });
  });
}

async function startAll() {
  console.log('\x1b[1m\x1b[32m🚀 Starting all services...\x1b[0m\n');

  const promises = services.map((s) => startService(s));

  await Promise.all(promises);
}

function shutdown() {
  console.log('\\n\\x1b[1m\\x1b[33m🛑 Shutting down all services...\\x1b[0m');
  processes.forEach(({ name, proc }) => {
    console.log(`\x1b[33m[${name}]\x1b[0m Stopping...`);
    proc.kill('SIGTERM');
  });
  setTimeout(() => {
    processes.forEach(({ proc }) => {
      if (!proc.killed) proc.kill('SIGKILL');
    });
    process.exit(0);
  }, 2000);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

startAll().catch((err) => {
  console.error('Failed to start services:', err);
  process.exit(1);
});
