import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';
import { getBaseUrl, jsonHeaders, login } from './lib/helpers.js';

const errorRate = new Rate('error_rate');
const endpointDuration = new Trend('incident_listing_duration');

export const options = {
  scenarios: {
    read_heavy: {
      executor: 'constant-arrival-rate',
      rate: Number(__ENV.SCENARIO_RATE || 4),
      timeUnit: '1s',
      duration: __ENV.SCENARIO_DURATION || '1m',
      preAllocatedVUs: Number(__ENV.PRE_ALLOCATED_VUS || 20),
      maxVUs: Number(__ENV.MAX_VUS || 50),
    },
  },
};

export function setup() {
  return {
    accessToken: login('amal_admin').tokens.accessToken,
  };
}

export default function (data) {
  const response = http.get(
    `${getBaseUrl()}/api/v1/incidents?page=1&limit=20&sortBy=updatedAt&sortOrder=DESC`,
    jsonHeaders(data.accessToken),
  );

  endpointDuration.add(response.timings.duration);
  errorRate.add(response.status !== 200);

  check(response, {
    'incident listing returns 200': (res) => res.status === 200,
    'incident listing returns data': (res) => Array.isArray(res.json('data')),
  });

  sleep(0.2);
}
