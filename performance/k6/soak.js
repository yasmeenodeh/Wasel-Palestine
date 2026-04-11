import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';
import { getBaseUrl, jsonHeaders, login } from './lib/helpers.js';

const errorRate = new Rate('error_rate');
const endpointDuration = new Trend('soak_incident_listing_duration');

export const options = {
  scenarios: {
    soak: {
      executor: 'constant-arrival-rate',
      rate: Number(__ENV.SCENARIO_RATE || 2),
      timeUnit: '1s',
      duration: __ENV.SCENARIO_DURATION || '3m',
      preAllocatedVUs: Number(__ENV.PRE_ALLOCATED_VUS || 15),
      maxVUs: Number(__ENV.MAX_VUS || 40),
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
    'soak request returns 200': (res) => res.status === 200,
  });

  sleep(0.4);
}
