import assert from 'node:assert/strict'
import test from 'node:test'
import {isConfirmedMissingAuthUser, runLeasedDeletion, type DeletionLease} from '@/lib/account-deletion'

test('simultaneous recovery workers cannot both enter a claimed deletion', async () => {
  let held = false
  let releaseFirst!: () => void
  let firstStarted!: () => void
  const started = new Promise<void>(resolve => { firstStarted = resolve })
  const blockFirst = new Promise<void>(resolve => { releaseFirst = resolve })
  const lease: DeletionLease = {
    acquire: async () => {
      if (held) return false
      held = true
      return true
    },
    release: async () => { held = false }
  }
  let runs = 0
  const worker = () => runLeasedDeletion('fixture-user', lease, async () => {
    runs += 1
    firstStarted()
    await blockFirst
    return 'complete'
  })
  const first = worker()
  await started
  assert.equal(await worker(), 'busy')
  assert.equal(runs, 1)
  releaseFirst()
  assert.equal(await first, 'complete')
  assert.equal(held, false)
})

test('only explicit Supabase user-not-found confirms Auth absence', () => {
  assert.equal(isConfirmedMissingAuthUser({status: 404, code: 'user_not_found'}), true)
  assert.equal(isConfirmedMissingAuthUser({status: 404, code: 'unexpected_failure'}), false)
  assert.equal(isConfirmedMissingAuthUser({status: 404}), false)
  assert.equal(isConfirmedMissingAuthUser({status: 503, code: 'user_not_found'}), false)
  assert.equal(isConfirmedMissingAuthUser(null), false)
})

test('failure releases the claim so the next recovery pass can retry', async () => {
  let held = false
  const lease: DeletionLease = {
    acquire: async () => {
      if (held) return false
      held = true
      return true
    },
    release: async () => { held = false }
  }
  await assert.rejects(runLeasedDeletion('fixture-user', lease, async () => {
    throw new Error('Injected Supabase failure')
  }), /Injected Supabase failure/)
  assert.equal(held, false)
  assert.equal(await runLeasedDeletion('fixture-user', lease, async () => 'complete'), 'complete')
})
