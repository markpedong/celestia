import assert from 'node:assert/strict'
import test from 'node:test'
import {authenticateUsername, trustedClientIP} from '@/lib/username-signin'

type Verification = {
  userID: string
  session: {accessToken: string; refreshToken: string}
} | null

const fixture = (options: {
  allowed?: boolean
  verified?: Verification
  deletionPending?: boolean
} = {}) => {
  let lookupCalls = 0
  let verifyCalls = 0
  let deletionCalls = 0
  const keys: string[] = []
  const deps = {
    limit: async (key: string) => {
      keys.push(key)
      return options.allowed ?? true
    },
    lookup: async (userName: string) => {
      lookupCalls += 1
      return userName === 'stella' ? {id: 'user-id', email: 'test@example.invalid'} : null
    },
    verify: async () => {
      verifyCalls += 1
      return options.verified === undefined
        ? {userID: 'user-id', session: {accessToken: 'access-token', refreshToken: 'refresh-token'}}
        : options.verified
    },
    deletionPending: async () => {
      deletionCalls += 1
      return options.deletionPending ?? false
    }
  }

  return {
    deps,
    keys,
    getLookupCalls: () => lookupCalls,
    getVerifyCalls: () => verifyCalls,
    getDeletionCalls: () => deletionCalls
  }
}

test('username authentication fails closed when Redis is unavailable', async () => {
  const f = fixture({allowed: false})

  assert.deepEqual(await authenticateUsername('stella', 'correct horse battery staple', null, f.deps), {status: 'throttled'})
  assert.equal(f.getLookupCalls(), 0)
  assert.equal(f.getVerifyCalls(), 0)
  assert.equal(f.getDeletionCalls(), 0)
})

test('valid username credentials return a session without exposing the email', async () => {
  const f = fixture()

  assert.deepEqual(
    await authenticateUsername('stella', 'correct horse battery staple', null, f.deps),
    {status: 'authenticated', session: {accessToken: 'access-token', refreshToken: 'refresh-token'}}
  )
  assert.equal(f.keys.length, 2)
  assert.equal(f.keys[0], 'username-login:global')
  assert.match(f.keys[1], /^username-login:name:[a-f0-9]+$/)
  assert.equal(f.getLookupCalls(), 1)
  assert.equal(f.getVerifyCalls(), 1)
  assert.equal(f.getDeletionCalls(), 1)
})

test('invalid usernames do not reach the database', async () => {
  const f = fixture()

  assert.deepEqual(await authenticateUsername('a@b.com', 'correct horse battery staple', null, f.deps), {status: 'invalid'})
  assert.equal(f.getLookupCalls(), 0)
  assert.equal(f.getVerifyCalls(), 0)
  assert.equal(f.getDeletionCalls(), 0)
})

test('invalid passwords do not reach the database', async () => {
  const f = fixture()

  assert.deepEqual(await authenticateUsername('stella', '', null, f.deps), {status: 'invalid'})
  assert.equal(f.getLookupCalls(), 0)
  assert.equal(f.getVerifyCalls(), 0)
  assert.equal(f.getDeletionCalls(), 0)
})

test('credential verification failure does not return a session', async () => {
  const f = fixture({verified: null})

  assert.deepEqual(await authenticateUsername('stella', 'wrong-password', null, f.deps), {status: 'invalid'})
  assert.equal(f.getLookupCalls(), 1)
  assert.equal(f.getVerifyCalls(), 1)
  assert.equal(f.getDeletionCalls(), 0)
})

test('accounts with a pending deletion cannot sign in by username', async () => {
  const f = fixture({deletionPending: true})

  assert.deepEqual(await authenticateUsername('stella', 'correct horse battery staple', null, f.deps), {status: 'invalid'})
  assert.equal(f.getLookupCalls(), 1)
  assert.equal(f.getVerifyCalls(), 1)
  assert.equal(f.getDeletionCalls(), 1)
})

test('client IP headers are ignored unless deployment trust is explicit and values are valid', () => {
  const headers = new Headers({'x-forwarded-for': '1.2.3.4', 'x-real-ip': '203.0.113.10'})

  assert.equal(trustedClientIP(headers), null)
  assert.equal(trustedClientIP(headers, 'x-forwarded-for'), null)
  assert.equal(trustedClientIP(headers, 'x-real-ip'), '203.0.113.10')

  headers.set('x-real-ip', 'invalid,127.0.0.1')
  assert.equal(trustedClientIP(headers, 'x-real-ip'), null)
})

test('trusted client IP gets a third independent throttle', async () => {
  const f = fixture()

  assert.deepEqual(
    await authenticateUsername('stella', 'correct horse battery staple', '203.0.113.10', f.deps),
    {status: 'authenticated', session: {accessToken: 'access-token', refreshToken: 'refresh-token'}}
  )
  assert.equal(f.keys.length, 3)
  assert.match(f.keys[2], /^username-login:ip:[a-f0-9]+$/)
})
