import assert from 'node:assert/strict';
import test from 'node:test';
import { livenessResponse, readinessResponse } from '@/lib/server/health';

const healthy = { database: async () => 1, auth: async () => undefined };

test('liveness reports HTTP 200 without probing dependencies', async () => {
  const response = livenessResponse();
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.equal((await response.json()).probe, 'liveness');
});

test('healthy required dependencies return readiness HTTP 200', async () => {
  const response = await readinessResponse(healthy);
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.status, 'ok');
  assert.deepEqual(body.dependencies, { database: 'ok', auth: 'ok', cache: 'skipped' });
  assert.ok(Number.isFinite(Date.parse(body.timestamp)));
});

test('database failure returns HTTP 503 without revealing exception details', async () => {
  const response = await readinessResponse({ ...healthy, database: async () => { throw new Error('private-db-password'); } });
  assert.equal(response.status, 503);
  const text = await response.text();
  assert.equal(text.includes('private-db-password'), false);
  assert.equal(JSON.parse(text).dependencies.database, 'error');
});

test('auth failure returns HTTP 503', async () => {
  const response = await readinessResponse({ ...healthy, auth: async () => { throw new Error('offline'); } });
  assert.equal(response.status, 503);
  assert.equal((await response.json()).dependencies.auth, 'error');
});

test('optional cache failure is degraded without taking down readiness', async () => {
  const response = await readinessResponse({ ...healthy, cache: async () => { throw new Error('offline'); } });
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.status, 'degraded');
  assert.equal(body.dependencies.cache, 'error');
});

test('unresponsive required dependency is bounded', async () => {
  const response = await readinessResponse({
    ...healthy,
    database: () => new Promise(() => {}),
  }, 20);
  assert.equal(response.status, 503);
  assert.equal((await response.json()).dependencies.database, 'error');
});
