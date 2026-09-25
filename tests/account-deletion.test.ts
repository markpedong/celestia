import assert from 'node:assert/strict';
import test from 'node:test';
import { reconcileAccountDeletion, type DeletionOperations, type DeletionRecord } from '@/lib/account-deletion';

const makeFixture = () => {
  let record: DeletionRecord | null = { userID: 'test-user', status: 'pending_auth' };
  let authExists = true;
  let appDataExists = true;
  let storageExists = true;
  const calls: string[] = [];
  const fail = new Set<string>();
  const operations: DeletionOperations = {
    load: async () => record ? { ...record } : null,
    authUserExists: async () => {
      calls.push('check_auth');
      if (fail.has('check_auth')) throw new Error('Auth lookup unavailable');
      return authExists;
    },
    deleteAuthUser: async () => {
      calls.push('delete_auth');
      if (fail.has('delete_auth')) throw new Error('Auth deletion unavailable');
      authExists = false;
    },
    markAuthDeleted: async () => {
      calls.push('mark_auth_deleted');
      if (fail.has('mark_auth_deleted')) throw new Error('Database update failed');
      record = { userID: 'test-user', status: 'pending_cleanup' };
    },
    cleanupApplicationData: async () => {
      calls.push('cleanup_app');
      if (authExists) throw new Error('Application data was deleted before Auth!');
      if (fail.has('cleanup_app')) throw new Error('Database transaction rolled back');
      appDataExists = false;
      record = { userID: 'test-user', status: 'pending_storage' };
    },
    cleanupStorage: async () => {
      calls.push('cleanup_storage');
      if (fail.has('cleanup_storage')) throw new Error('Storage unavailable');
      storageExists = false;
    },
    finish: async () => {
      calls.push('finish');
      if (fail.has('finish')) throw new Error('Database unavailable');
      record = null;
    },
  };
  const state = () => ({ record, authExists, appDataExists, storageExists, calls });
  return { operations, fail, state };
};

test('successful deletion removes auth before app data and finishes after storage', async () => {
  const fixture = makeFixture();
  assert.equal(await reconcileAccountDeletion('test-user', fixture.operations), 'complete');
  const state = fixture.state();
  assert.deepEqual(state, {
    record: null, authExists: false, appDataExists: false, storageExists: false,
    calls: ['check_auth', 'delete_auth', 'mark_auth_deleted', 'cleanup_app', 'cleanup_storage', 'finish'],
  });
});

test('Auth failure preserves application data and persisted request for retry', async () => {
  const fixture = makeFixture();
  fixture.fail.add('delete_auth');
  await assert.rejects(reconcileAccountDeletion('test-user', fixture.operations), /Auth deletion unavailable/);
  assert.deepEqual(fixture.state().record, { userID: 'test-user', status: 'pending_auth' });
  assert.equal(fixture.state().appDataExists, true);
  assert.equal(fixture.state().authExists, true);
  fixture.fail.clear();
  await reconcileAccountDeletion('test-user', fixture.operations);
  assert.equal(fixture.state().record, null);
  assert.equal(fixture.state().appDataExists, false);
});

test('auth lookup failure cannot trigger premature Prisma cleanup', async () => {
  const fixture = makeFixture();
  fixture.fail.add('check_auth');
  await assert.rejects(reconcileAccountDeletion('test-user', fixture.operations));
  assert.equal(fixture.state().appDataExists, true);
  assert.equal(fixture.state().record?.status, 'pending_auth');
});

test('crash after Auth deletion but before status write is recoverable', async () => {
  const fixture = makeFixture();
  fixture.fail.add('mark_auth_deleted');
  await assert.rejects(reconcileAccountDeletion('test-user', fixture.operations));
  assert.equal(fixture.state().authExists, false);
  assert.equal(fixture.state().appDataExists, true);
  fixture.fail.clear();
  await reconcileAccountDeletion('test-user', fixture.operations);
  assert.equal(fixture.state().record, null);
  assert.equal(fixture.state().calls.filter(call => call === 'delete_auth').length, 1);
});

test('Prisma cleanup failure rolls back and retries without re-deleting Auth', async () => {
  const fixture = makeFixture();
  fixture.fail.add('cleanup_app');
  await assert.rejects(reconcileAccountDeletion('test-user', fixture.operations));
  assert.equal(fixture.state().record?.status, 'pending_cleanup');
  assert.equal(fixture.state().appDataExists, true);
  fixture.fail.clear();
  await reconcileAccountDeletion('test-user', fixture.operations);
  assert.equal(fixture.state().record, null);
  assert.equal(fixture.state().calls.filter(call => call === 'delete_auth').length, 1);
});

test('storage and final-ledger failures remain retryable', async () => {
  const fixture = makeFixture();
  fixture.fail.add('cleanup_storage');
  await assert.rejects(reconcileAccountDeletion('test-user', fixture.operations));
  assert.equal(fixture.state().record?.status, 'pending_storage');
  assert.equal(fixture.state().appDataExists, false);
  fixture.fail.delete('cleanup_storage');
  fixture.fail.add('finish');
  await assert.rejects(reconcileAccountDeletion('test-user', fixture.operations));
  assert.equal(fixture.state().record?.status, 'pending_storage');
  fixture.fail.clear();
  await reconcileAccountDeletion('test-user', fixture.operations);
  assert.equal(fixture.state().record, null);
  assert.equal(fixture.state().calls.filter(call => call === 'cleanup_app').length, 1);
});

test('completed deletion is an idempotent no-op on subsequent reconciliation', async () => {
  const fixture = makeFixture();
  await reconcileAccountDeletion('test-user', fixture.operations);
  const priorCalls = fixture.state().calls.length;
  assert.equal(await reconcileAccountDeletion('test-user', fixture.operations), 'complete');
  assert.equal(fixture.state().calls.length, priorCalls);
});
