import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate } from 'k6/metrics';

const dashboardLatency = new Trend('dashboard_api_duration', true);
const trackingLatency = new Trend('tracking_api_duration', true);
const apiErrors = new Rate('api_errors');
const baseUrl = (__ENV.BASE_URL || 'https://staging.example.com').replace(/\/$/, '');
const users = Number(__ENV.VUS || 1);

export const options = {
  scenarios: {
    controlled_staging: {
      executor: 'constant-vus',
      vus: users,
      duration: __ENV.DURATION || '15m',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<1500'],
    dashboard_api_duration: ['p(95)<1200'],
    tracking_api_duration: ['p(95)<1500'],
    api_errors: ['rate<0.01'],
  },
};

export function setup() {
  const email = __ENV.TEST_EMAIL;
  const password = __ENV.TEST_PASSWORD;
  if (!email || !password) {
    throw new Error('TEST_EMAIL e TEST_PASSWORD devem identificar uma conta sintética exclusiva de carga.');
  }
  const response = http.post(`${baseUrl}/api/v1/auth/login`, JSON.stringify({ email, password }), {
    headers: { 'Content-Type': 'application/json' },
    tags: { endpoint: 'login' },
  });
  check(response, { 'login 200': (r) => r.status === 200, 'token presente': (r) => Boolean(r.json('accessToken')) });
  return { token: response.json('accessToken') };
}

export default function ({ token }) {
  const headers = { Authorization: `Bearer ${token}` };
  const dashboard = http.get(`${baseUrl}/api/v1/dashboard/summary`, { headers, tags: { endpoint: 'dashboard' } });
  dashboardLatency.add(dashboard.timings.duration);
  apiErrors.add(dashboard.status !== 200);
  check(dashboard, { 'dashboard 200': (r) => r.status === 200 });

  const tracking = http.get(`${baseUrl}/api/v1/tracking/vehicles?limit=100`, { headers, tags: { endpoint: 'tracking' } });
  trackingLatency.add(tracking.timings.duration);
  apiErrors.add(tracking.status !== 200);
  check(tracking, { 'tracking 200': (r) => r.status === 200 });
  sleep(2);
}
