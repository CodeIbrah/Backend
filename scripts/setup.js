const { execSync } = require('child_process');
const path = require('path');

console.log('\x1b[1m\x1b[32m🔧 Setting up development environment...\x1b[0m\n');

const steps = [
  {
    name: 'Installing root dependencies',
    command: 'npm install',
    cwd: path.join(__dirname, '..'),
  },
  {
    name: 'Installing main dependencies',
    command: 'npm install',
    cwd: path.join(__dirname, '..', 'main'),
  },
  {
    name: 'Installing auth-service dependencies',
    command: 'npm install',
    cwd: path.join(__dirname, '..', 'microservices', 'auth-service'),
  },
  {
    name: 'Installing users-service dependencies',
    command: 'npm install',
    cwd: path.join(__dirname, '..', 'microservices', 'users-service'),
  },
  {
    name: 'Installing payment-service dependencies',
    command: 'npm install',
    cwd: path.join(__dirname, '..', 'microservices', 'payment-service'),
  },
  {
    name: 'Installing notifications-service dependencies',
    command: 'npm install',
    cwd: path.join(__dirname, '..', 'microservices', 'notifications-service'),
  },
  {
    name: 'Generating Prisma client',
    command: 'npx prisma generate',
    cwd: path.join(__dirname, '..', 'main'),
  },
  {
    name: 'Building TypeScript',
    command: 'npm run build',
    cwd: path.join(__dirname, '..', 'main'),
  },
];

let current = 0;

function runStep(step) {
  console.log(`\x1b[36m[${current + 1}/${steps.length}]\x1b[0m ${step.name}...`);
  try {
    execSync(step.command, {
      cwd: step.cwd,
      stdio: 'inherit',
      env: { ...process.env },
    });
    console.log(`\x1b[32m✓ ${step.name} complete\x1b[0m\n`);
  } catch (error) {
    console.error(`\x1b[31m✗ ${step.name} failed\x1b[0m`);
    process.exit(1);
  }
}

for (const step of steps) {
  runStep(step);
  current++;
}

console.log('\x1b[1m\x1b[32m✨ Setup complete! Run `npm run dev` to start.\x1b[0m\n');
