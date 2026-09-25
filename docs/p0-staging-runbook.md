# Celestia P0 staging validation and rollout

**Prepared:** 2026-09-25. This is an operator runbook, not evidence that staging or production has been migrated or verified. Never test deletion on real customer accounts.

## Safe local validation

Run `pnpm typecheck && pnpm lint && pnpm test && pnpm build`. The normal test suite uses injected/pure dependencies and performs **no live deletion**. `pnpm test:integration` uses an explicitly isolated PostgreSQL database only when BOTH `CELESTIA_TEST_DATABASE_URL` and `CELESTIA_TEST_DB_ACK=DISPOSABLE_STAGING_ONLY` are present. It refuses the exact `DATABASE_URL` and `DIRECT_URL` strings and skips otherwise. Supply only a database you may safely create/delete test fixtures in. The integration test verifies real row-claim exclusivity, rollback and expired-lease takeover, and deletes only its randomly named fixture. Running it does **not** test Supabase.

## Deployment order — staging first

1. Create a **separate, disposable** staging Supabase project and PostgreSQL database. Verify their hosts/project IDs are not production. Back up production separately; never substitute its credentials for missing staging credentials.
2. Review and apply migrations `202609250001_pending_account_deletions` and `202609250002_account_deletion_lease` **in staging**. Use existing `pnpm db:deploy` only with confirmed staging `DIRECT_URL`, `DATABASE_URL`, Supabase URL, service key and publishable key. It also installs RLS and buckets, so review those scripts first. The second migration must exist before the updated `getCurrentUserID` and reconciler run.
3. Configure staging `CRON_SECRET` (unique high-entropy value) and Upstash Redis credentials; backup-code recovery and username lookup intentionally fail closed when Redis is unavailable. If using trusted proxy IP limits, configure `TRUSTED_CLIENT_IP_HEADER` to `cf-connecting-ip`, `x-real-ip`, or `x-vercel-forwarded-for` **only after** verifying the ingress overwrites inbound copies. Global/per-username limits work without this header.
4. Start staging separately. Run the **read-only** `CELESTIA_STAGING_BASE_URL=https://staging.example.com CELESTIA_STAGING_CONFIRMED=yes pnpm check:staging` against its verified origin. The script checks liveness 200, readiness 200, and unauthorized reconciliation 401. Do not use the production domain. To simulate outages, use separate staging dependencies.
5. **With disposable staging accounts only**, manually verify: pending request persistence; Auth API timeout, ambiguous 404 and confirmed user-not-found; crash after Auth delete; Prisma transaction rollback; simultaneous cron/browser retry; Storage partial failure; retry after worker crash/lease expiry; late post/image requests. Confirm a live/Auth account's application rows survive an Auth failure, and a removed Auth account's cleanup eventually completes.
6. Exercise MFA on a **staging-only** account with a real TOTP factor and previously generated legacy backup codes: authenticate to AAL2 before generating codes; sign in again to AAL1; enter the valid backup code; verify the admin factor reset revokes other sessions, the browser signs out, and the user must sign in and enroll fresh MFA. Check invalid/reused codes, an unavailable Redis limiter, and failures after removing only one of multiple factors. Confirm no client treats a legacy code as a session upgrade. Native Supabase recovery codes are experimental and are a distinct future migration path.
7. Test username brute-force throttling under Redis outage, repeated attempts against one username, IP-header spoofing with trusted and untrusted ingress, and invalid names. **Known residual privacy issue:** the current browser sign-in flow still resolves a valid username to an email for clients. Global/account rate limits reduce automation but do not eliminate enumeration. Do not mark this acceptance complete until the username flow verifies credentials server-side without publicly returning the email.
8. Inject deliberate errors in a **local/staging build only** to validate global and route error resets; verify health during DB/Auth/Redis outages and opaque logs. Check mobile keyboard navigation and dark-mode fallbacks.

## Reconciliation scheduling

The repository includes an **optional Vercel production** `vercel.json` cron entry: `0 * * * *` UTC for `/api/internal/account-deletions`. When deployed to Vercel production with `CRON_SECRET`, Vercel sends an authenticated Bearer header. Vercel preview deployments do **not** automatically execute this cron; for staging, configure a separate scheduler with staging credentials and a staging-only origin. On a different hosting provider, configure its scheduler explicitly instead. **Never deploy this cron before the migrations and secrets are ready.**

A valid cron call **performs pending deletion work**. Do not send it to production for smoke testing. Configure monitoring on 503 responses, nonzero `failed`, pending-ledger age, and lease-expiry retries. The endpoint processes at most 10 eligible requests per run. A 15-minute lease mitigates overlapping workers; unusually long Supabase operations and already in-flight writes still require staging concurrency tests and operational review.

## Outstanding acceptance

- Running `pnpm test:integration` without the explicit disposable staging variables yields a **skip**, not a pass.
- Staging and live Supabase Auth/Storage behavior, migration deployment, scheduled-job installation, mail/OAuth integration, browser E2E and health during outages remain **UNVERIFIED** until their actual results are recorded.
- Community avatar/cover images belonging to communities created by a deleted user are deliberately retained with the community while creator ownership is cleared. Decide a community-asset retention/transfer policy before declaring complete personal-media erasure.
- The independent deletion ledger plus Prisma transactions do **not** form a distributed transaction with Supabase. A request authenticated just before deletion starts can still race in-flight work; examine this in staging and consider database-level write fencing if reproduced.
