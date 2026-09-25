# Celestia Implementation Roadmap — Reconciled 2026-09-25

**Source of truth:** `docs/celestia-feature-audit.md` (re-audited working tree, not the original September 24 percentages). **Final branch:** `markpedong/feat/phase-one-commit-automation` (was `main` when audit started; branch changed independently mid-audit), **P0 follow-up baseline HEAD:** `28bc83486c4d4cc5f5062411b1b849f71bb5b6a5` (the initial re-audit used `496e7d8`); current feature counts after P0 follow-up: COMPLETE 3, PARTIAL 19, BROKEN 0, MISSING 19, UNVERIFIED 34, NOT APPLICABLE 0 (75 unique items).

## Release decisions and statuses

**P0 is a release gate, not proof of deployment acceptance.** The owner confirmed the current Supabase main project is test-only. All 15 Prisma migrations are now reconciled/applied there, 14 previously absent legacy CHECK constraints were restored, and the real PostgreSQL lease/rollback fixture test passed. Typecheck/lint/43 unit tests/build also pass. Read-only Supabase Admin Auth/Storage access is now verified for the configured test project, while Auth/Storage deletion and recovery, browser acceptance, operational alerts and deployed cron remain open; the username credential-exchange flow is implemented and still needs live endpoint/provider acceptance. The read-only main-test provider probe returns Auth **200** and Storage **200**, clearing the previous credential blocker; see `docs/p0-staging-runbook.md`.

### P0 — Data loss, critical trust and deployment blockers

| Order | Task / current state | Files / dependencies | Acceptance criteria and required tests |
|---|---|---|---|
| P0.1 | **PARTIAL**: Ledger/lease migrated; real PostgreSQL claim, rollback and expired-lease takeover PASSED; Supabase recovery matrix outstanding | `prisma/migrations/202609250001_pending_account_deletions/`, `prisma/migrations/202609250002_account_deletion_lease/`, `prisma/migrations/202609250003_reconcile_legacy_checks/`, `lib/server/account-deletion.ts`, `tests/integration/account-deletion.integration.test.ts`; existing Celestia main is explicitly a test project | Verify only synthetic Supabase Auth users on the main test project: ambiguous 404 safety, post-Auth crash, Storage retry, in-flight writes, long-running leases, retained community media, cron+CRON_SECRET deployment and alerts. Never delete real accounts. SQL-only constraints were reconciled, but cross-service atomicity is not guaranteed. |
| P0.2 | **PARTIAL**: Legacy backup-code reset implemented, provider acceptance missing | `lib/backup-code-recovery.ts`, `lib/actions/security.ts`, `hooks/use-auth-form.ts`, `lib/auth.ts`, `tests/backup-code-recovery.test.ts`; depends on a new disposable Supabase Auth account on the test-only main project, Redis and enabled admin factor-reset permissions | 5 helper tests pass. Verify real multi-factor reset, revoked sessions, sign-in/re-enrollment, one-time code invalidation, admin partial failures, stale-code cleanup, AAL2 protection and Redis fail-close. No legacy backup code is represented as an AAL2 session upgrade. |
| P0.3 | **PARTIAL**: Server-side username credential exchange implemented; live acceptance outstanding | `lib/username-signin.ts`, `app/api/auth/username/route.ts`, `lib/server/rate-limit.ts`, `services/username-session.ts`, `hooks/use-auth-form.ts`, `tests/username-signin.test.ts`; depends on trusted ingress and Supabase provider access | 3 rate-limit plus 8 username-auth tests pass; no arbitrary forwarded header trusted. The route verifies the password server-side and returns only Supabase session tokens. Endpoint-level Redis outage, live Supabase session/MFA, ingress and browser tests remain. |
| P0.4 | **UNVERIFIED**: Deploy and exercise health/error recovery | `app/api/health/route.ts`, `lib/server/health.ts`, error boundaries, `scripts/check-p0-staging.mjs`, `docs/p0-staging-runbook.md`; depends on staging domain with isolated dependencies | Run read-only staging smoke (currently skipped, no confirmed origin); real liveness must survive dependency outage, readiness 503 for mandatory dependency and degraded cache per policy; browser-injected crash/reset and safe production alerts still outstanding. |

### P1 — Essential safety and core social workflows

| Order | Task | Files / dependencies | Acceptance and tests |
|---|---|---|---|
| P1.1 | **PARTIAL**: Require canonical cross-post comment-vote contract | `app/api/votes/route.ts`, vote service callers, `tests/`; no new dependency | Decide required postID vs derive postID server-side; reject mismatch and malformed UUID; unit and route integration test with real post A, comment B, missing param and legitimate vote. |
| P1.2 | **MISSING**: User blocking | `prisma/schema.prisma`, `app/api/content-actions/route.ts`, `lib/db/post.queries.ts`, comment/search/chat entry points; migration | Self-block rejected; unblock reversible; blocked content and unwanted DMs filtered/enforced server-side; role, race and impersonation tests. |
| P1.3 | **MISSING**: Joined-community feed plus cursor pagination | `lib/db/post.queries.ts`, `components/feed/home-feed.tsx`, `app/api/posts/route.ts`, feed cards; depends on stable total ordering and membership query | Preserve public All feed; authenticated Joined feed filters memberships; stable cursor for ranked and time-based orders; no duplicate/missed posts under inserts; nextCursor null at end. DB and browser tests. |
| P1.4 | **MISSING**: Minimum moderation enforcement | `prisma/schema.prisma`, `app/api/reports/route.ts`, `components/community/community-reports-panel.tsx`, post/comment queries; depends on scoped mod roles and migration | Owner delegates moderators; role-gated post/comment removal and bans; review+remove actually hides content; audit trail, appeal/reversal policy; attacker cannot act outside own community. |
| P1.5 | **MISSING**: Vote-history privacy control | `prisma/schema.prisma`, `app/(public)/u/[username]/page.tsx`, `app/api/posts/route.ts`, `app/api/comments/route.ts`; migration | Profile activity and direct votedBy API obey owner-selected visibility, guest and signed-in tests; default policy explicit. |
| P1.6 | **PARTIAL**: Stable chat message cursor | `lib/db/chat.queries.ts`, `hooks/useQueries.ts`, `services/index.ts`; no schema change | Tuple cursor includes timestamp and ID; equal-timestamp messages appear exactly once; invalid cursor rejected; authorization regression tested. |

