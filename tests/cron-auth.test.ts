import assert from 'node:assert/strict';
import test from 'node:test';
import { isAuthorizedCronRequest } from '@/lib/cron-auth';

test('reconciliation rejects missing and invalid secrets', () => {
  assert.equal(isAuthorizedCronRequest(null, 'test-secret'), false);
  assert.equal(isAuthorizedCronRequest('Bearer test-secret', undefined), false);
  assert.equal(isAuthorizedCronRequest('Basic test-secret', 'test-secret'), false);
  assert.equal(isAuthorizedCronRequest('Bearer short', 'test-secret'), false);
  assert.equal(isAuthorizedCronRequest('Bearer test-secrEt', 'test-secret'), false);
});

test('reconciliation accepts only the matching bearer secret', () => {
  assert.equal(isAuthorizedCronRequest('Bearer test-secret', 'test-secret'), true);
});
