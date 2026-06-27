import http from 'k6/http';
import { check, sleep, group } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 10 },
    { duration: '1m', target: 30 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<800', 'p(99)<1500'],
    http_req_failed: ['rate<0.02'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000/api/v1';

export default function () {
  const email = `loadtest-${__VU}-${Date.now()}@example.com`;
  const password = 'TestPass123!';

  group('register', () => {
    const res = http.post(`${BASE_URL}/auth/register`, JSON.stringify({
      email, password, name: `Load Test User ${__VU}`,
    }), { headers: { 'Content-Type': 'application/json' } });
    check(res, {
      'register status is 201': (r) => r.status === 201,
      'register returns tokens': (r) => JSON.parse(r.body).tokens !== undefined,
    });
  });

  group('login', () => {
    const res = http.post(`${BASE_URL}/auth/login`, JSON.stringify({
      email, password,
    }), { headers: { 'Content-Type': 'application/json' } });
    check(res, {
      'login status is 200': (r) => r.status === 200,
      'login returns tokens': (r) => JSON.parse(r.body).tokens !== undefined,
    });
  });

  sleep(1);
}
