// Simple reactive store — replaces Zustand

type Listener = () => void;

interface StoreState {
  // Request panel
  method: string;
  url: string;
  headers: { key: string; value: string }[];
  params: { key: string; value: string }[];
  body: string;
  bodyType: string;
  authToken: string | null;

  // Response
  response: ResponseData | null;
  isLoading: boolean;
  error: string | null;

  // UI
  activeTab: string;
  sidebarOpen: boolean;
  selectedEndpoint: string;
  requestSubTab: string;
  responseSubTab: string;

  // Backend connection
  backendUrl: string;
  backendConnected: boolean;
  connectionChecking: boolean;

  // Logs
  logs: LogEntry[];
  logsConnected: boolean;

  // Tests
  tests: TestCase[];
  testResults: TestResult[];
  testRunning: boolean;
  testStatus: 'idle' | 'running' | 'completed';
}

interface ResponseData {
  status: number;
  statusText: string;
  body: string;
  headers: Record<string, string>;
  time: number;
  size: string;
}

interface LogEntry {
  id: number;
  timestamp: string;
  level: string;
  message: string;
  service: string;
}

export interface TestCase {
  id: string;
  name: string;
  method: string;
  path: string;
  headers?: { key: string; value: string }[];
  body?: string;
  bodyType?: string;
  expectedStatus: number;
  expectedBodyContains?: string[];
  description?: string;
  group?: string;
}

export interface TestResult {
  testId: string;
  passed: boolean;
  statusCode: number;
  expectedStatus: number;
  responseTime: number;
  bodyChecks: { check: string; passed: boolean }[];
  error?: string;
  responseBody?: string;
}

const DEFAULT_TESTS: TestCase[] = [
  { id: 't1', name: 'Health Check', method: 'GET', path: '/api/v1/health', expectedStatus: 200, group: 'Health' },
  { id: 't2', name: 'Liveness Probe', method: 'GET', path: '/api/v1/health/live', expectedStatus: 200, group: 'Health' },
  { id: 't3', name: 'Readiness Probe', method: 'GET', path: '/api/v1/health/ready', expectedStatus: 200, group: 'Health' },
  { id: 't4', name: 'Register User', method: 'POST', path: '/api/v1/auth/register', expectedStatus: 201, body: JSON.stringify({ email: 'test@test.com', password: 'TestPass123', name: 'Test User' }), bodyType: 'json', expectedBodyContains: ['accessToken'], group: 'Auth' },
  { id: 't5', name: 'Login User', method: 'POST', path: '/api/v1/auth/login', expectedStatus: 200, body: JSON.stringify({ email: 'test@test.com', password: 'TestPass123' }), bodyType: 'json', expectedBodyContains: ['accessToken'], group: 'Auth' },
  { id: 't6', name: 'Get Profile (Unauthenticated)', method: 'GET', path: '/api/v1/auth/profile', expectedStatus: 401, group: 'Auth' },
  { id: 't7', name: 'Metrics (No Key)', method: 'GET', path: '/api/v1/metrics', expectedStatus: 403, group: 'Metrics' },
  { id: 't8', name: 'Ops Dashboard (Unauthenticated)', method: 'GET', path: '/api/v1/ops', expectedStatus: 401, group: 'Ops' },
  { id: 't9', name: 'Get Users (Unauthenticated)', method: 'GET', path: '/api/v1/users', expectedStatus: 401, group: 'Users' },
  { id: 't10', name: 'Get Activity Log (Unauthenticated)', method: 'GET', path: '/api/v1/activity-log', expectedStatus: 401, group: 'Activity Log' },
];

class Store {
  private state: StoreState;
  private listeners: Map<string, Set<Listener>> = new Map();

  constructor(initial: Partial<StoreState> = {}) {
    this.state = {
      method: 'GET',
      url: '',
      headers: [],
      params: [],
      body: '{}',
      bodyType: 'none',
      authToken: null,
      response: null,
      isLoading: false,
      error: null,
      activeTab: 'request',
      sidebarOpen: true,
      selectedEndpoint: '',
      requestSubTab: 'params',
      responseSubTab: 'body',
      backendUrl: '',
      backendConnected: false,
      connectionChecking: false,
      logs: [],
      logsConnected: false,
      tests: DEFAULT_TESTS,
      testResults: [],
      testRunning: false,
      testStatus: 'idle',
      ...initial,
    };
  }

  get<K extends keyof StoreState>(key: K): StoreState[K] {
    return this.state[key];
  }

  set(partial: Partial<StoreState>): void {
    const keys = Object.keys(partial) as (keyof StoreState)[];
    for (const key of keys) {
      if (partial[key] !== undefined) {
        (this.state as any)[key] = partial[key];
        this.notify(key);
      }
    }
  }

  subscribe(key: keyof StoreState, listener: Listener): () => void {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    this.listeners.get(key)!.add(listener);
    return () => this.listeners.get(key)?.delete(listener);
  }

  private notify(key: keyof StoreState): void {
    this.listeners.get(key)?.forEach((fn) => fn());
  }

  getBaseUrl(): string {
    return this.state.backendUrl || window.location.origin;
  }

  formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / 1048576).toFixed(1)}MB`;
  }

  getMethodColor(method: string): string {
    const colors: Record<string, string> = {
      GET: '#22c55e', POST: '#3b82f6', PUT: '#f59e0b',
      PATCH: '#f59e0b', DELETE: '#ef4444', HEAD: '#8b5cf6',
      OPTIONS: '#8b5cf6',
    };
    return colors[method.toUpperCase()] || '#64748b';
  }
}

export const store = new Store();
