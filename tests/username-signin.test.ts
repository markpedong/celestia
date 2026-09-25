import assert from 'node:assert/strict'
import test from 'node:test'
import {lookupUsernameAddress, trustedClientIP} from '@/lib/username-signin'

const fixture = (allowed = true) => {
  let lookupCalls = 0
  const keys: string[] = []
  const deps = {
    limit: async (key: string) => {keys.push(key); return allowed},
    lookup: async (userName: string) => {
      lookupCalls += 1
      return userName === 'stella' ? {email: 'test@example.invalid'} : null
    }
  }
  return {deps, keys, getLookupCalls: () => lookupCalls}
}

test('username resolver rejects all lookups when Redis is unavailable', async () => {
  const f = fixture(false)
  assert.deepEqual(await lookupUsernameAddress('stella', null, f.deps), {status: 'throttled'})
  assert.equal(f.getLookupCalls(), 0)
})

test('global and per-account limits are enforced without trusting caller-supplied IPs', async () => {
  const f = fixture()
  assert.deepEqual(await lookupUsernameAddress('stella', null, f.deps), {status: 'found', email: 'test@example.invalid'})
  assert.equal(f.keys.length, 2)
  assert.equal(f.keys[0], 'username-login:global')
  assert.match(f.keys[1], /^username-login:name:[a-f0-9]+$/)
  assert.equal(f.getLookupCalls(), 1)
})

test('invalid usernames do not reach the database', async () => {
  const f = fixture()
  assert.deepEqual(await lookupUsernameAddress('a@b.com', null, f.deps), {status: 'invalid'})
  assert.equal(f.getLookupCalls(), 0)
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
  await lookupUsernameAddress('stella', '203.0.113.10', f.deps)
  assert.equal(f.keys.length, 3)
  assert.match(f.keys[2], /^username-login:ip:[a-f0-9]+$/)
})
