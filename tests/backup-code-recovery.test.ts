import assert from 'node:assert/strict'
import test from 'node:test'
import {resetFactorsWithBackupCode, type BackupRecoveryOperations} from '@/lib/backup-code-recovery'

const makeFixture = () => {
  const verified = new Set(['factor-1', 'factor-2'])
  let codeUsed = false
  let remaining = true
  let deleted = 0
  let failAt = ''
  const operations: BackupRecoveryOperations = {
    claimCode: async () => {
      if (codeUsed) return false
      codeUsed = true
      return true
    },
    restoreCode: async () => { codeUsed = false },
    removeVerifiedFactor: async factorID => {
      if (factorID === failAt) throw new Error('Supabase is unavailable')
      verified.delete(factorID)
      deleted += 1
    },
    invalidateRemainingCodes: async () => {
      if (failAt === 'cleanup') throw new Error('DB unavailable')
      remaining = false
    }
  }
  return {operations, verified, state: () => ({codeUsed, remaining, deleted}), fail: (at: string) => {failAt = at}}
}

test('legacy backup code resets verified factors without claiming an AAL2 session', async () => {
  const fixture = makeFixture()
  assert.equal(await resetFactorsWithBackupCode(['factor-1','factor-2'], fixture.operations), 'recovered')
  assert.deepEqual([...fixture.verified], [])
  assert.deepEqual(fixture.state(), {codeUsed: true, remaining: false, deleted: 2})
  assert.equal(await resetFactorsWithBackupCode(['factor-1'], fixture.operations), 'invalid')
})

test('invalid code cannot delete factors', async () => {
  const fixture = makeFixture()
  fixture.operations.claimCode = async () => false
  assert.equal(await resetFactorsWithBackupCode(['factor-1'], fixture.operations), 'invalid')
  assert.equal(fixture.state().deleted, 0)
})

test('external factor failure restores the code for retry', async () => {
  const fixture = makeFixture()
  fixture.fail('factor-2')
  await assert.rejects(resetFactorsWithBackupCode(['factor-1','factor-2'], fixture.operations), /Supabase/)
  assert.deepEqual([...fixture.verified], ['factor-2'])
  assert.equal(fixture.state().codeUsed, false)
  fixture.fail('')
  assert.equal(await resetFactorsWithBackupCode(['factor-2'], fixture.operations), 'recovered')
})

test('cleanup failure after irreversible factor removal reports a partial recovery', async () => {
  const fixture = makeFixture()
  fixture.fail('cleanup')
  assert.equal(await resetFactorsWithBackupCode(['factor-1'], fixture.operations), 'recovered_with_stale_codes')
  assert.equal(fixture.state().remaining, true)
  assert.equal(fixture.state().deleted, 1)
})

test('missing verified factor rejects recovery without consuming a code', async () => {
  const fixture = makeFixture()
  await assert.rejects(resetFactorsWithBackupCode([], fixture.operations), /No verified factor/)
  assert.equal(fixture.state().codeUsed, false)
})
