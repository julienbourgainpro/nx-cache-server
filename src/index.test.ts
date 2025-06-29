import { strict as assert } from 'node:assert';
import { app } from './index.ts';
import fs from 'node:fs';
import { test } from 'node:test';

async function makeRequest(
  method: string,
  path: string,
  headers: Record<string, string> = {},
  body?: Uint8Array,
) {
  const req = new Request(`http://localhost${path}`, {
    method,
    headers: {
      Authorization: 'Bearer test-token',
      ...headers,
    },
    body,
  });

  return await app.fetch(req, {
    NX_CACHE_ACCESS_TOKEN: 'test-token',
    AWS_REGION: 'us-east-1',
    AWS_ACCESS_KEY_ID: 'minio',
    AWS_SECRET_ACCESS_KEY: 'minio123',
    S3_BUCKET_NAME: 'nx-cloud',
    S3_ENDPOINT_URL: 'http://localhost:9000',
  });
}

test('PUT /v1/cache/{hash} - Success', async () => {
  const hash = crypto.randomUUID();

  const response = await makeRequest(
    'PUT',
    `/v1/cache/${hash}`,
    { 'Content-Type': 'application/octet-stream' },
    fs.readFileSync('./src/index.ts'),
  );
  assert.equal(response.status, 202);
  const body = await response.text();
  assert.equal(body, 'Successfully uploaded');
});

test('PUT /v1/cache/{hash} - Unauthorized', async () => {
  const hash = crypto.randomUUID();

  const response = await makeRequest(
    'PUT',
    `/v1/cache/${hash}`,
    {
      'Authorization': 'Bearer wrong-token',
      'Content-Length': '10',
    },
    fs.readFileSync('./src/index.ts'),
  );
  assert.equal(response.status, 403);
  const body = await response.text();
  assert.equal(body, 'Access forbidden');
});

test('GET /v1/cache/{hash} - Success', async () => {
  const hash = crypto.randomUUID();

  await makeRequest('PUT', `/v1/cache/${hash}`, {
    'Content-Length': '10',
  }, fs.readFileSync('./src/index.ts'));

  const response = await makeRequest('GET', `/v1/cache/${hash}`);

  assert.equal(response.status, 200);
  assert.ok(response.headers.get('content-type'));

  const body = await response.text();
  assert.equal(body, fs.readFileSync('./src/index.ts', 'utf8'));
});

test('GET /v1/cache/{hash} - Unauthorized', async () => {
  const hash = crypto.randomUUID();

  const response = await makeRequest(
    'GET',
    `/v1/cache/${hash}`,
    { 'Authorization': 'Bearer wrong-token' },
  );

  assert.equal(response.status, 403);
  const body = await response.text();
  assert.equal(body, 'Access forbidden');
});

test('GET /v1/cache/{hash} - Not Found', async () => {
  const hash = crypto.randomUUID();

  const response = await makeRequest('GET', `/v1/cache/${hash}`);

  assert.equal(response.status, 404);
  const body = await response.text();
  assert.equal(body, 'The record was not found');
});
