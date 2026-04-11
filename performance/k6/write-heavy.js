import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';
import { buildReportPayload, ensureCitizenPool, getBaseUrl, jsonHeaders, pickUser } from './lib/helpers.js';

const errorRate = new Rate('error_rate');
const endpointDuration = new Trend('report_submission_duration');

export const options = {
  scenarios: {
    write_heavy: {
      executor: 'constant-arrival-rate',
      rate: Number(__ENV.SCENARIO_RATE || 2),
      timeUnit: '1s',
      duration: __ENV.SCENARIO_DURATION || '1m',
      preAllocatedVUs: Number(__ENV.PRE_ALLOCATED_VUS || 20),
      maxVUs: Number(__ENV.MAX_VUS || 50),
    },
  },
};

export function setup() {
  return {
    users: ensureCitizenPool(__ENV.USER_PREFIX || 'k6_write_user', Number(__ENV.USER_COUNT || 25)),
  };
}

export default function (data) {
  const user = pickUser(data.users);
  const categoryId = (__ITER % 4) + 1;
  const payload = buildReportPayload('Write-heavy test', categoryId);
  const response = http.post(
    `${getBaseUrl()}/api/v1/reports`,
    JSON.stringify(payload),
    jsonHeaders(user.token),
  );

  endpointDuration.add(response.timings.duration);
  errorRate.add(response.status !== 201 && response.status !== 200);

  check(response, {
    'report submission accepted': (res) => res.status === 201 || res.status === 200,
    'report response contains id': (res) => !!res.json('id'),
  });

  sleep(0.3);
}
