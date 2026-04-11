import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';
import { getBaseUrl, jsonHeaders, login } from './lib/helpers.js';

const errorRate = new Rate('error_rate');
const endpointDuration = new Trend('spike_incident_listing_duration');

export const options = {
  scenarios: {
    spike: {
      executor: 'ramping-arrival-rate',
      startRate: Number(__ENV.START_RATE || 1),
      timeUnit: '1s',
      preAllocatedVUs: Number(__ENV.PRE_ALLOCATED_VUS || 20),
      maxVUs: Number(__ENV.MAX_VUS || 100),
      stages: [
        { target: Number(__ENV.STAGE_ONE_RATE || 1), duration: '10s' },
        { target: Number(__ENV.STAGE_TWO_RATE || 10), duration: '20s' },
        { target: Number(__ENV.STAGE_THREE_RATE || 10), duration: '10s' },
        { target: Number(__ENV.STAGE_FOUR_RATE || 1), duration: '10s' },
      ],
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
    'spike request returns 200': (res) => res.status === 200,
  });

  sleep(0.1);
}
