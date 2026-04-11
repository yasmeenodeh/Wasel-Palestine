import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';
import {
  buildReportPayload,
  ensureCitizenPool,
  getBaseUrl,
  jsonHeaders,
  login,
  pickUser,
} from './lib/helpers.js';

const errorRate = new Rate('error_rate');
const readDuration = new Trend('mixed_read_duration');
const writeDuration = new Trend('mixed_write_duration');

export const options = {
  scenarios: {
    mixed: {
      executor: 'constant-arrival-rate',
      rate: Number(__ENV.SCENARIO_RATE || 3),
      timeUnit: '1s',
      duration: __ENV.SCENARIO_DURATION || '1m',
      preAllocatedVUs: Number(__ENV.PRE_ALLOCATED_VUS || 20),
      maxVUs: Number(__ENV.MAX_VUS || 50),
    },
  },
};

export function setup() {
  return {
    adminToken: login('amal_admin').tokens.accessToken,
    users: ensureCitizenPool(__ENV.USER_PREFIX || 'k6_mixed_user', Number(__ENV.USER_COUNT || 25)),
  };
}

export default function (data) {
  const branch = __ITER % 4;
  let response;

  if (branch === 0) {
    response = http.get(
      `${getBaseUrl()}/api/v1/incidents?page=1&limit=20&sortBy=updatedAt&sortOrder=DESC`,
      jsonHeaders(data.adminToken),
    );
    readDuration.add(response.timings.duration);
  } else if (branch === 1) {
    response = http.get(
      `${getBaseUrl()}/api/v1/reports?page=1&limit=20&sortBy=reportedAt&sortOrder=DESC`,
      jsonHeaders(data.adminToken),
    );
    readDuration.add(response.timings.duration);
  } else if (branch === 2) {
    response = http.get(
      `${getBaseUrl()}/api/v1/route-estimation?page=1&limit=10`,
      jsonHeaders(data.adminToken),
    );
    readDuration.add(response.timings.duration);
  } else {
    const user = pickUser(data.users);
    const categoryId = ((__ITER + 1) % 4) + 1;
    const payload = buildReportPayload('Mixed workload test', categoryId);
    response = http.post(`${getBaseUrl()}/api/v1/reports`, JSON.stringify(payload), jsonHeaders(user.token));
    writeDuration.add(response.timings.duration);
  }

  errorRate.add(response.status >= 400);

  check(response, {
    'mixed request succeeded': (res) => res.status < 400,
  });

  sleep(0.2);
}
