
const { spawn } = require('child_process');
const path = require('path');
const isWindows = process.platform === 'win32';

const services = [
  {
    name: 'frontend',
    command: isWindows ? 'npm.cmd' : 'npm',
    args: ['run', 'dev'],
    cwd: path.join(__dirname, '..', 'frontend'),
    port: 5173,
    color: '\x1b[36m',
  },
  {
    name: 'main',
    command: isWindows ? 'npm.cmd' : 'npm',
    args: ['run', 'dev'],
    cwd: path.join(__dirname, '..', 'main'),
    port: 3000,
    color: '\x1b[32m',
  },
];

const processes = [];

function log(service, data, color) {
  const lines = data.toString().split('\n').filter((l) => l.trim());
  lines.forEach((line) => {
    console.log(${color}[]\x1b[0m );
  });
}

function startService(service) {
  return new Promise((resolve, reject) => {
    console.log(${service.color}[]\x1b[0m Starting on port ...);

    const proc = spawn(service.command, service.args, {
      cwd: service.cwd,
      env: { ...process.env, PORT: service.port.toString() },
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: true,
    });

    proc.stdout.on('data', (data) => log(service.name, data, service.color));
    proc.stderr.on('data', (data) => log(service.name, data, service.color));

    proc.on('error', (err) => {
      console.error(${service.color}[]\x1b[0m Error: );
      reject(err);
    });

    proc.on('exit', (code) => {
      console.log(${service.color}[]\x1b[0m Exited with code );
      resolve(code);
    });

    processes.push({ name: service.name, proc });
  });
}

async function startAll() {
  console.log('\x1b[1m\x1b[32m🚀 Starting frontend + backend...\x1b[0m\n');

  const promises = services.map((s) => startService(s));

  await Promise.all(promises);
}

function shutdown() {
  console.log('\n\x1b[1m\x1b[33m🛑 Shutting down all services...\x1b[0m');
  processes.forEach(({ name, proc }) => {
    console.log(\x1b[33m[]\x1b[0m Stopping...);
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
};
