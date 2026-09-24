import http from 'k6/http';
import { check, sleep } from 'k6';

const BACKENDS = (__ENV.VITE_BACKENDS || '')
    .split(',')
    .map((b) => b.trim())
    .filter(Boolean);

const TARGET_PATH = __ENV.TARGET_PATH || '/';
const DURATION = __ENV.DURATION || '30s';
const VUS = Number(__ENV.VUS || 1000);
const THRESHOLD = Number(__ENV.THRESHOLD || 2000);

if (BACKENDS.length === 0) {
    throw new Error('VITE_BACKENDS is empty. Example: VITE_BACKENDS=https://a.onrender.com,https://b.onrender.com k6 run script.js');
}

const backendIndex = (__VU - 1) % BACKENDS.length;
const selectedBackend = BACKENDS[backendIndex];

export const options = {
    scenarios: {
        concurrent_load: {
            executor: 'constant-vus',
            vus: VUS,
            duration: DURATION,
            exec: 'stressBackendSelection'
        }
    },
    thresholds: {
        http_req_duration: [`p(95)<${THRESHOLD}`],
        http_req_failed: ['rate<0.05'],
    }
};

export function stressBackendSelection() {
    const backendUrl = BACKENDS[__VU % BACKENDS.length];
    const url = `${backendUrl}${TARGET_PATH}`;

    const res = http.get(url, {
        headers: {
            'Content-Type': 'application/json',
            'X-Load-Test': 'true',
            'X-Request-Id': `${__VU}-${__ITER}`
        },
        redirects: 0,
        timeout: '10s'
    });

    const isHealthy = check(res, {
        'status is 200 or 204': (r) => r.status === 200 || r.status === 204,
        'has expected payload': (r) => {
            const body = r.body && r.body.length ? r.body.toString() : '';
            return body.includes('ok') || body.includes('healthy') || body.includes('ready') || body.includes('status');
        }
    });

    if (!isHealthy) {
        console.log(`FAIL backend=${backendUrl} status=${res.status} body=${res.body}`);
    } else {
        console.log(`OK backend=${backendUrl} status=${res.status}`);
    }

    sleep(0.1);
}

export default function () {
    stressBackendSelection();
}
