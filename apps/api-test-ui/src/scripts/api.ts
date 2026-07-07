import { store } from './store';

export async function sendRequest(): Promise<void> {
  const method = store.get('method');
  const rawUrl = store.get('url');
  const headers = store.get('headers');
  const params = store.get('params');
  const body = store.get('body');
  const bodyType = store.get('bodyType');
  const authToken = store.get('authToken');

  store.set({ isLoading: true, error: null });

  try {
    const baseUrl = store.getBaseUrl();
    const url = new URL(rawUrl.startsWith('http') ? rawUrl : `${baseUrl}${rawUrl}`);

    params.forEach((p) => {
      if (p.key) url.searchParams.append(p.key, p.value);
    });

    const headersObj: Record<string, string> = {};
    headers.forEach((h) => {
      if (h.key) headersObj[h.key] = h.value;
    });

    if (authToken) {
      headersObj['Authorization'] = `Bearer ${authToken}`;
    }

    const fetchOptions: RequestInit = { method, headers: headersObj };

    if (['POST', 'PATCH', 'PUT'].includes(method) && bodyType === 'json' && body) {
      fetchOptions.body = body;
    }

    const startTime = performance.now();
    const res = await fetch(url.toString(), fetchOptions);
    const endTime = performance.now();

    const time = endTime - startTime;
    const bodyText = await res.text();
    const sizeBytes = new TextEncoder().encode(bodyText).length;

    const responseHeaders: Record<string, string> = {};
    res.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    store.set({
      response: {
        status: res.status,
        statusText: res.statusText,
        body: bodyText,
        headers: responseHeaders,
        time,
        size: store.formatBytes(sizeBytes),
      },
      isLoading: false,
    });
  } catch (err) {
    store.set({
      error: err instanceof Error ? err.message : 'Unknown error',
      isLoading: false,
    });
  }
}

export async function runSingleTest(testId: string): Promise<void> {
  const tests = store.get('tests');
  const results = store.get('testResults');
  const test = tests.find((t) => t.id === testId);
  if (!test) return;

  const startTime = performance.now();
  const baseUrl = store.getBaseUrl();
  const url = test.path.startsWith('http') ? test.path : `${baseUrl}${test.path}`;

  try {
    const headersObj: Record<string, string> = {};
    if (test.headers) {
      test.headers.forEach((h) => {
        if (h.key) headersObj[h.key] = h.value;
      });
    }
    if (['POST', 'PATCH', 'PUT'].includes(test.method) && test.bodyType === 'json' && test.body) {
      if (!headersObj['Content-Type']) {
        headersObj['Content-Type'] = 'application/json';
      }
    }

    const fetchOptions: RequestInit = { method: test.method, headers: headersObj };

    if (['POST', 'PATCH', 'PUT'].includes(test.method) && test.body) {
      fetchOptions.body = test.body;
    }

    const res = await fetch(url, fetchOptions);
    const endTime = performance.now();
    const responseTime = endTime - startTime;
    const bodyText = await res.text();

    const statusCode = res.status;
    const statusPassed = statusCode === test.expectedStatus;

    const bodyChecks: { check: string; passed: boolean }[] = [];
    if (test.expectedBodyContains) {
      test.expectedBodyContains.forEach((check) => {
        bodyChecks.push({ check, passed: bodyText.includes(check) });
      });
    }

    const passed = statusPassed && bodyChecks.every((c) => c.passed);

    const result = {
      testId: test.id,
      passed,
      statusCode,
      expectedStatus: test.expectedStatus,
      responseTime,
      bodyChecks,
      responseBody: bodyText,
    };

    store.set({
      testResults: [...results.filter((r) => r.testId !== test.id), result],
    });
  } catch (err) {
    const endTime = performance.now();
    store.set({
      testResults: [
        ...results.filter((r) => r.testId !== test.id),
        {
          testId: test.id,
          passed: false,
          statusCode: 0,
          expectedStatus: test.expectedStatus,
          responseTime: endTime - startTime,
          bodyChecks: [],
          error: err instanceof Error ? err.message : 'Network error',
        },
      ],
    });
  }
}

export async function runAllTests(): Promise<void> {
  const tests = store.get('tests');
  store.set({ testRunning: true, testStatus: 'running', testResults: [] });

  for (const test of tests) {
    await runSingleTest(test.id);
  }

  store.set({ testRunning: false, testStatus: 'completed' });
}

export async function checkBackendConnection(): Promise<void> {
  store.set({ connectionChecking: true });
  const baseUrl = store.getBaseUrl();

  try {
    const res = await fetch(`${baseUrl}/api/v1/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    });
    store.set({ backendConnected: res.ok, connectionChecking: false });
  } catch {
    store.set({ backendConnected: false, connectionChecking: false });
  }
}