### P2 — Reliability, usability and maintainable moderation

| Order | Task | Files / dependencies | Acceptance and tests |
|---|---|---|---|
| P2.1 | General rate-limit outage policy, error hygiene | `lib/server/rate-limit.ts`, write API handlers, `services/request.ts`; Redis monitoring | Sensitivity-based fail-safe behavior; no secret/raw provider errors returned; fault injection and per-endpoint throttling integration tests. |
| P2.2 | Community privacy and join approval | `prisma/schema.prisma`, `app/api/community/route.ts`, `app/api/community/join/route.ts`, community page; after P1 moderation roles | Public unchanged; private/restricted endpoints enforce visibility and posting; approval/invite lifecycle and role matrix integration tests. |
| P2.3 | Community rules and post safety controls | Schema, community setting UI, posts/comments API; after P1 mod roles | Structured rules displayed; mod lock/pin/NSFW/spoiler rules persisted and enforced, with accessibility checks. |
| P2.4 | Notification preferences and reliable delivery | `prisma/schema.prisma`, `app/api/notifications/route.ts`, settings UI | User can disable notification types; server respects preference; pagination/unread count correct; realtime behavior fault-tested if adopted. |
| P2.5 | Media lifecycle hardening | `app/api/images/route.ts`, `lib/storage.ts`, post/profile mutation code; staging storage | Orphaned partial uploads reconciled, file contents checked, cleanup resilient; bucket ownership and cache consistency integration tests. |
| P2.6 | Integration/E2E and accessibility | `tests/`, CI/deployment config, layout, chat, auth, forms | Real isolated-DB authorization/transaction tests, browser sign-in/post/comment/vote/mod/recovery flows, mobile keyboard/contrast/assistive-tech audits; count skips and quarantine flaky tests visibly. |
| P2.7 | Dependency and observability consistency | `package.json`, package lockfiles, `README.md`, health/reconciler logs | Adopt one package manager, reproducible frozen install and Prisma generate/build; schedule audit, structured safe logs, alerts and backup/restore rehearsal. |
| P2.8 | Finish comment sorts and profile activity paging | `components/post/comment-thread.tsx`, `lib/db/comment.queries.ts`, profile page | Old/controversial sort based on documented scoring; stable paging for comment/profile activities; deterministic tests. |

### P3 — Optional scope-controlled enhancements

| Order | Task | Files / dependencies | Acceptance and tests |
|---|---|---|---|
| P3.1 | Draft posts, dedicated links and safe Markdown | New draft schema, post form, post/comment renderers | Autosave/recovery; validated link preview SSRF protection; sanitized Markdown and XSS tests; only implement if product scope confirms. |
| P3.2 | Mentions, richer notification delivery | Post/comment parser, notification model/API | Escaping, dedup, user opt-out, bounded fanout; integration tests; optional. |
| P3.3 | Optional social formats (poll/video/flair/cross-post/schedule) | Post schema/storage/worker UI | Agree demand and moderation policy before adding tables, queues or dependencies. |
| P3.4 | Optional administration, modmail, recommendations | Admin authorization, new schemas, cache and ranking | Ship only when moderation volume and user needs justify complexity; test access boundaries and ranking transparency. |

## Verified local work and preserved history

- Prior P0 vote-target work remains PARTIAL pending its route contract test. The username rate-limit and credential-exchange work has pure tests, but endpoint, provider and browser acceptance remain outstanding.
- Historical Prisma-first deletion reorder was unsafe; **superseded** by durable Auth-first recovery. Pure failure-injection tests pass (7), but no claim of distributed atomicity or deployed acceptance.
- Prior Phase 1 hover actions, error boundaries and liveness/readiness paths exist and their respective pure tests pass (3/2/6); real browser and staging acceptance stays UNVERIFIED/PARTIAL as indicated in audit.
- Latest recorded verification: `pnpm typecheck` PASS; `pnpm lint` PASS; `pnpm test` **43/43 PASS**; `pnpm build` PASS (40/40 generated static pages); main-test PostgreSQL integration **1/1 PASS** via explicit opt-in; all **15/15 migrations applied** and schema diff empty. Read-only staging probe skipped without confirmed origin; real Supabase Auth/Storage, browser E2E, deployed scheduler and alerting remain unverified.

## Next implementation phase

**Next release gate:** complete the synthetic-user Supabase Auth/Storage deletion failure matrix on the owner-confirmed main **test** project (the real PostgreSQL fixture has already passed), test browser MFA recovery and health/error behavior, and run live endpoint/provider acceptance for the secure username credential exchange. Configure monitored cron only after secret readiness and recovery acceptance. Only then proceed to P1 blocking, moderation, joined feed and cursor pagination. Maintain one row per acceptance feature and reconcile audit counts from the inventory at each milestone. Preserve history instead of marking tests or deployment completed merely because a handler exists.
