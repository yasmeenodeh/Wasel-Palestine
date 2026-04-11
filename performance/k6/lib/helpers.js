import http from 'k6/http';
import { check } from 'k6';

const baseUrl = __ENV.BASE_URL || 'http://localhost:3000';
const password = __ENV.K6_PASSWORD || 'WaselPass123';

export function getBaseUrl() {
  return baseUrl;
}

export function getPassword() {
  return password;
}

export function jsonHeaders(token) {
  const headers = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return { headers };
}

export function login(identifier, inputPassword = password) {
  const response = http.post(
    `${baseUrl}/api/v1/auth/login`,
    JSON.stringify({
      identifier,
      password: inputPassword,
    }),
    jsonHeaders(),
  );

  check(response, {
    'login succeeded': (res) => res.status === 201 || res.status === 200,
  });

  if (response.status !== 201 && response.status !== 200) {
    throw new Error(`Unable to login with identifier ${identifier}: ${response.status} ${response.body}`);
  }

  return response.json();
}

export function ensureCitizenPool(prefix, count) {
  const tokens = [];
  const users = [];

  for (let index = 1; index <= count; index += 1) {
    const username = `${prefix}_${String(index).padStart(3, '0')}`;
    const email = `${username}@wasel.ps`;
    const fullName = `Load User ${index}`;

    const registerResponse = http.post(
      `${baseUrl}/api/v1/auth/register`,
      JSON.stringify({
        fullName,
        username,
        email,
        password,
      }),
      jsonHeaders(),
    );

    if (registerResponse.status !== 201 && registerResponse.status !== 200 && registerResponse.status !== 400) {
      throw new Error(`Unable to register ${username}: ${registerResponse.status} ${registerResponse.body}`);
    }

    let authPayload;

    if (registerResponse.status === 201 || registerResponse.status === 200) {
      authPayload = registerResponse.json();
    } else {
      authPayload = login(username, password);
    }

    tokens.push(authPayload.tokens.accessToken);
    users.push({
      username,
      email,
      token: authPayload.tokens.accessToken,
      id: authPayload.user.id,
    });
  }

  return users;
}

export function buildReportPayload(seedLabel, categoryId) {
  const iterationSeed = Date.now() + __VU * 100000 + __ITER;
  const latitude = 32.1701 + ((__VU % 7) * 0.002) + ((__ITER % 11) * 0.0001);
  const longitude = 35.2862 + ((__VU % 5) * 0.002) + ((__ITER % 13) * 0.0001);

  return {
    latitude: Number(latitude.toFixed(7)),
    longitude: Number(longitude.toFixed(7)),
    categoryId,
    description: `${seedLabel} mobility disruption near Nablus and Ramallah corridor iteration ${iterationSeed}`,
    reportedAt: new Date().toISOString(),
  };
}

export function pickUser(users) {
  return users[(__VU + __ITER) % users.length];
}
