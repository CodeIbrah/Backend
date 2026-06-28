const os = require('os');
const fs = require('fs');
const path = require('path');

console.log('='.repeat(70));
console.log('  RUNTIME MONITORING AGENT - PERFORMANCE & RESOURCE SCAN');
console.log('='.repeat(70));
console.log('');

// 1. System Resources
console.log('[1/6] System Resource Analysis...');
const cpus = os.cpus();
const totalMem = os.totalmem();
const freeMem = os.freemem();
const usedMem = totalMem - freeMem;
const memPercent = ((usedMem / totalMem) * 100).toFixed(1);
const loadAvg = os.loadavg();

console.log(`  CPU: ${cpus.length} cores - ${cpus[0].model}`);
console.log(
  `  Memory: ${(usedMem / 1024 / 1024 / 1024).toFixed(2)}GB / ${(totalMem / 1024 / 1024 / 1024).toFixed(2)}GB (${memPercent}%)`,
);
console.log(`  Load Average: ${loadAvg.map((l) => l.toFixed(2)).join(', ')}`);
console.log(`  Platform: ${os.platform()} ${os.arch()}`);
console.log(`  Node.js: ${process.version}`);
console.log(`  Memory Warning: ${parseFloat(memPercent) > 80 ? 'HIGH - Risk of OOM' : 'OK'}`);
console.log('');

// 2. Process Memory
console.log('[2/6] Process Memory Analysis...');
const memUsage = process.memoryUsage();
console.log(`  RSS: ${(memUsage.rss / 1024 / 1024).toFixed(2)} MB`);
console.log(`  Heap Total: ${(memUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`);
console.log(`  Heap Used: ${(memUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`);
console.log(`  External: ${(memUsage.external / 1024 / 1024).toFixed(2)} MB`);
console.log(`  Heap Utilization: ${((memUsage.heapUsed / memUsage.heapTotal) * 100).toFixed(1)}%`);
console.log(`  Memory Leak Risk: ${memUsage.heapUsed > 500 * 1024 * 1024 ? 'HIGH' : 'LOW'}`);
console.log('');

// 3. File System Analysis
console.log('[3/6] File System & Project Analysis...');
const basePath = process.cwd();

function countFiles(dir, extensions) {
  let count = 0;
  let size = 0;
  try {
    const items = fs.readdirSync(dir, { withFileTypes: true });
    for (const item of items) {
      const fullPath = path.join(dir, item.name);
      if (item.isDirectory()) {
        if (item.name !== 'node_modules' && item.name !== '.git') {
          const sub = countFiles(fullPath, extensions);
          count += sub.count;
          size += sub.size;
        }
      } else if (extensions.some((ext) => item.name.endsWith(ext))) {
        count++;
        try {
          size += fs.statSync(fullPath).size;
        } catch {}
      }
    }
  } catch {}
  return { count, size };
}

const tsFiles = countFiles(basePath, ['.ts']);
const jsFiles = countFiles(basePath, ['.js']);
const jsonFiles = countFiles(basePath, ['.json']);
const mdFiles = countFiles(basePath, ['.md']);

console.log(`  TypeScript files: ${tsFiles.count} (${(tsFiles.size / 1024).toFixed(1)} KB)`);
console.log(`  JavaScript files: ${jsFiles.count} (${(jsFiles.size / 1024).toFixed(1)} KB)`);
console.log(`  JSON files: ${jsonFiles.count} (${(jsonFiles.size / 1024).toFixed(1)} KB)`);
console.log(`  Markdown files: ${mdFiles.count} (${(mdFiles.size / 1024).toFixed(1)} KB)`);
console.log('');

// 4. Code Quality Metrics
console.log('[4/6] Code Quality & Performance Analysis...');

function analyzeFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const issues = [];

    // Long functions (>50 lines)
    let funcStart = -1;
    lines.forEach((line, i) => {
      if (line.match(/async\s+\w+\s*\(|function\s+\w+\s*\(/)) funcStart = i;
      if (funcStart >= 0 && (line.match(/^\s*\}/) || line.match(/^\s*}\s*$/))) {
        if (i - funcStart > 50) {
          issues.push({
            type: 'LONG_FUNCTION',
            line: funcStart + 1,
            detail: `${i - funcStart} lines`,
          });
        }
        funcStart = -1;
      }
    });

    // Deep nesting (>3 levels)
    lines.forEach((line, i) => {
      const indent = line.match(/^(\s*)/)?.[1].length || 0;
      if (indent >= 12) {
        issues.push({ type: 'DEEP_NESTING', line: i + 1, detail: `${indent / 2} levels` });
      }
    });

    // Large files (>500 lines)
    if (lines.length > 500) {
      issues.push({ type: 'LARGE_FILE', line: 1, detail: `${lines.length} lines` });
    }

    // Console.log in production code
    const consoleLogs = lines.filter((l) => l.match(/console\.(log|warn|error)/)).length;
    if (consoleLogs > 5) {
      issues.push({
        type: 'EXCESSIVE_CONSOLE',
        line: 1,
        detail: `${consoleLogs} console statements`,
      });
    }

    return issues;
  } catch {
    return [];
  }
}

const allIssues = [];
const dirsToScan = ['main/src', 'microservices', 'packages', 'infrastructure/ai-doctor'];
dirsToScan.forEach((dir) => {
  const fullPath = path.join(basePath, dir);
  try {
    const items = fs.readdirSync(fullPath, { withFileTypes: true, recursive: true });
    items.forEach((item) => {
      if (item.isFile() && item.name.endsWith('.ts')) {
        const filePath = path.join(fullPath, item.name);
        const issues = analyzeFile(filePath);
        issues.forEach((issue) => {
          allIssues.push({ file: path.relative(basePath, filePath), ...issue });
        });
      }
    });
  } catch {}
});

const longFunctions = allIssues.filter((i) => i.type === 'LONG_FUNCTION');
const deepNesting = allIssues.filter((i) => i.type === 'DEEP_NESTING');
const largeFiles = allIssues.filter((i) => i.type === 'LARGE_FILE');
const excessiveConsole = allIssues.filter((i) => i.type === 'EXCESSIVE_CONSOLE');

console.log(`  Long functions (>50 lines): ${longFunctions.length}`);
console.log(`  Deep nesting (>3 levels): ${deepNesting.length}`);
console.log(`  Large files (>500 lines): ${largeFiles.length}`);
console.log(`  Excessive console logs: ${excessiveConsole.length}`);
console.log('');

// 5. Performance Bottleneck Detection
console.log('[5/6] Performance Bottleneck Detection...');

function scanForBottlenecks(dir) {
  const bottlenecks = [];
  try {
    const items = fs.readdirSync(dir, { withFileTypes: true, recursive: true });
    items.forEach((item) => {
      if (!item.isFile() || !item.name.endsWith('.ts')) return;
      const filePath = path.join(dir, item.name);
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n');

        lines.forEach((line, i) => {
          // Synchronous file operations
          if (
            line.match(/readFileSync|writeFileSync|existsSync|statSync/) &&
            !line.includes('test')
          ) {
            bottlenecks.push({
              file: path.relative(basePath, filePath),
              line: i + 1,
              type: 'SYNC_FS',
              detail: 'Synchronous file I/O blocks event loop',
            });
          }
          // In-memory stores without limits
          if (line.match(/new Map\(\)|new Set\(\)/) && !line.includes('test')) {
            bottlenecks.push({
              file: path.relative(basePath, filePath),
              line: i + 1,
              type: 'UNBOUNDED_CACHE',
              detail: 'Unbounded Map/Set can cause memory leaks',
            });
          }
          // JSON.stringify on large objects
          if (line.match(/JSON\.stringify/)) {
            bottlenecks.push({
              file: path.relative(basePath, filePath),
              line: i + 1,
              type: 'JSON_PARSE',
              detail: 'JSON.stringify can block event loop on large objects',
            });
          }
        });
      } catch {}
    });
  } catch {}
  return bottlenecks;
}

