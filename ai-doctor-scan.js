#!/usr/bin/env node

/**
 * AI Doctor - Comprehensive Security & Quality Scanner
 * Scans backend template for vulnerabilities, bugs, performance issues,
 * exploit vectors, and code quality problems.
 */

const fs = require('fs');
const path = require('path');

// ============================================================
// Configuration
// ============================================================

const PROJECT_ROOT = path.resolve(__dirname);

const SCAN_PATTERNS = {
  main: 'main/src/**/*.ts',
  microservices: 'microservices/**/*.ts',
  packages: 'packages/**/*.ts',
  infrastructure: 'infrastructure/ai-doctor/**/*.ts',
  nginx: 'gateway/nginx.conf',
};

// ============================================================
// Utility Functions
// ============================================================

function getAllFiles(dir, patterns, excludeDirs = ['node_modules', '.git', 'dist', 'build', '.turbo']) {
  const results = [];
  
  function walk(currentDir) {
    if (!fs.existsSync(currentDir)) return;
    
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      
      if (entry.isDirectory()) {
        if (excludeDirs.includes(entry.name)) continue;
        walk(fullPath);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name);
        if (['.ts', '.js', '.conf'].includes(ext)) {
          results.push(fullPath);
        }
      }
    }
  }
  
  for (const pattern of patterns) {
    const baseDir = path.join(PROJECT_ROOT, pattern.split('/')[0]);
    walk(baseDir);
  }
  
  return results;
}

function readFileLines(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return content.split('\n');
  } catch {
    return [];
  }
}

function getRelativePath(filePath) {
  return path.relative(PROJECT_ROOT, filePath);
}

// ============================================================
// Finding Collector
// ============================================================

const findings = [];

function addFinding(file, line, severity, category, description, suggestion) {
  findings.push({
    file: getRelativePath(file),
    line,
    severity,
    category,
    description,
    suggestion,
  });
}

// ============================================================
// Scan Rules
// ============================================================

