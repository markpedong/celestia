import assert from 'node:assert/strict';
import test from 'node:test';
import { checkRateLimit } from '@/lib/server/rate-limit';
import { getRedis } from '@/lib/server/redis';

test('checkRateLimit default: no Redis, fail open', async () => {
  // Without Redis env, no Redis client is created; default behavior is fail-open.
  const result = await checkRateLimit('test-key', 10, 60);
  assert.equal(result, true);
});

test('checkRateLimit failOpen=false: no Redis, fail closed', async () => {
  // With failOpen=false and no Redis, requests are rejected (rate-limited) to protect endpoints.
  const result = await checkRateLimit('test-key', 10, 60, { failOpen: false });
  assert.equal(result, false);
});

test('checkRateLimit Redis null: respects failOpen option', async () => {
  // getRedis returns null when env vars are not set; ensure failOpen option is honored.
  const redis = getRedis();
  assert.equal(redis, null);
  const openResult = await checkRateLimit('test-key', 10, 60, { failOpen: true });
  const closedResult = await checkRateLimit('test-key', 10, 60, { failOpen: false });
  assert.equal(openResult, true);
  assert.equal(closedResult, false);
});
