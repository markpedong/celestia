#!/usr/bin/env node
// Read-only P0 staging probe. Does not reconcile accounts or change data.
const base = process.env.CELESTIA_STAGING_BASE_URL
if (!base || process.env.CELESTIA_STAGING_CONFIRMED !== 'yes') {
  console.log('SKIPPED: set CELESTIA_STAGING_BASE_URL and CELESTIA_STAGING_CONFIRMED=yes for read-only staging checks.')
  process.exit(0)
}
let url
try {
  url = new URL(base)
} catch {
  console.error('Invalid staging base URL.')
  process.exit(2)
}
const isLocal = ['localhost', '127.0.0.1', '::1'].includes(url.hostname)
if (!isLocal && url.protocol !== 'https:') {
  console.error('Staging must use HTTPS outside localhost.')
  process.exit(2)
}
if (url.username || url.password || url.pathname !== '/' || url.search || url.hash) {
  console.error('Specify only a clean staging origin, without credentials or path.')
  process.exit(2)
}
if (process.env.NEXT_PUBLIC_SITE_URL && new URL(process.env.NEXT_PUBLIC_SITE_URL).origin === url.origin) {
  console.error('Refusing to probe NEXT_PUBLIC_SITE_URL; supply a separate staging origin.')
  process.exit(2)
}
let failures = 0
const check = async (path, expectStatus, label) => {
  try {
    const res = await fetch(new URL(path, url.origin), {
      cache: 'no-store',
      redirect: 'manual',
      signal: AbortSignal.timeout(8000)
    })
    const cache = res.headers.get('cache-control') ?? ''
    const body = await res.json().catch(() => null)
    const ok = res.status === expectStatus &&
      (expectStatus === 401 || body?.probe === label) &&
      (expectStatus === 401 || cache.includes('no-store'))
    console.log(`${ok ? 'PASS' : 'FAIL'} ${label}: HTTP ${res.status}`)
    if (!ok) failures++
  } catch {
    console.log(`FAIL ${label}: request failed or timed out`)
    failures++
  }
}
await check('/api/health?probe=live', 200, 'liveness')
await check('/api/health', 200, 'readiness')
await check('/api/internal/account-deletions', 401, 'unauthorized reconciliation')
// No valid CRON_SECRET is sent here; that would execute pending deletions.
if (failures) process.exitCode = 1