function scanFile(filePath) {
  const lines = readFileLines(filePath);
  const relPath = getRelativePath(filePath);
  const isNestJS = relPath.includes('main/src');
  const isExpress = relPath.includes('microservices');
  const isShared = relPath.includes('packages');
  const isInfra = relPath.includes('infrastructure');
  const isNginx = relPath.includes('nginx.conf');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;
    const trimmed = line.trim();

    // Skip comments and empty lines
    if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed === '') continue;

    // ----------------------------------------------------------
    // SECURITY: Hardcoded Secrets
    // ----------------------------------------------------------
    
    // Hardcoded passwords
    if (/(?:password|passwd|pwd)\s*[:=]\s*['"][^'"]{3,}['"]/i.test(line) && 
        !line.includes('process.env') && !line.includes('configService') &&
        !line.includes('example') && !line.includes('test') && !line.includes('placeholder')) {
      addFinding(filePath, lineNum, 'CRITICAL', 'SECURITY',
        'Hardcoded password detected',
        'Use environment variables or a secrets manager instead of hardcoding passwords');
    }

    // Hardcoded API keys/tokens
    if (/(?:api[_-]?key|secret[_-]?key|access[_-]?token|auth[_-]?token|private[_-]?key)\s*[:=]\s*['"][^'"]{8,}['"]/i.test(line) &&
        !line.includes('process.env') && !line.includes('configService')) {
      addFinding(filePath, lineNum, 'CRITICAL', 'SECURITY',
        'Hardcoded secret/token/key detected',
        'Move secrets to environment variables or a vault service');
    }

    // JWT secret hardcoded
    if (/JWT_SECRET\s*[:=]\s*['"][^'"]+['"]/i.test(line) && !line.includes('process.env')) {
      addFinding(filePath, lineNum, 'CRITICAL', 'SECURITY',
        'Hardcoded JWT secret detected',
        'Use environment variable for JWT_SECRET');
    }

    // ----------------------------------------------------------
    // SECURITY: Insecure Crypto
    // ----------------------------------------------------------
    
    // MD5 usage
    if (/md5\s*\(/i.test(line) || /createHash\s*\(\s*['"]md5['"]\s*\)/i.test(line)) {
      addFinding(filePath, lineNum, 'HIGH', 'SECURITY',
        'MD5 hash usage detected - cryptographically broken',
        'Use SHA-256 or bcrypt/argon2 for password hashing');
    }

    // SHA1 for security purposes
    if (/sha1/i.test(line) && !line.includes('sha1') === false && 
        (line.includes('createHash') || line.includes('crypto'))) {
      addFinding(filePath, lineNum, 'MEDIUM', 'SECURITY',
        'SHA-1 usage detected - considered weak for security',
        'Use SHA-256 or SHA-3 for cryptographic purposes');
    }

    // Math.random() for security tokens
    if (/Math\.random\s*\(/.test(line) && 
        (relPath.includes('crypto') || relPath.includes('token') || relPath.includes('secret'))) {
      addFinding(filePath, lineNum, 'HIGH', 'SECURITY',
        'Math.random() used for token/secret generation - not cryptographically secure',
        'Use crypto.randomBytes() or crypto.randomUUID() for security-sensitive random values');
    }

    // ----------------------------------------------------------
    // SECURITY: eval() and similar
    // ----------------------------------------------------------
    
    if (/\beval\s*\(/.test(line) && !line.trim().startsWith('//')) {
      addFinding(filePath, lineNum, 'CRITICAL', 'SECURITY',
        'eval() usage detected - code injection risk',
        'Avoid eval(). Use JSON.parse() for JSON, or safer alternatives');
    }

    if (/new\s+Function\s*\(/.test(line)) {
      addFinding(filePath, lineNum, 'CRITICAL', 'SECURITY',
        'new Function() usage detected - code injection risk',
        'Avoid dynamic function creation from user input');
    }

    // ----------------------------------------------------------
    // SECURITY: Prototype Pollution
    // ----------------------------------------------------------
    
    if (/Object\.assign\s*\(/.test(line) && (line.includes('req.') || line.includes('body') || line.includes('query') || line.includes('params'))) {
      addFinding(filePath, lineNum, 'HIGH', 'SECURITY',
        'Object.assign with user input - prototype pollution risk',
        'Use Object.create(null) for target, or deep clone with validation');
    }

    if (/JSON\.parse\s*\(/.test(line) && (line.includes('req.') || line.includes('body'))) {
      addFinding(filePath, lineNum, 'MEDIUM', 'SECURITY',
        'JSON.parse with user input without validation',
        'Validate parsed JSON structure before use');
    }

    // ----------------------------------------------------------
    // EXPLOIT: Command Injection
    // ----------------------------------------------------------
    
    if (/(?:exec|execSync|spawn|spawnSync|execFile)\s*\(/.test(line) && 
        (line.includes('+') || line.includes('`') || line.includes('${'))) {
      addFinding(filePath, lineNum, 'CRITICAL', 'EXPLOIT',
        'Possible command injection - shell command with string concatenation',
        'Use parameterized commands, avoid string concatenation in shell commands');
    }

    if (/child_process/.test(line) && (line.includes('shell') || line.includes('exec'))) {
      addFinding(filePath, lineNum, 'HIGH', 'EXPLOIT',
        'child_process usage detected - verify input sanitization',
        'Ensure all inputs are sanitized before passing to shell commands');
    }

    // ----------------------------------------------------------
    // EXPLOIT: Path Traversal
    // ----------------------------------------------------------
    
    if (/path\.join\s*\(/.test(line) && (line.includes('req.') || line.includes('params') || line.includes('query') || line.includes('body'))) {
      addFinding(filePath, lineNum, 'HIGH', 'EXPLOIT',
        'path.join with user input - path traversal risk',
        'Sanitize input, use path.resolve with validation, or reject paths containing ".."');
    }

    // Synchronous file operations with user-controlled paths
    if (/fs\.(readFileSync|writeFileSync|existsSync|readdirSync|statSync)\s*\(/.test(line)) {
      if (line.includes('req.') || line.includes('params') || line.includes('query')) {
        addFinding(filePath, lineNum, 'HIGH', 'EXPLOIT',
          'Synchronous file operation with user input - path traversal risk',
          'Validate and sanitize file paths, use allowlists for accessible directories');
      } else {
        addFinding(filePath, lineNum, 'MEDIUM', 'PERFORMANCE',
          'Synchronous file system operation blocks event loop',
          'Use async fs.promises API instead of sync operations');
      }
    }

    // ----------------------------------------------------------
    // EXPLOIT: XSS Patterns
    // ----------------------------------------------------------
    
    if (/innerHTML\s*=/.test(line) || /document\.write\s*\(/.test(line)) {
      addFinding(filePath, lineNum, 'HIGH', 'EXPLOIT',
        'Potential XSS - direct DOM manipulation with unsanitized content',
        'Use textContent instead of innerHTML, or sanitize HTML before insertion');
    }

    if (/res\.(send|end|write)\s*\(/.test(line) && (line.includes('req.') || line.includes('body') || line.includes('query'))) {
      if (!line.includes('escape') && !line.includes('sanitize') && !line.includes('encode')) {
        addFinding(filePath, lineNum, 'MEDIUM', 'EXPLOIT',
          'Response sent with potential user input without sanitization',
          'Sanitize or escape user input before sending in response');
      }
    }

    // ----------------------------------------------------------
    // BUG: Unhandled Promises
    // ----------------------------------------------------------
    
    // .then() without .catch()
    if (/\.then\s*\(/.test(line) && !lines.slice(i, i + 3).some(l => /\.catch\s*\(/.test(l))) {
      if (!line.includes('await') && !line.includes('return')) {
        addFinding(filePath, lineNum, 'MEDIUM', 'BUG',
          'Promise chain without .catch() - unhandled rejection risk',
          'Add .catch() handler or wrap in try/catch');
      }
    }

    // Async function without await in some paths
    if (/async\s+\w+\s*\(/.test(line)) {
      // Check if function body has proper error handling
      let braceCount = 0;
      let hasTryCatch = false;
      let hasAwait = false;
      for (let j = i; j < Math.min(i + 50, lines.length); j++) {
        const checkLine = lines[j];
        braceCount += (checkLine.match(/{/g) || []).length;
        braceCount -= (checkLine.match(/}/g) || []).length;
        if (/await\s/.test(checkLine)) hasAwait = true;
        if (/try\s*{/.test(checkLine)) hasTryCatch = true;
        if (braceCount <= 0 && j > i) break;
      }
      if (hasAwait && !hasTryCatch && !isNginx) {
        // Only flag if there are multiple awaits without try/catch
        const awaitCount = lines.slice(i, i + 30).filter(l => /await\s/.test(l)).length;
        if (awaitCount > 1) {
          addFinding(filePath, lineNum, 'LOW', 'BUG',
            'Async function with multiple awaits but no try/catch block',
            'Add try/catch to handle potential rejections gracefully');
        }
      }
    }

    // ----------------------------------------------------------
    // BUG: Null Reference Risks
    // ----------------------------------------------------------
    
    // Accessing properties without null check
    if (/\w+\.findUnique\s*\(/.test(line) || /\w+\.findOne\s*\(/.test(line)) {
      // Check if result is checked for null in next few lines
      const nextLines = lines.slice(i + 1, i + 5).join('\n');
      if (!nextLines.includes('if (!') && !nextLines.includes('if (') === false && !nextLines.includes('?.')) {
        // Only flag if there's no immediate null check
        const hasNullCheck = lines.slice(i + 1, i + 8).some(l => 
          /if\s*\(\s*!?\w+\s*\)/.test(l) || /\?\./.test(l)
        );
        if (!hasNullCheck) {
          addFinding(filePath, lineNum, 'MEDIUM', 'BUG',
            'Database query result used without null check',
            'Add null check before accessing properties of query result');
        }
      }
    }

    // ----------------------------------------------------------
    // BUG: Missing Error Handling
    // ----------------------------------------------------------
    
    // .catch() that swallows errors
    if (/\.catch\s*\(\s*\(\s*\)\s*=>\s*\{?\s*\}?\s*\)/.test(line) || 
        /\.catch\s*\(\s*\(\s*\)\s*=>\s*null\s*\)/.test(line)) {
      addFinding(filePath, lineNum, 'MEDIUM', 'BUG',
        'Error silently swallowed - no logging or handling',
        'Log errors or rethrow them; never silently catch');
    }

    // Empty catch block
    if (/catch\s*\(\s*\w+\s*\)\s*\{\s*\}/.test(trimmed)) {
      addFinding(filePath, lineNum, 'MEDIUM', 'BUG',
        'Empty catch block - error silently ignored',
        'Add error logging or rethrow the error');
    }

    // ----------------------------------------------------------
    // PERFORMANCE: N+1 Query Patterns
    // ----------------------------------------------------------
    
    // Loop with database query
    if (/for\s*\(/.test(line) || /\.forEach\s*\(/.test(line) || /\.map\s*\(/.test(line)) {
      const nextLines = lines.slice(i, i + 5).join('\n');
      if (nextLines.includes('.find') || nextLines.includes('.create') || 
          nextLines.includes('.update') || nextLines.includes('.delete') ||
          nextLines.includes('prisma')) {
        addFinding(filePath, lineNum, 'HIGH', 'PERFORMANCE',
          'Possible N+1 query - database operation inside loop',
          'Use Prisma findMany with where.in, or batch operations');
      }
    }

    // ----------------------------------------------------------
    // PERFORMANCE: Unbounded Arrays/Caches
    // ----------------------------------------------------------
    
    // Pushing to array without bounds check
    if (/\.push\s*\(/.test(line) && !line.includes('MAX') && !line.includes('limit')) {
      // Check if there's a length check nearby
      const nearbyLines = lines.slice(Math.max(0, i - 3), i + 3).join('\n');
      if (!nearbyLines.includes('.length') && !nearbyLines.includes('slice') && !nearbyLines.includes('splice')) {
        // Only flag for cache-like patterns
        if (line.includes('buffer') || line.includes('cache') || line.includes('store') || line.includes('queue')) {
          addFinding(filePath, lineNum, 'MEDIUM', 'PERFORMANCE',
            'Unbounded array push - potential memory leak',
            'Add size limits or use LRU cache with max size');
        }
      }
    }

    // ----------------------------------------------------------
    // PERFORMANCE: Synchronous Blocking Operations
    // ----------------------------------------------------------
    
    // Sync operations in request handlers
    if (isExpress || isNestJS) {
      if (/JSON\.parse\s*\(/.test(line) && line.includes('large')) {
        addFinding(filePath, lineNum, 'LOW', 'PERFORMANCE',
          'Synchronous JSON.parse on potentially large data',
          'Use streaming JSON parser for large payloads');
      }
    }

    // ----------------------------------------------------------
    // QUALITY: Missing Validation
    // ----------------------------------------------------------
    
    // Using req.body/params/query without validation
    if (isExpress && (line.includes('req.body') || line.includes('req.params') || line.includes('req.query'))) {
      if (!line.includes('validate') && !line.includes('schema') && !line.includes('zod') && !line.includes('joi')) {
        // Check if validation is done earlier in the function
        const funcStart = findFunctionStart(lines, i);
        const funcBody = lines.slice(funcStart, i).join('\n');
        if (!funcBody.includes('validate') && !funcBody.includes('schema')) {
          addFinding(filePath, lineNum, 'MEDIUM', 'QUALITY',
            'Request input used without explicit validation',
            'Add input validation using Zod, Joi, or express-validator');
        }
      }
    }

    // ----------------------------------------------------------
    // QUALITY: Missing Auth Guards
    // ----------------------------------------------------------
    
    // Express routes without auth middleware
    if (isExpress && (line.includes('router.get') || line.includes('router.post') || 
        line.includes('router.put') || line.includes('router.patch') || line.includes('router.delete'))) {
      if (!line.includes('authMiddleware') && !line.includes('auth') && !line.includes('protect')) {
        // Check if it's a public route (health, metrics, etc.)
        if (!line.includes('/health') && !line.includes('/metrics') && !line.includes('/public')) {
          addFinding(filePath, lineNum, 'HIGH', 'QUALITY',
            'Route without authentication middleware',
            'Add authMiddleware to protect this route');
        }
      }
    }

    // NestJS routes without guards
    if (isNestJS && (line.includes('@Get(') || line.includes('@Post(') || line.includes('@Put(') || 
        line.includes('@Patch(') || line.includes('@Delete('))) {
      if (!line.includes('admin') && !line.includes('health') && !line.includes('metrics') && !line.includes('auth')) {
        // Check if @UseGuards is applied at controller or method level
        const nearbyLines = lines.slice(Math.max(0, i - 10), i + 1).join('\n');
        if (!nearbyLines.includes('@UseGuards') && !nearbyLines.includes('JwtAuthGuard')) {
          // Check if controller has global guard
          const controllerLines = lines.slice(0, i).join('\n');
          if (!controllerLines.includes('@UseGuards(JwtAuthGuard')) {
            addFinding(filePath, lineNum, 'HIGH', 'QUALITY',
              'NestJS route without @UseGuards(JwtAuthGuard)',
              'Add @UseGuards(JwtAuthGuard) to protect this endpoint');
          }
        }
      }
    }

    // ----------------------------------------------------------
    // QUALITY: Logging Sensitive Data
    // ----------------------------------------------------------
    
    // Logging password, token, secret
    if (/(?:logger|console)\.(log|info|debug|warn|error)\s*\(/i.test(line)) {
      if (line.includes('password') || line.includes('token') || line.includes('secret') || 
          line.includes('authorization') || line.includes('creditCard') || line.includes('cvv')) {
        if (!line.includes('hashed') && !line.includes('masked')) {
          addFinding(filePath, lineNum, 'HIGH', 'QUALITY',
            'Sensitive data may be logged (password/token/secret)',
            'Never log sensitive data. Use masking or exclude sensitive fields from logs');
        }
      }
    }

    // Logging request body with potential sensitive data
    if (/(?:logger|console)\.(log|info|debug)\s*\(/i.test(line) && line.includes('req.body')) {
      addFinding(filePath, lineNum, 'MEDIUM', 'QUALITY',
        'Logging request body - may contain sensitive data',
        'Sanitize request body before logging, exclude password/token fields');
    }

    // ----------------------------------------------------------
    // QUALITY: CORS Misconfiguration
    // ----------------------------------------------------------
    
    if (/cors\s*\(\s*\{\s*origin\s*:\s*['"]\*['"]/i.test(line) || 
        /origin\s*:\s*['"]\*['"]/.test(line)) {
      addFinding(filePath, lineNum, 'HIGH', 'QUALITY',
        'CORS wildcard origin (*) - allows any domain',
        'Specify allowed origins explicitly');
    }

    // ----------------------------------------------------------
    // SECURITY: Rate Limiting
    // ----------------------------------------------------------
    
    // Check for routes without rate limiting (NestJS)
    if (isNestJS && (line.includes('@Post(') || line.includes('@Patch(') || line.includes('@Delete('))) {
      if (line.includes('auth') || line.includes('login') || line.includes('register') || line.includes('password')) {
        const nearbyLines = lines.slice(Math.max(0, i - 5), i + 1).join('\n');
        if (!nearbyLines.includes('Throttle') && !nearbyLines.includes('SkipThrottle')) {
          addFinding(filePath, lineNum, 'MEDIUM', 'SECURITY',
            'Auth-sensitive endpoint without rate limiting decorator',
            'Add @Throttle() decorator to limit requests on auth endpoints');
        }
      }
    }

    // ----------------------------------------------------------
    // SECURITY: JWT Configuration Issues
    // ----------------------------------------------------------
    
    // JWT without expiration
    if (/jwtService\.sign\s*\(/.test(line) || /jwtService\.signAsync\s*\(/.test(line)) {
      if (!lines.slice(i, i + 10).join('\n').includes('expiresIn')) {
        addFinding(filePath, lineNum, 'HIGH', 'SECURITY',
          'JWT token generated without expiration',
          'Always set expiresIn for JWT tokens');
      }
    }

    // ----------------------------------------------------------
    // BUG: Race Conditions
    // ----------------------------------------------------------
    
    // Promise.all with dependent operations
    if (/Promise\.all\s*\(/.test(line)) {
      // Check if operations are dependent on each other
      const promiseContent = lines.slice(i, i + 10).join('\n');
      if (promiseContent.includes('create') && promiseContent.includes('update')) {
        addFinding(filePath, lineNum, 'MEDIUM', 'BUG',
          'Promise.all with potentially dependent operations - race condition risk',
          'Ensure operations in Promise.all are independent, or use sequential execution');
      }
    }

    // ----------------------------------------------------------
    // QUALITY: Excessive Permissions
    // ----------------------------------------------------------
    
    // Admin routes without proper role check
    if (line.includes('@Roles(') && line.includes('ADMIN')) {
      // This is actually good practice, no finding
    }

    // ----------------------------------------------------------
    // NGINX Specific Checks
    // ----------------------------------------------------------
    
    if (isNginx) {
      // Listening on port 80 without redirect to HTTPS
      if (/listen\s+80/.test(line)) {
        // Check if there's a redirect to HTTPS
        const hasSSL = lines.some(l => /listen\s+443\s+ssl/.test(l));
        const hasRedirect = lines.some(l => /return\s+301\s+https/.test(l));
        if (!hasSSL && !hasRedirect) {
          addFinding(filePath, lineNum, 'HIGH', 'SECURITY',
            'Server listening on port 80 without HTTPS redirect',
            'Add HTTPS redirect or configure SSL/TLS');
        }
      }

      // Missing security headers
      if (/server\s*\{/.test(line)) {
        const serverBlock = lines.slice(i, lines.length).join('\n');
        if (!serverBlock.includes('X-Frame-Options')) {
          addFinding(filePath, lineNum, 'MEDIUM', 'SECURITY',
            'Missing X-Frame-Options header',
            'Add: add_header X-Frame-Options "SAMEORIGIN" always;');
        }
        if (!serverBlock.includes('X-Content-Type-Options')) {
          addFinding(filePath, lineNum, 'MEDIUM', 'SECURITY',
            'Missing X-Content-Type-Options header',
            'Add: add_header X-Content-Type-Options "nosniff" always;');
        }
      }

      // Server version exposure
      if (/server_tokens\s+on/.test(line)) {
        addFinding(filePath, lineNum, 'LOW', 'SECURITY',
          'Server tokens enabled - exposes nginx version',
          'Add: server_tokens off;');
      }

      // Missing rate limiting on sensitive endpoints
      if (/location.*admin/.test(line)) {
        if (!lines.slice(i, i + 10).join('\n').includes('limit_req')) {
          addFinding(filePath, lineNum, 'MEDIUM', 'SECURITY',
            'Admin endpoint without rate limiting',
            'Add limit_req directive to admin endpoints');
        }
      }

      // Proxy without proper headers
      if (/proxy_pass/.test(line)) {
        const locationBlock = lines.slice(i, i + 15).join('\n');
        if (!locationBlock.includes('X-Real-IP')) {
          addFinding(filePath, lineNum, 'LOW', 'QUALITY',
            'Proxy pass without X-Real-IP header',
            'Add: proxy_set_header X-Real-IP $remote_addr;');
        }
      }
    }

    // ----------------------------------------------------------
    // PERFORMANCE: Memory Leaks
    // ----------------------------------------------------------
    
    // setInterval without clearInterval
    if (/setInterval\s*\(/.test(line)) {
      const funcStart = findFunctionStart(lines, i);
      const funcEnd = findFunctionEnd(lines, funcStart);
      const funcBody = lines.slice(funcStart, funcEnd).join('\n');
      if (!funcBody.includes('clearInterval') && !funcBody.includes('onModuleDestroy')) {
        addFinding(filePath, lineNum, 'MEDIUM', 'PERFORMANCE',
          'setInterval without corresponding clearInterval - memory leak risk',
          'Store interval ID and clear it on module destroy or component unmount');
      }
    }

    // Event listeners without removal
    if (/\.on\s*\(/.test(line) && (line.includes('process') || line.includes('event'))) {
      if (!lines.slice(i, i + 20).join('\n').includes('.off(') && !lines.slice(i, i + 20).join('\n').includes('.removeListener(')) {
        addFinding(filePath, lineNum, 'LOW', 'PERFORMANCE',
          'Event listener added without removal - potential memory leak',
          'Remove event listeners when no longer needed');
      }
    }

    // Map/Set used as unbounded cache
    if (/new\s+Map\s*\(\s*\)/.test(line) || /new\s+Set\s*\(\s*\)/.test(line)) {
      const varName = trimmed.match(/(\w+)\s*=\s*new\s+(Map|Set)/);
      if (varName) {
        const name = varName[1];
        // Check if there's any size limiting
        const restOfFile = lines.slice(i).join('\n');
        if (!restOfFile.includes(`${name}.size`) && !restOfFile.includes(`${name}.delete`) && 
            !restOfFile.includes('MAX') && !restOfFile.includes('limit')) {
          addFinding(filePath, lineNum, 'MEDIUM', 'PERFORMANCE',
            `Map/Set "${name}" used without size limits - potential memory leak`,
            'Add size limits, implement LRU eviction, or use a bounded cache');
        }
      }
    }

    // ----------------------------------------------------------
    // EXPLOIT: SSRF (Server-Side Request Forgery)
    // ----------------------------------------------------------
    
    if (/fetch\s*\(/.test(line) || /axios\./.test(line) || /http\.get/.test(line) || /http\.post/.test(line)) {
      if (line.includes('req.') || line.includes('body') || line.includes('query') || line.includes('url')) {
        addFinding(filePath, lineNum, 'HIGH', 'EXPLOIT',
          'HTTP request with user-controlled URL - SSRF risk',
          'Validate URLs against allowlist, block internal IP ranges');
      }
    }

    // ----------------------------------------------------------
    // EXPLOIT: Open Redirect
    // ----------------------------------------------------------
    
    if (/res\.redirect\s*\(/.test(line) && (line.includes('req.') || line.includes('query') || line.includes('body'))) {
      addFinding(filePath, lineNum, 'HIGH', 'EXPLOIT',
        'Redirect with user-controlled URL - open redirect risk',
        'Validate redirect URLs against allowlist');
    }

    // ----------------------------------------------------------
    // QUALITY: Console.log in production code
    // ----------------------------------------------------------
    
    if (/(?:console\.(log|warn|error))\s*\(/.test(line) && isNestJS) {
      addFinding(filePath, lineNum, 'LOW', 'QUALITY',
        'console.log used instead of proper logger',
        'Use the injected logger (Winston) instead of console.log');
    }

    // ----------------------------------------------------------
    // BUG: Type Mismatch Risks
    // ----------------------------------------------------------
    
    // parseInt/parseFloat without radix or validation
    if (/parseInt\s*\(/.test(line) && !line.includes(', 10') && !line.includes(',10')) {
      addFinding(filePath, lineNum, 'LOW', 'BUG',
        'parseInt without radix parameter - may parse as octal',
        'Always specify radix: parseInt(value, 10)');
    }

    // ----------------------------------------------------------
    // SECURITY: CSRF
    // ----------------------------------------------------------
    
    // Express without CSRF protection
    if (isExpress && line.includes('app.use(') && i === lines.findIndex(l => l.includes('app.use('))) {
      const fileContent = lines.join('\n');
      if (!fileContent.includes('csurf') && !fileContent.includes('csrf')) {
        // Only flag once per file
        if (line.includes('express.json') || line.includes('cors')) {
          addFinding(filePath, lineNum, 'MEDIUM', 'SECURITY',
            'Express app without CSRF protection',
            'Add csurf middleware for CSRF protection on state-changing endpoints');
        }
      }
    }
  }

  // ----------------------------------------------------------
  // File-Level Checks
  // ----------------------------------------------------------
  
  const fileContent = lines.join('\n');

  // Check for missing helmet in Express apps
  if (isExpress && !fileContent.includes('helmet')) {
    addFinding(filePath, 1, 'MEDIUM', 'SECURITY',
      'Express app without Helmet security headers',
      'Add: app.use(helmet()); for security headers');
  }

  // Check for missing rate limiting in Express apps
  if (isExpress && !fileContent.includes('rateLimit') && !fileContent.includes('rate-limit')) {
    addFinding(filePath, 1, 'MEDIUM', 'SECURITY',
      'Express app without rate limiting',
      'Add express-rate-limit middleware');
  }

  // Check for Prisma without connection pooling config
  if (fileContent.includes('PrismaClient') && !fileContent.includes('datasource') && isInfra === false) {
    // Only flag the service file
    if (fileContent.includes('extends PrismaClient')) {
      // This is fine, Prisma handles pooling
    }
  }

  // Check for missing graceful shutdown
  if (isExpress && !fileContent.includes('SIGTERM') && !fileContent.includes('SIGINT')) {
    addFinding(filePath, 1, 'LOW', 'QUALITY',
      'No graceful shutdown handlers configured',
      'Add SIGTERM/SIGINT handlers for clean shutdown');
  }

  // Check for any 'any' type usage
  const anyTypeMatches = fileContent.match(/:\s*any\b/g);
  if (anyTypeMatches && anyTypeMatches.length > 3) {
    addFinding(filePath, 1, 'LOW', 'QUALITY',
      `Excessive use of 'any' type (${anyTypeMatches.length} occurrences)`,
      'Replace "any" with specific types for better type safety');
  }

  // Check for missing input validation DTOs in NestJS
  if (isNestJS && fileContent.includes('@Body()') && !fileContent.includes('Dto')) {
    addFinding(filePath, 1, 'MEDIUM', 'QUALITY',
      '@Body() parameter without DTO validation class',
      'Create a DTO class with class-validator decorators');
  }

  // Check for hardcoded URLs
  const hardcodedUrls = fileContent.match(/https?:\/\/[^\s'"]+/g);
  if (hardcodedUrls) {
    for (const url of hardcodedUrls) {
      if (!url.includes('localhost') && !url.includes('example.com') && !url.includes('schema.org')) {
        const urlLine = lines.findIndex(l => l.includes(url)) + 1;
        if (urlLine > 0) {
          addFinding(filePath, urlLine, 'LOW', 'QUALITY',
            `Hardcoded URL: ${url}`,
            'Move URLs to environment variables or configuration');
        }
      }
    }
  }
}

function findFunctionStart(lines, currentLine) {
  for (let i = currentLine; i >= 0; i--) {
    if (/^(async\s+)?function\s+|^(export\s+)?(const|let|var)\s+\w+\s*=\s*(async\s+)?\(/.test(lines[i].trim())) {
      return i;
    }
  }
  return Math.max(0, currentLine - 30);
}

function findFunctionEnd(lines, startLine) {
  let braceCount = 0;
  for (let i = startLine; i < lines.length; i++) {
    braceCount += (lines[i].match(/{/g) || []).length;
    braceCount -= (lines[i].match(/}/g) || []).length;
    if (braceCount <= 0 && i > startLine) {
      return i;
    }
  }
  return lines.length - 1;
}

// ============================================================
// Specific Pattern Scans
// ============================================================

function scanSpecificPatterns(filePath) {
  const lines = readFileLines(filePath);
  const relPath = getRelativePath(filePath);
  const fileContent = lines.join('\n');
  const isNestJS = relPath.includes('main/src');
  const isExpress = relPath.includes('microservices');

  // Check auth middleware - token verification
  if (relPath.includes('auth.middleware')) {
    if (!fileContent.includes('verify') && !fileContent.includes('jwt') && !fileContent.includes('jsonwebtoken')) {
      addFinding(filePath, 1, 'CRITICAL', 'SECURITY',
        'Auth middleware extracts token but does not verify it',
        'Add JWT verification (jwt.verify) to validate tokens');
    }
  }

  // Check users service - in-memory store
  if (relPath.includes('users.service') && relPath.includes('microservices')) {
    if (fileContent.includes('new Map')) {
      addFinding(filePath, 1, 'HIGH', 'BUG',
        'Users service uses in-memory Map store - data lost on restart',
        'Use a persistent database (PostgreSQL, MongoDB) for production');
    }
    if (!fileContent.includes('hashPassword') && !fileContent.includes('bcrypt')) {
      addFinding(filePath, 1, 'HIGH', 'SECURITY',
        'User service does not hash passwords',
        'Use bcrypt or argon2 to hash passwords before storage');
    }
  }

  // Check shared crypto - token generation
  if (relPath.includes('crypto.ts') && relPath.includes('shared')) {
    if (fileContent.includes('Math.random')) {
      addFinding(filePath, 1, 'HIGH', 'SECURITY',
        'Token generation uses Math.random() - not cryptographically secure',
        'Use crypto.randomBytes() for secure token generation');
    }
  }

  // Check reports service - path traversal
  if (relPath.includes('reports.service')) {
    if (fileContent.includes('getReportContent') && fileContent.includes('path.join')) {
      // Check if filename is sanitized
      const getContent = fileContent.match(/getReportContent[\s\S]*?{[\s\S]*?}/);
      if (getContent && !getContent[0].includes('..') === false) {
        // The function doesn't sanitize filename
        addFinding(filePath, 1, 'HIGH', 'EXPLOIT',
          'Report content retrieval without path traversal protection',
          'Validate filename does not contain ".." or absolute paths');
      }
    }
  }

  // Check queue service - any type usage
  if (relPath.includes('queue.service')) {
    if (fileContent.includes('data: any')) {
      addFinding(filePath, 1, 'MEDIUM', 'QUALITY',
        'Queue service methods accept "any" type - no input validation',
        'Define proper interfaces for queue job data');
    }
  }

  // Check analytics service - event buffer
  if (relPath.includes('analytics.service')) {
    if (fileContent.includes('eventBuffer') && fileContent.includes('MAX_BUFFER_SIZE')) {
      // Good - has buffer limit
    } else if (fileContent.includes('eventBuffer')) {
      addFinding(filePath, 1, 'MEDIUM', 'PERFORMANCE',
        'Analytics event buffer without size limit',
        'Add MAX_BUFFER_SIZE check before pushing to buffer');
    }
  }

  // Check health controller - empty health check
  if (relPath.includes('health.controller')) {
    if (fileContent.includes('.check([])')) {
      addFinding(filePath, 1, 'MEDIUM', 'QUALITY',
        'Health check has no actual health indicators configured',
        'Add database, Redis, and other service health checks');
    }
  }

  // Check ops controller - stub implementation
  if (relPath.includes('ops.controller')) {
    if (fileContent.includes('activeIncidents: []') && fileContent.includes('metrics: {')) {
      addFinding(filePath, 1, 'LOW', 'QUALITY',
        'Ops dashboard returns stub/empty data',
        'Implement actual data fetching for dashboard metrics');
    }
  }

  // Check metrics controller - exposed without auth
  if (relPath.includes('metrics.controller')) {
    addFinding(filePath, 1, 'MEDIUM', 'SECURITY',
      'Prometheus metrics endpoint exposed without authentication',
      'Add authentication or IP restriction to /metrics endpoint');
    }

  // Check nginx - Grafana/Prometheus/Jaeger exposed
  if (relPath.includes('nginx.conf')) {
    if (fileContent.includes('location /grafana') && !fileContent.includes('auth_basic')) {
      addFinding(filePath, 1, 'HIGH', 'SECURITY',
        'Grafana exposed without authentication at nginx level',
        'Add auth_basic or IP restriction to Grafana location');
    }
    if (fileContent.includes('location /prometheus') && !fileContent.includes('auth_basic')) {
      addFinding(filePath, 1, 'HIGH', 'SECURITY',
        'Prometheus exposed without authentication at nginx level',
        'Add auth_basic or IP restriction to Prometheus location');
    }
    if (fileContent.includes('location /jaeger') && !fileContent.includes('auth_basic')) {
      addFinding(filePath, 1, 'HIGH', 'SECURITY',
        'Jaeger UI exposed without authentication at nginx level',
        'Add auth_basic or IP restriction to Jaeger location');
    }
  }

  // Check main.ts - Swagger in production
  if (relPath.includes('main.ts') && relPath.includes('main/src')) {
    if (fileContent.includes('SwaggerModule.setup') && !fileContent.includes('NODE_ENV')) {
      addFinding(filePath, 1, 'MEDIUM', 'SECURITY',
        'Swagger UI enabled - verify it is disabled in production',
        'Wrap Swagger setup in NODE_ENV !== "production" check');
    }
  }

  // Check JWT strategy - missing email in payload
  if (relPath.includes('jwt.strategy')) {
    if (fileContent.includes('payload.email') && !fileContent.includes('email')) {
      // Check if email is actually in the JWT payload
      const authServiceContent = fs.readFileSync(
        path.join(PROJECT_ROOT, 'main/src/auth/auth.service.ts'), 'utf-8'
      );
      if (!authServiceContent.includes('email') === false) {
        // Email might not be in the token payload
      }
    }
  }

  // Check prisma service - missing error handling on connect
  if (relPath.includes('prisma.service')) {
    if (fileContent.includes('$connect()') && !fileContent.includes('try')) {
      addFinding(filePath, 1, 'MEDIUM', 'BUG',
        'Prisma $connect() without error handling',
        'Wrap $connect() in try/catch to handle connection failures');
    }
  }

  // Check shared validation - sanitizeInput incomplete
  if (relPath.includes('validation.ts') && relPath.includes('shared')) {
    if (fileContent.includes('sanitizeInput') && !fileContent.includes('script') && !fileContent.includes('onerror')) {
      addFinding(filePath, 1, 'MEDIUM', 'SECURITY',
        'sanitizeInput only removes <> characters - incomplete XSS protection',
        'Use a proper sanitization library like DOMPurify or sanitize-html');
    }
  }

  // Check express index.ts - cors with default settings
  if (relPath.includes('index.ts') && relPath.includes('microservices')) {
    if (fileContent.includes('cors()') && !fileContent.includes('origin:')) {
      addFinding(filePath, 1, 'MEDIUM', 'SECURITY',
        'CORS enabled with default settings (allows all origins)',
        'Configure CORS with specific allowed origins');
    }
  }

  // Check for process.exit usage
  if (fileContent.includes('process.exit(')) {
    const exitLine = lines.findIndex(l => l.includes('process.exit(')) + 1;
    if (exitLine > 0 && !relPath.includes('main.ts')) {
      addFinding(filePath, exitLine, 'MEDIUM', 'BUG',
        'process.exit() called - may prevent graceful shutdown',
        'Use proper error handling and let the process exit naturally');
    }
  }

  // Check for unhandled promise rejections in event handlers
  if (fileContent.includes('process.on(') && fileContent.includes('unhandledRejection')) {
    // Good - has handler
  } else if (isExpress || isNestJS) {
    // Check if there's any global error handler
    if (!fileContent.includes('unhandledRejection') && !fileContent.includes('uncaughtException')) {
      if (relPath.includes('index.ts') || relPath.includes('main.ts')) {
        addFinding(filePath, 1, 'LOW', 'BUG',
          'No global unhandledRejection/uncaughtException handler',
          'Add process.on("unhandledRejection") handler for graceful error handling');
      }
    }
  }
}

// ============================================================
// Main Scan Execution
// ============================================================

console.log('='.repeat(70));
console.log('  AI DOCTOR - Comprehensive Security & Quality Scanner');
console.log('='.repeat(70));
console.log('');

const targetDirs = [
  path.join(PROJECT_ROOT, 'main/src'),
  path.join(PROJECT_ROOT, 'microservices'),
  path.join(PROJECT_ROOT, 'packages'),
  path.join(PROJECT_ROOT, 'infrastructure/ai-doctor'),
];

const allFiles = [];
for (const dir of targetDirs) {
  const files = getAllFiles(dir, [path.relative(PROJECT_ROOT, dir)]);
  allFiles.push(...files);
}

// Add nginx.conf
const nginxPath = path.join(PROJECT_ROOT, 'gateway/nginx.conf');
if (fs.existsSync(nginxPath)) {
  allFiles.push(nginxPath);
}

// Deduplicate
const uniqueFiles = [...new Set(allFiles)];

console.log(`Scanning ${uniqueFiles.length} files...`);
console.log('');

for (const file of uniqueFiles) {
  scanFile(file);
  scanSpecificPatterns(file);
}

// ============================================================
// Deduplicate findings
// ============================================================

const uniqueFindings = [];
const seen = new Set();

for (const finding of findings) {
  const key = `${finding.file}:${finding.line}:${finding.description}`;
  if (!seen.has(key)) {
    seen.add(key);
    uniqueFindings.push(finding);
  }
}

// Sort by severity
const severityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3, INFO: 4 };
uniqueFindings.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

// ============================================================
// Generate Report
// ============================================================

const severityCounts = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0, INFO: 0 };
const categoryCounts = { SECURITY: 0, BUG: 0, PERFORMANCE: 0, EXPLOIT: 0, QUALITY: 0 };

for (const f of uniqueFindings) {
  severityCounts[f.severity]++;
  categoryCounts[f.category]++;
}

console.log('='.repeat(70));
console.log('  SCAN RESULTS');
console.log('='.repeat(70));
console.log('');

console.log('SUMMARY');
console.log('-'.repeat(70));
console.log(`Total findings: ${uniqueFindings.length}`);
console.log('');
console.log('By Severity:');
console.log(`  CRITICAL: ${severityCounts.CRITICAL}`);
console.log(`  HIGH:     ${severityCounts.HIGH}`);
console.log(`  MEDIUM:   ${severityCounts.MEDIUM}`);
console.log(`  LOW:      ${severityCounts.LOW}`);
console.log('');
console.log('By Category:');
console.log(`  SECURITY:    ${categoryCounts.SECURITY}`);
console.log(`  BUG:         ${categoryCounts.BUG}`);
console.log(`  PERFORMANCE: ${categoryCounts.PERFORMANCE}`);
console.log(`  EXPLOIT:     ${categoryCounts.EXPLOIT}`);
console.log(`  QUALITY:     ${categoryCounts.QUALITY}`);
console.log('');

// Detailed findings
console.log('='.repeat(70));
console.log('  DETAILED FINDINGS');
console.log('='.repeat(70));
console.log('');

let currentSeverity = '';
for (const f of uniqueFindings) {
  if (f.severity !== currentSeverity) {
    currentSeverity = f.severity;
    console.log('');
    console.log(`--- ${currentSeverity} ---`);
    console.log('');
  }
  
  const severityEmoji = {
    CRITICAL: '🔴',
    HIGH: '🟠',
    MEDIUM: '🟡',
    LOW: '🔵',
    INFO: '⚪'
  };
  
  console.log(`[${severityEmoji[f.severity]}] ${f.severity} | ${f.category}`);
  console.log(`    File: ${f.file}:${f.line}`);
  console.log(`    Issue: ${f.description}`);
  console.log(`    Fix: ${f.suggestion}`);
  console.log('');
}

// ============================================================
// Save report to file
// ============================================================

const reportDir = path.join(PROJECT_ROOT, 'reports');
if (!fs.existsSync(reportDir)) {
  fs.mkdirSync(reportDir, { recursive: true });
}

const reportPath = path.join(reportDir, `ai-doctor-scan-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);

const report = {
  scanDate: new Date().toISOString(),
  projectRoot: PROJECT_ROOT,
  filesScanned: uniqueFiles.length,
  summary: {
    total: uniqueFindings.length,
    bySeverity: severityCounts,
    byCategory: categoryCounts,
  },
  findings: uniqueFindings,
};

fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

console.log('='.repeat(70));
console.log(`  Full report saved to: ${getRelativePath(reportPath)}`);
console.log('='.repeat(70));
