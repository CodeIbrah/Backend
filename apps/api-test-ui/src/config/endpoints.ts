export interface EndpointDoc {
  method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  path: string;
  summary: string;
  description: string;
  auth: 'required' | 'optional' | 'none';
  tags: string[];
  params?: { name: string; type: string; required: boolean; description: string }[];
  queryParams?: { name: string; type: string; required: boolean; description: string }[];
  headers?: { name: string; value: string; description: string }[];
  body?: { contentType: string; example: string; schema: Record<string, unknown> };
  response?: { status: number; description: string; example: string | null }[];
}

export interface EndpointGroup {
  name: string;
  description: string;
  icon: string;
  endpoints: EndpointDoc[];
}

export const endpointGroups: EndpointGroup[] = [
  {
    name: 'Health',
    description: 'Health check endpoints for monitoring and Kubernetes probes',
    icon: 'Heart',
    endpoints: [
      {
        method: 'GET',
        path: '/api/v1/health',
        summary: 'Health check',
        description: 'Returns overall application health status including database connectivity. Used by monitoring systems and load balancers.',
        auth: 'none',
        tags: ['health', 'monitoring'],
        response: [
          {
            status: 200,
            description: 'Health check passed',
            example: JSON.stringify({ status: 'ok', info: { database: { status: 'up' } }, error: {}, details: { database: { status: 'up' } } }, null, 2),
          },
          {
            status: 503,
            description: 'Health check failed (database down)',
            example: JSON.stringify({ status: 'error', info: {}, error: { database: { status: 'down', message: 'Connection refused' } }, details: { database: { status: 'down', message: 'Connection refused' } } }, null, 2),
          },
        ],
      },
      {
        method: 'GET',
        path: '/api/v1/health/ready',
        summary: 'Readiness probe',
        description: 'Kubernetes readiness probe. Checks that all dependencies (database, cache) are ready to accept traffic.',
        auth: 'none',
        tags: ['health', 'kubernetes'],
        response: [
          {
            status: 200,
            description: 'Service is ready',
            example: JSON.stringify({ status: 'ok', info: { database: { status: 'up' } }, error: {}, details: { database: { status: 'up' } } }, null, 2),
          },
          {
            status: 503,
            description: 'Service not ready',
            example: JSON.stringify({ status: 'error', info: {}, error: { database: { status: 'down' } } }, null, 2),
          },
        ],
      },
      {
        method: 'GET',
        path: '/api/v1/health/live',
        summary: 'Liveness probe',
        description: 'Kubernetes liveness probe. Lightweight check that the process is alive. Does not test dependencies.',
        auth: 'none',
        tags: ['health', 'kubernetes'],
        response: [
          {
            status: 200,
            description: 'Process is alive',
            example: JSON.stringify({ status: 'ok', timestamp: '2026-07-04T12:00:00.000Z' }, null, 2),
          },
        ],
      },
    ],
  },
  {
    name: 'Auth',
    description: 'Authentication and user session management',
    icon: 'Lock',
    endpoints: [
      {
        method: 'POST',
        path: '/api/v1/auth/register',
        summary: 'Register a new user',
        description: 'Creates a new user account. Returns user profile and JWT tokens. The password must be at least 8 characters.',
        auth: 'none',
        tags: ['auth', 'users'],
        headers: [
          { name: 'Content-Type', value: 'application/json', description: 'Request body format' },
          { name: 'X-Correlation-Id', value: 'corr-<uuid>', description: 'Correlation ID for distributed tracing' },
        ],
        body: {
          contentType: 'application/json',
          example: JSON.stringify({ email: 'user@example.com', password: 'password123', name: 'John Doe' }, null, 2),
          schema: { type: 'object', properties: { email: { type: 'string', format: 'email', maxLength: 255 }, password: { type: 'string', minLength: 8, maxLength: 255 }, name: { type: 'string', maxLength: 255 } }, required: ['email', 'password'] },
        },
        response: [
          {
            status: 201,
            description: 'User created successfully',
            example: JSON.stringify({ user: { id: 'cm7abc123', email: 'user@example.com', name: 'John Doe', role: 'USER' }, tokens: { accessToken: 'eyJhbGciOiJIUzI1NiIs...', refreshToken: 'eyJhbGciOiJIUzI1NiIs...' } }, null, 2),
          },
          {
            status: 409,
            description: 'Email already registered',
            example: JSON.stringify({ statusCode: 409, message: 'Email already exists', error: 'Conflict', timestamp: '2026-07-04T12:00:00.000Z', path: '/api/v1/auth/register' }, null, 2),
          },
          {
            status: 400,
            description: 'Validation error (invalid email, short password)',
            example: JSON.stringify({ statusCode: 400, message: ['password must be longer than or equal to 8 characters'], error: 'Bad Request', timestamp: '2026-07-04T12:00:00.000Z', path: '/api/v1/auth/register' }, null, 2),
          },
        ],
      },
      {
        method: 'POST',
        path: '/api/v1/auth/login',
        summary: 'Login with email and password',
        description: 'Authenticates a user and returns JWT tokens. This endpoint has strict rate limiting (5 requests per 15 minutes) to prevent brute force attacks.',
        auth: 'none',
        tags: ['auth'],
        headers: [
          { name: 'Content-Type', value: 'application/json', description: 'Request body format' },
        ],
        body: {
          contentType: 'application/json',
          example: JSON.stringify({ email: 'user@example.com', password: 'password123' }, null, 2),
          schema: { type: 'object', properties: { email: { type: 'string', format: 'email', maxLength: 255 }, password: { type: 'string', maxLength: 255 } }, required: ['email', 'password'] },
        },
        response: [
          {
            status: 200,
            description: 'Login successful',
            example: JSON.stringify({ user: { id: 'cm7abc123', email: 'user@example.com', name: 'John Doe', role: 'USER' }, tokens: { accessToken: 'eyJhbGciOiJIUzI1NiIs...', refreshToken: 'eyJhbGciOiJIUzI1NiIs...' } }, null, 2),
          },
          {
            status: 401,
            description: 'Invalid credentials',
            example: JSON.stringify({ statusCode: 401, message: 'Invalid credentials', error: 'Unauthorized', timestamp: '2026-07-04T12:00:00.000Z', path: '/api/v1/auth/login' }, null, 2),
          },
          {
            status: 429,
            description: 'Rate limit exceeded (5 req / 15 min)',
            example: JSON.stringify({ statusCode: 429, message: 'ThrottlerException: Too Many Requests', error: 'Too Many Requests', timestamp: '2026-07-04T12:00:00.000Z', path: '/api/v1/auth/login' }, null, 2),
          },
        ],
      },
      {
        method: 'POST',
        path: '/api/v1/auth/refresh',
        summary: 'Refresh access token',
        description: 'Exchanges a valid refresh token for a new access token and refresh token pair. Use this when the access token expires.',
        auth: 'none',
        tags: ['auth'],
        headers: [
          { name: 'Content-Type', value: 'application/json', description: 'Request body format' },
        ],
        body: {
          contentType: 'application/json',
          example: JSON.stringify({ refreshToken: 'eyJhbGciOiJIUzI1NiIs...' }, null, 2),
          schema: { type: 'object', properties: { refreshToken: { type: 'string' } }, required: ['refreshToken'] },
        },
        response: [
          {
            status: 200,
            description: 'Tokens refreshed successfully',
            example: JSON.stringify({ tokens: { accessToken: 'eyJhbGciOiJIUzI1NiIs...', refreshToken: 'eyJhbGciOiJIUzI1NiIs...' } }, null, 2),
          },
          {
            status: 401,
            description: 'Invalid or expired refresh token',
            example: JSON.stringify({ statusCode: 401, message: 'Invalid refresh token', error: 'Unauthorized', timestamp: '2026-07-04T12:00:00.000Z', path: '/api/v1/auth/refresh' }, null, 2),
          },
        ],
      },
      {
        method: 'POST',
        path: '/api/v1/auth/logout',
        summary: 'Logout and invalidate session',
        description: 'Invalidates the current session by blacklisting the refresh token. Requires a valid JWT access token.',
        auth: 'required',
        tags: ['auth'],
        headers: [
          { name: 'Authorization', value: 'Bearer <access_token>', description: 'JWT access token' },
        ],
        response: [
          {
            status: 200,
            description: 'Logged out successfully',
            example: JSON.stringify({ message: 'Logged out successfully' }, null, 2),
          },
          {
            status: 401,
            description: 'Missing or invalid token',
            example: JSON.stringify({ statusCode: 401, message: 'Unauthorized', error: 'Unauthorized', timestamp: '2026-07-04T12:00:00.000Z', path: '/api/v1/auth/logout' }, null, 2),
          },
        ],
      },
      {
        method: 'GET',
        path: '/api/v1/auth/profile',
        summary: 'Get current user profile',
        description: 'Returns the authenticated user\'s profile information. Requires a valid JWT access token.',
        auth: 'required',
        tags: ['auth', 'profile'],
        headers: [
          { name: 'Authorization', value: 'Bearer <access_token>', description: 'JWT access token' },
        ],
        response: [
          {
            status: 200,
            description: 'User profile',
            example: JSON.stringify({ id: 'cm7abc123', email: 'user@example.com', name: 'John Doe', role: 'USER', isActive: true, createdAt: '2026-07-04T12:00:00.000Z', updatedAt: '2026-07-04T12:00:00.000Z' }, null, 2),
          },
          {
            status: 401,
            description: 'Missing or invalid token',
            example: JSON.stringify({ statusCode: 401, message: 'Unauthorized', error: 'Unauthorized', timestamp: '2026-07-04T12:00:00.000Z', path: '/api/v1/auth/profile' }, null, 2),
          },
        ],
      },
    ],
  },
  {
    name: 'Users',
    description: 'User management (admin-only for mutations)',
    icon: 'Users',
    endpoints: [
      {
        method: 'GET',
        path: '/api/v1/users',
        summary: 'List all users (paginated)',
        description: 'Returns a paginated list of all users. ADMIN role required. Results are cached with Redis + LRU 2-tier cache.',
        auth: 'required',
        tags: ['users', 'admin'],
        headers: [
          { name: 'Authorization', value: 'Bearer <access_token>', description: 'JWT access token (ADMIN role)' },
        ],
        queryParams: [
          { name: 'page', type: 'integer', required: false, description: 'Page number (default: 1, min: 1)' },
          { name: 'limit', type: 'integer', required: false, description: 'Items per page (default: 10, max: 100)' },
        ],
        response: [
          {
            status: 200,
            description: 'Paginated user list',
            example: JSON.stringify({ users: [{ id: 'cm7abc123', email: 'user@example.com', name: 'John Doe', role: 'USER', isActive: true, createdAt: '2026-07-04T12:00:00.000Z', updatedAt: '2026-07-04T12:00:00.000Z' }], total: 1, page: 1, limit: 10 }, null, 2),
          },
          {
            status: 403,
            description: 'Forbidden (non-ADMIN role)',
            example: JSON.stringify({ statusCode: 403, message: 'Forbidden resource', error: 'Forbidden', timestamp: '2026-07-04T12:00:00.000Z', path: '/api/v1/users' }, null, 2),
          },
        ],
      },
      {
        method: 'GET',
        path: '/api/v1/users/:id',
        summary: 'Get user by ID',
        description: 'Returns a single user by ID. Users can view their own profile; ADMIN can view any profile.',
        auth: 'required',
        tags: ['users'],
        headers: [
          { name: 'Authorization', value: 'Bearer <access_token>', description: 'JWT access token' },
        ],
        params: [
          { name: 'id', type: 'string', required: true, description: 'User ID (CUID format)' },
        ],
        response: [
          {
            status: 200,
            description: 'User details',
            example: JSON.stringify({ id: 'cm7abc123', email: 'user@example.com', name: 'John Doe', role: 'USER', isActive: true, createdAt: '2026-07-04T12:00:00.000Z', updatedAt: '2026-07-04T12:00:00.000Z' }, null, 2),
          },
          {
            status: 403,
            description: 'Forbidden (viewing another user without ADMIN role)',
            example: JSON.stringify({ statusCode: 403, message: 'You can only view your own profile', error: 'Forbidden', timestamp: '2026-07-04T12:00:00.000Z', path: '/api/v1/users/:id' }, null, 2),
          },
          {
            status: 404,
            description: 'User not found',
            example: JSON.stringify({ statusCode: 404, message: 'User not found', error: 'Not Found', timestamp: '2026-07-04T12:00:00.000Z', path: '/api/v1/users/:id' }, null, 2),
          },
        ],
      },
      {
        method: 'PATCH',
        path: '/api/v1/users/:id',
        summary: 'Update user',
        description: 'Updates a user\'s profile information. ADMIN role required.',
        auth: 'required',
        tags: ['users', 'admin'],
        headers: [
          { name: 'Authorization', value: 'Bearer <access_token>', description: 'JWT access token (ADMIN role)' },
          { name: 'Content-Type', value: 'application/json', description: 'Request body format' },
        ],
        params: [
          { name: 'id', type: 'string', required: true, description: 'User ID (CUID format)' },
        ],
        body: {
          contentType: 'application/json',
          example: JSON.stringify({ name: 'Updated Name', role: 'ADMIN', isActive: true }, null, 2),
          schema: { type: 'object', properties: { name: { type: 'string', maxLength: 255 }, role: { type: 'string', enum: ['USER', 'ADMIN'] }, isActive: { type: 'boolean' } } },
        },
        response: [
          {
            status: 200,
            description: 'User updated successfully',
            example: JSON.stringify({ id: 'cm7abc123', email: 'user@example.com', name: 'Updated Name', role: 'ADMIN', isActive: true, createdAt: '2026-07-04T12:00:00.000Z', updatedAt: '2026-07-04T12:00:00.000Z' }, null, 2),
          },
          {
            status: 403,
            description: 'Forbidden (non-ADMIN role)',
            example: JSON.stringify({ statusCode: 403, message: 'Forbidden resource', error: 'Forbidden' }, null, 2),
          },
          {
            status: 404,
            description: 'User not found',
            example: JSON.stringify({ statusCode: 404, message: 'User not found', error: 'Not Found' }, null, 2),
          },
        ],
      },
      {
        method: 'DELETE',
        path: '/api/v1/users/:id',
        summary: 'Delete user',
        description: 'Permanently deletes a user. ADMIN role required. Returns 204 No Content on success.',
        auth: 'required',
        tags: ['users', 'admin'],
        headers: [
          { name: 'Authorization', value: 'Bearer <access_token>', description: 'JWT access token (ADMIN role)' },
        ],
        params: [
          { name: 'id', type: 'string', required: true, description: 'User ID (CUID format)' },
        ],
        response: [
          {
            status: 204,
            description: 'User deleted successfully (no content)',
            example: null as unknown as string,
          },
          {
            status: 403,
            description: 'Forbidden (non-ADMIN role)',
            example: JSON.stringify({ statusCode: 403, message: 'Forbidden resource', error: 'Forbidden' }, null, 2),
          },
          {
            status: 404,
            description: 'User not found',
            example: JSON.stringify({ statusCode: 404, message: 'User not found', error: 'Not Found' }, null, 2),
          },
        ],
      },
      {
        method: 'PATCH',
        path: '/api/v1/users/:id/active',
        summary: 'Toggle user active status',
        description: 'Toggles a user\'s active status (activate/deactivate). ADMIN role required.',
        auth: 'required',
        tags: ['users', 'admin'],
        headers: [
          { name: 'Authorization', value: 'Bearer <access_token>', description: 'JWT access token (ADMIN role)' },
        ],
        params: [
          { name: 'id', type: 'string', required: true, description: 'User ID (CUID format)' },
        ],
        response: [
          {
            status: 200,
            description: 'Active status toggled',
            example: JSON.stringify({ id: 'cm7abc123', isActive: false }, null, 2),
          },
          {
            status: 403,
            description: 'Forbidden (non-ADMIN role)',
            example: JSON.stringify({ statusCode: 403, message: 'Forbidden resource', error: 'Forbidden' }, null, 2),
          },
          {
            status: 404,
            description: 'User not found',
            example: JSON.stringify({ statusCode: 404, message: 'User not found', error: 'Not Found' }, null, 2),
          },
        ],
      },
    ],
  },
  {
    name: 'Activity Log',
    description: 'System activity tracking and audit logging (admin-only)',
    icon: 'ClipboardList',
    endpoints: [
      {
        method: 'GET',
        path: '/api/v1/activity-log',
        summary: 'Get all activity logs',
        description: 'Returns a paginated, filterable list of all activity log entries. ADMIN role required. Supports multiple filter criteria.',
        auth: 'required',
        tags: ['activity-log', 'admin', 'audit'],
        headers: [
          { name: 'Authorization', value: 'Bearer <access_token>', description: 'JWT access token (ADMIN role)' },
        ],
        queryParams: [
          { name: 'page', type: 'integer', required: false, description: 'Page number (default: 1)' },
          { name: 'limit', type: 'integer', required: false, description: 'Items per page (default: 20)' },
          { name: 'type', type: 'string', required: false, description: 'Filter by activity type (LOGIN, LOGOUT, LOGIN_FAILED, PAYMENT_CREATED, USER_CREATED, etc.)' },
          { name: 'severity', type: 'string', required: false, description: 'Filter by severity (INFO, WARNING, ERROR, CRITICAL)' },
          { name: 'userId', type: 'string', required: false, description: 'Filter by user ID' },
          { name: 'dateFrom', type: 'string', required: false, description: 'Filter from date (ISO 8601)' },
          { name: 'dateTo', type: 'string', required: false, description: 'Filter to date (ISO 8601)' },
          { name: 'search', type: 'string', required: false, description: 'Search in action, description, or resource fields' },
        ],
        response: [
          {
            status: 200,
            description: 'Paginated activity log list',
            example: JSON.stringify({ activities: [{ id: 'log001', userId: 'cm7abc123', type: 'LOGIN', severity: 'INFO', action: 'USER_LOGIN', resource: '/api/v1/auth/login', description: 'User logged in', ipAddress: '192.168.1.1', createdAt: '2026-07-04T12:00:00.000Z' }], total: 1 }, null, 2),
          },
          {
            status: 403,
            description: 'Forbidden (non-ADMIN role)',
            example: JSON.stringify({ statusCode: 403, message: 'Forbidden resource', error: 'Forbidden' }, null, 2),
          },
        ],
      },
      {
        method: 'GET',
        path: '/api/v1/activity-log/:id',
        summary: 'Get activity log by ID',
        description: 'Returns a single activity log entry by ID. ADMIN role required.',
        auth: 'required',
        tags: ['activity-log', 'admin', 'audit'],
        headers: [
          { name: 'Authorization', value: 'Bearer <access_token>', description: 'JWT access token (ADMIN role)' },
        ],
        params: [
          { name: 'id', type: 'string', required: true, description: 'Activity log ID' },
        ],
        response: [
          {
            status: 200,
            description: 'Activity log entry',
            example: JSON.stringify({ id: 'log001', userId: 'cm7abc123', type: 'LOGIN', severity: 'INFO', action: 'USER_LOGIN', resource: '/api/v1/auth/login', description: 'User logged in', ipAddress: '192.168.1.1', createdAt: '2026-07-04T12:00:00.000Z' }, null, 2),
          },
          {
            status: 404,
            description: 'Activity log not found',
            example: JSON.stringify({ statusCode: 404, message: 'Activity log not found', error: 'Not Found' }, null, 2),
          },
        ],
      },
      {
        method: 'GET',
        path: '/api/v1/activity-log/user/:userId',
        summary: 'Get activities for a specific user',
        description: 'Returns paginated activity logs filtered by user ID. ADMIN role required.',
        auth: 'required',
        tags: ['activity-log', 'admin', 'audit'],
        headers: [
          { name: 'Authorization', value: 'Bearer <access_token>', description: 'JWT access token (ADMIN role)' },
        ],
        params: [
          { name: 'userId', type: 'string', required: true, description: 'User ID to filter activities for' },
        ],
        queryParams: [
          { name: 'page', type: 'integer', required: false, description: 'Page number (default: 1)' },
          { name: 'limit', type: 'integer', required: false, description: 'Items per page (default: 20)' },
          { name: 'type', type: 'string', required: false, description: 'Filter by activity type' },
          { name: 'severity', type: 'string', required: false, description: 'Filter by severity' },
          { name: 'dateFrom', type: 'string', required: false, description: 'Filter from date' },
          { name: 'dateTo', type: 'string', required: false, description: 'Filter to date' },
          { name: 'search', type: 'string', required: false, description: 'Search in description' },
        ],
        response: [
          {
            status: 200,
            description: 'User activities',
            example: JSON.stringify({ activities: [{ id: 'log001', userId: 'cm7abc123', type: 'LOGIN', severity: 'INFO', action: 'USER_LOGIN', resource: '/api/v1/auth/login', description: 'User logged in', ipAddress: '192.168.1.1', createdAt: '2026-07-04T12:00:00.000Z' }], total: 1 }, null, 2),
          },
        ],
      },
      {
        method: 'GET',
        path: '/api/v1/activity-log/stats',
        summary: 'Get activity statistics',
        description: 'Returns aggregated statistics of activity logs grouped by type, severity, and user. ADMIN role required.',
        auth: 'required',
        tags: ['activity-log', 'admin', 'stats'],
        headers: [
          { name: 'Authorization', value: 'Bearer <access_token>', description: 'JWT access token (ADMIN role)' },
        ],
        queryParams: [
          { name: 'dateFrom', type: 'string', required: false, description: 'Filter from date (ISO 8601)' },
          { name: 'dateTo', type: 'string', required: false, description: 'Filter to date (ISO 8601)' },
        ],
        response: [
          {
            status: 200,
            description: 'Activity statistics',
            example: JSON.stringify({ byType: { LOGIN: 45, USER_CREATED: 3, PAYMENT_COMPLETED: 12 }, bySeverity: { INFO: 100, WARNING: 5, ERROR: 2 }, byUser: { 'cm7abc123': 30, 'cm7def456': 15 }, total: 150 }, null, 2),
          },
        ],
      },
      {
        method: 'GET',
        path: '/api/v1/activity-log/critical',
        summary: 'Get critical/error activities',
        description: 'Returns the most recent critical and error-level activity entries. ADMIN role required.',
        auth: 'required',
        tags: ['activity-log', 'admin', 'monitoring'],
        headers: [
          { name: 'Authorization', value: 'Bearer <access_token>', description: 'JWT access token (ADMIN role)' },
        ],
        queryParams: [
          { name: 'limit', type: 'integer', required: false, description: 'Number of entries to return (default: 20)' },
        ],
        response: [
          {
            status: 200,
            description: 'Critical activity entries',
            example: JSON.stringify([{ id: 'log002', userId: 'cm7abc123', type: 'LOGIN_FAILED', severity: 'ERROR', action: 'LOGIN_FAILED', resource: '/api/v1/auth/login', description: 'Failed login attempt', ipAddress: '192.168.1.100', createdAt: '2026-07-04T12:00:00.000Z' }], null, 2),
          },
        ],
      },
      {
        method: 'POST',
        path: '/api/v1/activity-log/export',
        summary: 'Export activities to CSV/JSON',
        description: 'Exports activity log entries in CSV or JSON format. Returns the file as a downloadable attachment. ADMIN role required.',
        auth: 'required',
        tags: ['activity-log', 'admin', 'export'],
        headers: [
          { name: 'Authorization', value: 'Bearer <access_token>', description: 'JWT access token (ADMIN role)' },
          { name: 'Content-Type', value: 'application/json', description: 'Request body format' },
        ],
        body: {
          contentType: 'application/json',
          example: JSON.stringify({ format: 'csv', type: 'LOGIN', severity: 'ERROR', dateFrom: '2026-07-01', dateTo: '2026-07-04' }, null, 2),
          schema: { type: 'object', properties: { format: { type: 'string', enum: ['csv', 'json'] }, type: { type: 'string' }, severity: { type: 'string', enum: ['INFO', 'WARNING', 'ERROR', 'CRITICAL'] }, userId: { type: 'string' }, dateFrom: { type: 'string' }, dateTo: { type: 'string' }, search: { type: 'string' } } },
        },
        response: [
          {
            status: 200,
            description: 'CSV file download',
            example: 'id,userId,userEmail,type,severity,action,resource,description,ipAddress,createdAt\n"log001","cm7abc123","user@example.com","LOGIN","INFO","USER_LOGIN","/api/v1/auth/login","User logged in","192.168.1.1","2026-07-04T12:00:00.000Z"',
          },
          {
            status: 200,
            description: 'JSON file download',
            example: JSON.stringify([{ id: 'log001', userId: 'cm7abc123', type: 'LOGIN', severity: 'INFO', action: 'USER_LOGIN' }], null, 2),
          },
        ],
      },
    ],
  },
  {
    name: 'Ops',
    description: 'Operations dashboard with system health and incident management',
    icon: 'Gauge',
    endpoints: [
      {
        method: 'GET',
        path: '/api/v1/ops',
        summary: 'Get operations dashboard data',
        description: 'Returns a comprehensive operations dashboard with metrics, health status, queue status, container status, and incident information. ADMIN role required.',
        auth: 'required',
        tags: ['ops', 'dashboard', 'admin', 'monitoring'],
        headers: [
          { name: 'Authorization', value: 'Bearer <access_token>', description: 'JWT access token (ADMIN role)' },
        ],
        response: [
          {
            status: 200,
            description: 'Operations dashboard data',
            example: JSON.stringify({
              activeIncidents: [],
              recentErrors: [],
              groupedErrors: [],
              rootCauseAnalysis: [],
              suggestedFixes: [],
              metrics: { uptime: 3600, requestsPerMinute: 150, errorRate: 0.5, avgResponseTime: 45, p95ResponseTime: 120, p99ResponseTime: 300 },
              healthStatus: { status: 'healthy', checks: {} },
              containersStatus: [],
              queueStatus: [],
              redisStatus: { status: 'up', latency: 2, connections: 5 },
              postgresStatus: { status: 'up', latency: 3, connections: 3 },
            }, null, 2),
          },
          {
            status: 403,
            description: 'Forbidden (non-ADMIN role)',
            example: JSON.stringify({ statusCode: 403, message: 'Forbidden resource', error: 'Forbidden' }, null, 2),
          },
        ],
      },
    ],
  },
  {
    name: 'Metrics',
    description: 'Prometheus metrics endpoint for monitoring and observability',
    icon: 'BarChart3',
    endpoints: [
      {
        method: 'GET',
        path: '/api/v1/metrics',
        summary: 'Prometheus metrics',
        description: 'Returns Prometheus-formatted metrics for monitoring and observability. Protected by API key or IP whitelist. Default metrics include CPU, memory, event loop lag, and HTTP request statistics.',
        auth: 'none',
        tags: ['metrics', 'monitoring', 'observability'],
        headers: [
          { name: 'X-Metrics-API-Key', value: '<api_key>', description: 'Metrics API key (if configured)' },
        ],
        response: [
          {
            status: 200,
            description: 'Prometheus metrics (text/plain)',
            example: '# HELP process_cpu_user_seconds_total Total user CPU time spent in seconds.\n# TYPE process_cpu_user_seconds_total counter\nprocess_cpu_user_seconds_total 123.45\n# HELP http_requests_total Total HTTP requests\n# TYPE http_requests_total counter\nhttp_requests_total{method="GET",route="/api/v1/health"} 42',
          },
          {
            status: 403,
            description: 'Forbidden (invalid API key or IP)',
            example: JSON.stringify({ error: 'Forbidden', message: 'Access to metrics requires a valid API key or allowed IP address' }, null, 2),
          },
        ],
      },
    ],
  },
  {
    name: 'Microservices',
    description: 'Independent microservices for auth, payments, invoices, notifications, and more',
    icon: 'Box',
    endpoints: [
      {
        method: 'POST',
        path: '/api/auth/verify',
        summary: 'Verify JWT token',
        description: 'Microservice: auth-service (:3001). Verifies a JWT token and returns the decoded payload. The monolith AuthModule delegates token verification to this service for distributed token validation.',
        auth: 'none',
        tags: ['microservices', 'auth'],
        headers: [
          { name: 'Content-Type', value: 'application/json', description: 'Request body format' },
        ],
        body: {
          contentType: 'application/json',
          example: JSON.stringify({ token: 'eyJhbGciOiJIUzI1NiIs...' }, null, 2),
          schema: { type: 'object', properties: { token: { type: 'string' } }, required: ['token'] },
        },
        response: [
          {
            status: 200,
            description: 'Token verified successfully',
            example: JSON.stringify({ valid: true, payload: { sub: 'cm7abc123', email: 'user@example.com', role: 'USER', iat: 1720080000, exp: 1720080900 } }, null, 2),
          },
          {
            status: 401,
            description: 'Invalid or expired token',
            example: JSON.stringify({ valid: false, error: 'Token expired' }, null, 2),
          },
        ],
      },
      {
        method: 'GET',
        path: '/api/auth/permissions',
        summary: 'Get user permissions',
        description: 'Microservice: auth-service (:3001). Returns the permission set for the authenticated user based on their role.',
        auth: 'required',
        tags: ['microservices', 'auth'],
        headers: [
          { name: 'Authorization', value: 'Bearer <access_token>', description: 'JWT access token' },
        ],
        response: [
          {
            status: 200,
            description: 'Permissions retrieved',
            example: JSON.stringify({ userId: 'cm7abc123', role: 'ADMIN', permissions: ['users:read', 'users:write', 'activity:read', 'ops:read', 'metrics:read'] }, null, 2),
          },
        ],
      },
      {
        method: 'POST',
        path: '/api/payments',
        summary: 'Create payment intent',
        description: 'Microservice: payment-service (:3003). Creates a Stripe payment intent for processing a payment. Returns the client secret for frontend confirmation.',
        auth: 'required',
        tags: ['microservices', 'payments'],
        headers: [
          { name: 'Authorization', value: 'Bearer <access_token>', description: 'JWT access token' },
          { name: 'Content-Type', value: 'application/json', description: 'Request body format' },
        ],
        body: {
          contentType: 'application/json',
          example: JSON.stringify({ amount: 5000, currency: 'usd', metadata: { userId: 'cm7abc123' } }, null, 2),
          schema: { type: 'object', properties: { amount: { type: 'integer', minimum: 50 }, currency: { type: 'string', default: 'usd' }, metadata: { type: 'object' } }, required: ['amount'] },
        },
        response: [
          {
            status: 201,
            description: 'Payment intent created',
            example: JSON.stringify({ id: 'pi_abc123', clientSecret: 'pi_abc123_secret_xyz', amount: 5000, currency: 'usd', status: 'requires_confirmation' }, null, 2),
          },
        ],
      },
      {
        method: 'POST',
        path: '/api/payments/:id/refund',
        summary: 'Process payment refund',
        description: 'Microservice: payment-service (:3003). Processes a full or partial refund for an existing payment via the Stripe API.',
        auth: 'required',
        tags: ['microservices', 'payments'],
        headers: [
          { name: 'Authorization', value: 'Bearer <access_token>', description: 'JWT access token' },
          { name: 'Content-Type', value: 'application/json', description: 'Request body format' },
        ],
        params: [
          { name: 'id', type: 'string', required: true, description: 'Payment ID (Stripe payment intent ID)' },
        ],
        body: {
          contentType: 'application/json',
          example: JSON.stringify({ amount: 2500 }, null, 2),
          schema: { type: 'object', properties: { amount: { type: 'integer', description: 'Partial refund amount. Omit for full refund.' } } },
        },
        response: [
          {
            status: 200,
            description: 'Refund processed',
            example: JSON.stringify({ id: 'pi_abc123', refundId: 're_xyz', amount: 2500, status: 'refunded' }, null, 2),
          },
        ],
      },
      {
        method: 'POST',
        path: '/api/payments/webhook',
        summary: 'Stripe webhook handler',
        description: 'Microservice: payment-service (:3003). Handles incoming Stripe webhook events (payment_intent.succeeded, payment_intent.payment_failed, etc.). Must be publicly accessible.',
        auth: 'none',
        tags: ['microservices', 'payments', 'webhooks'],
        headers: [
          { name: 'Content-Type', value: 'application/json', description: 'Webhook payload' },
          { name: 'Stripe-Signature', value: '<stripe_signature>', description: 'Stripe webhook signature for verification' },
        ],
        response: [
          {
            status: 200,
            description: 'Webhook received and processed',
            example: JSON.stringify({ received: true }, null, 2),
          },
          {
            status: 400,
            description: 'Invalid webhook signature',
            example: JSON.stringify({ error: 'Invalid signature' }, null, 2),
          },
        ],
      },
      {
        method: 'POST',
        path: '/api/invoices/from-payment/:paymentId',
        summary: 'Generate invoice from payment',
        description: 'Microservice: invoice-service (:3004). Generates a PDF invoice and receipt for a completed payment. Triggered automatically via BullMQ after payment completion.',
        auth: 'required',
        tags: ['microservices', 'invoices'],
        headers: [
          { name: 'Authorization', value: 'Bearer <access_token>', description: 'JWT access token' },
          { name: 'Content-Type', value: 'application/json', description: 'Request body format' },
        ],
        params: [
          { name: 'paymentId', type: 'string', required: true, description: 'Payment ID to generate invoice for' },
        ],
        response: [
          {
            status: 201,
            description: 'Invoice generated',
            example: JSON.stringify({ id: 'inv_001', invoiceNumber: 'INV-2026-0001', amount: 5000, tax: 500, total: 5500, status: 'SENT', pdfUrl: '/api/invoices/inv_001/pdf' }, null, 2),
          },
        ],
      },
    ],
  },
];

export function findEndpoint(path: string, method: string): EndpointDoc | undefined {
  for (const group of endpointGroups) {
    for (const ep of group.endpoints) {
      if (ep.path === path && ep.method === method) {
        return ep;
      }
      const paramPath = ep.path.replace(/:(\w+)/g, ':$1');
      const inputSegments = path.split('/');
      const epSegments = paramPath.split('/');
      if (
        inputSegments.length === epSegments.length &&
        ep.method === method &&
        inputSegments.every((seg, i) => epSegments[i] === seg || epSegments[i].startsWith(':'))
      ) {
        return ep;
      }
    }
  }
  return undefined;
}