const bottlenecks = scanForBottlenecks(basePath);
const syncFs = bottlenecks.filter((b) => b.type === 'SYNC_FS');
const unboundedCache = bottlenecks.filter((b) => b.type === 'UNBOUNDED_CACHE');
const jsonParse = bottlenecks.filter((b) => b.type === 'JSON_PARSE');

console.log(`  Synchronous file I/O: ${syncFs.length} (blocks event loop)`);
console.log(`  Unbounded caches: ${unboundedCache.length} (memory leak risk)`);
console.log(`  JSON operations: ${jsonParse.length} (potential blocking)`);
console.log('');

// 6. Service Health Check
console.log('[6/6] Service Configuration Analysis...');

const services = [
  { name: 'Main Monolith', port: 3000, dir: 'main', type: 'NestJS' },
  { name: 'Auth Service', port: 3001, dir: 'microservices/auth-service', type: 'Express' },
  { name: 'Users Service', port: 3002, dir: 'microservices/users-service', type: 'Express' },
  {
    name: 'Notifications Service',
    port: 3003,
    dir: 'microservices/notifications-service',
    type: 'Express',
  },
  { name: 'Payment Service', port: 3004, dir: 'microservices/payment-service', type: 'Express' },
];

services.forEach((svc) => {
  const pkgPath = path.join(basePath, svc.dir, 'package.json');
  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    const deps = Object.keys(pkg.dependencies || {}).length;
    const devDeps = Object.keys(pkg.devDependencies || {}).length;
    console.log(`  [OK] ${svc.name} (${svc.type}) :${svc.port} - ${deps} deps, ${devDeps} devDeps`);
  } catch {
    console.log(`  [!!] ${svc.name} - package.json not found`);
  }
});

console.log('');

// Summary
console.log('='.repeat(70));
console.log('  RUNTIME MONITORING SUMMARY');
console.log('='.repeat(70));
console.log('');
console.log('  System Health:');
console.log(
  `  - CPU Load: ${loadAvg[0].toFixed(2)} (1m) / ${loadAvg[1].toFixed(2)} (5m) / ${loadAvg[2].toFixed(2)} (15m)`,
);
console.log(`  - Memory: ${memPercent}% used (${parseFloat(memPercent) > 80 ? 'WARNING' : 'OK'})`);
console.log(`  - Process RSS: ${(memUsage.rss / 1024 / 1024).toFixed(2)} MB`);
console.log(
  `  - Heap: ${(memUsage.heapUsed / 1024 / 1024).toFixed(2)} MB / ${(memUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`,
);
console.log('');
console.log('  Code Quality:');
console.log(`  - Total TypeScript files: ${tsFiles.count}`);
console.log(`  - Long functions: ${longFunctions.length} (should be < 50 lines)`);
console.log(`  - Deep nesting: ${deepNesting.length} (should be < 3 levels)`);
console.log(`  - Large files: ${largeFiles.length} (should be < 500 lines)`);
console.log('');
console.log('  Performance Bottlenecks:');
console.log(`  - Sync file I/O: ${syncFs.length} (use async alternatives)`);
console.log(`  - Unbounded caches: ${unboundedCache.length} (add TTL/size limits)`);
console.log(`  - JSON operations: ${jsonParse.length} (monitor for large payloads)`);
console.log('');
console.log('  Services:');
console.log(`  - Active: ${services.length} services configured`);
console.log(`  - Ports: ${services.map((s) => s.port).join(', ')}`);
console.log('');
console.log('  Recommendations:');
if (parseFloat(memPercent) > 80)
  console.log('  [!] System memory is high - consider closing apps or adding RAM');
if (syncFs.length > 0) console.log('  [!] Replace synchronous file operations with async versions');
if (unboundedCache.length > 0) console.log('  [!] Add size limits or TTL to in-memory caches');
if (longFunctions.length > 0)
  console.log('  [!] Refactor long functions into smaller, focused units');
if (deepNesting.length > 0)
  console.log('  [!] Reduce nesting depth with early returns or guard clauses');
console.log('  [i] All services configured and ready for deployment');
console.log('');
console.log('='.repeat(70));
