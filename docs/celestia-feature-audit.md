# Celestia Current Feature Re-Audit

**Audit date:** 2026-09-25 (Asia/Manila)  
**Repository state:** the original re-audit began at `496e7d8`. P0 source has since been committed on `markpedong/feat/phase-one-commit-automation` (`4deed96` and subsequent auto-commits). The configured Celestia main Supabase project is explicitly a test project; its migration history and database integration test were verified on 2026-09-25. Check `git log` for the current auto-committed HEAD.
**Scope:** original re-audit, P0 hardening, then an explicitly authorized test-only migration rollout on the existing Celestia main Supabase project. Historical snapshots below are preserved; the final addendum supersedes their earlier skipped-migration and uncommitted-status statements. No real account or Supabase Auth user was deleted, and no application or scheduler deployment was performed.
**Classification:** COMPLETE requires suitable automated evidence; UNVERIFIED means an implementation was located but end-to-end acceptance is not established; PARTIAL means a demonstrable implementation/requirements gap; MISSING means required functionality not present; BROKEN requires a reproduced failure, not speculation.

## Executive summary

| Status | Count |
|---|---:|
| COMPLETE | 3 |
| PARTIAL | 19 |
| BROKEN | 0 |
| MISSING | 19 |
| UNVERIFIED | 34 |
| NOT APPLICABLE | 0 |
| **Total independently inventoried features** | **75** |

The current totals are calculated from the 75 unique rows below (including two newly PARTIAL operational/test features), not inherited from the September 24 audit. The original document previously claimed 62 complete / 16 partial / 40 missing based largely on code inspection; that historical scoring is superseded. No live production or browser acceptance is claimed.

### Repository state and verified architecture

- At the **original audit snapshot**, the checkout had **31 changed/untracked entries**; an independent branch checkout occurred during that original audit. Those original changes have since been committed; this P0 implementation has its own uncommitted working tree. Original modified tracked code: `app/api/auth/username/route.ts`, `app/api/votes/route.ts`, `components/feed/author-hover-card.tsx`, `hooks/useQueries.ts`, `lib/actions/security.ts`, `lib/server/rate-limit.ts`, `lib/server/redis.ts`, `prisma/schema.prisma`, `proxy.ts`. The two documentation files were untracked at audit start. Other untracked work includes deletion ledger/migration, internal reconciler, health, boundaries, tests, lockfile and workspace settings; preserve all.
- Original baseline HEAD `496e7d8` was dated 2026-07-14. At P0 follow-up start, HEAD had advanced to `28bc834` on the feature branch. This implementation's new P0 files and modifications remain uncommitted, so do not attribute them to that commit.
- Next.js **16.2.6** App Router / React **19.2.4** / TypeScript 5 / Tailwind 4 / Radix/shadcn; PostgreSQL with Prisma declared **^7.8.0**, locally installed/generated **7.10.0**; Supabase SSR Auth, Storage, and Realtime; TanStack Query 5; Upstash Redis; Sharp image transforms; Zod 4. Both `package-lock.json` and `pnpm-lock.yaml` are now tracked; align on one package manager later.
- Data flow: server-rendered feeds call `lib/db/*.queries.ts`; client mutations use `hooks/useQueries.ts` and `services/index.ts`; `app/api/**/route.ts` checks session/validation and writes Prisma; `proxy.ts` applies request origin and session behavior; Supabase Admin performs Auth and Storage operations. Only account deletion uses an independent persisted recovery ledger.

## Exact verification executed

| Command | Result | Limitations |
|---|---|---|
| `pnpm typecheck` | PASS, `tsc --noEmit` | Static typing only |
| `pnpm lint` | PASS, `eslint` | Static lint only |
| `pnpm test` | **43 pass, 0 fail, 0 skipped, 0 todo** | Includes deletion lease, legacy recovery, per-account/IP limiter and server-side username-auth unit tests; no live Supabase Auth/Storage calls |
| `pnpm build` | PASS, Prisma client generated and Next.js 16.2.6 compiled; **40/40 static pages** generated | Does not prove live HTTP/service health or browser behavior |
| `pnpm list prisma @prisma/client --depth 0` | Both installed at 7.10.0 | Package specification is ^7.8.0; generated client matches installed |
| `pnpm test:integration` | **1 pass, 0 fail, 0 skipped** | Ran the isolated, randomly named PostgreSQL fixture against the explicitly confirmed Celestia main test project; Supabase Auth/Storage and browser E2E remain untested. Default invocation remains opt-in and skips. |
| `pnpm check:staging` | SKIPPED: no confirmed staging URL | Read-only health + unauthorized cron probe script exists; never run against an unverified host |
| Database migrations | **15/15 applied on Celestia main test project** | The 12 pre-existing migrations were baselined after checking schema, chat policies and triggers; three new migrations applied. No app deploy or cron scheduling was verified. |

**Important:** `pnpm build` runs `prisma generate`; the follow-up also added a legacy-check reconciliation migration and aligned Prisma's `updatedAt` default with the database. Tests created and removed one synthetic database fixture only, not a real account or Supabase Auth user. No dependency was installed.

## Independently inspected prior fixes

| Previously claimed fix | Current status | Direct evidence | Test evidence and remaining acceptance |
|---|---|---|---|
| Cross-post vote validation | PARTIAL | `app/api/votes/route.ts` fetches actual comment `postID` and rejects a *supplied* mismatch | No dedicated route test. Missing `postID` is accepted; require/derive canonical target contract and test invalid, absent, cross-post and legitimate requests |
| Sensitive auth rate-limit fail-close | PARTIAL | Username API fails closed; global and per-name 8/600 rate limits enforced without trusting arbitrary forwarding headers; optional configured trusted IP limit | 3 rate-limit + 8 username-auth tests pass. Real Redis outage/endpoint, provider-session and browser tests remain; the username route no longer returns the associated email. |
| Account-deletion durable stages | PARTIAL | Independent ledger, Auth before Prisma; **lease CAS** in `lib/server/account-deletion.ts`; ledger and lease migrations applied on the main test DB; active API requests reject pending users | 7 orchestration + 3 lease/error-classification tests and one real PostgreSQL claim/rollback/lease test pass. Live Supabase Auth/Storage, in-flight write race and scheduler remain unverified. |
| Chat participant cleanup | UNVERIFIED | Explicit `tx.chatParticipant.deleteMany({where:{userID}})` and `ChatParticipant.user` onDelete Cascade | No real FK/integration test; ensure group conversations and direct messages behave appropriately after deletion |
| Author hover Follow | UNVERIFIED | `author-hover-card.tsx` calls existing `useContentAction`; guest/self/loading/error UI present | 3 pure state tests, but no browser/API test for follow/unfollow, rollback and session transitions |
| Author hover Start Chat | UNVERIFIED | `author-hover-card.tsx` calls `useStartDirectConversation`, existing API uses directKey upsert | State tests only; check success event/navigation, duplicate clicks, failures, keyboard/mobile |
| Global and route boundaries | UNVERIFIED | `app/global-error.tsx`, both route-group `error.tsx` and shared `RouteError` | 2 SSR fallback tests; crash/retry, shell styles and meaningful production telemetry unverified |
| Health and readiness | PARTIAL | `/api/health?probe=live` skips deps; default readiness probes DB and Auth, optionally Redis; generic JSON and 503 on mandatory failure | 6 pure injected tests pass; live HTTP during dependency outage and deployment monitoring not verified |
| MFA backup-code behavior | PARTIAL | Legacy code now triggers controlled admin factor reset; verified factor deletion revokes sessions; UI signs out and requires new login and TOTP enrollment; AAL2 required to generate codes | 5 recovery helper unit tests pass. Real Supabase admin-factor reset, multi-factor partial failure and session invalidation still unverified; never claim AAL2 from legacy code. |

## Historical risk findings from the initial re-audit

The ten numbered findings below document the original snapshot. The P0 implementation described in the addendum mitigates the lease, AAL2 misrepresentation and spoofable-default-IP items, but does **not** complete staging acceptance.

## Newly identified risk and acceptance gaps

1. **P0 release gate: deletion retry correctness.** The ledger is independent of deleted `Users`, and successful Auth confirmation precedes app cleanup. Yet concurrent `processAccountDeletion` invocations have no lease/claim guard; writes during deletion can reintroduce data or media; storage manifest covers *user profile and post* media but not owned community avatar/cover media; final storage cleanup is external and retryable, not atomic. Test concurrency, late writes, orphaned files, migration rollout and post-deletion cache invalidation against disposable services.
2. **P0/P1 MFA recovery semantics.** A valid backup code is marked used and client navigates to `/`, but it does not achieve AAL2. Clearly differentiate proving backup-code possession from changing Supabase's assurance; do not claim full second-factor recovery for protected operations.
3. **P1 auth-enumeration/rate-limit provenance.** The username route now verifies credentials server-side and returns only session tokens; it does not return the associated email. Validate trusted proxy forwarding, real Redis unavailability, Supabase session/MFA behavior and browser sign-in acceptance.
4. **P1 chat pagination tie loss.** `lib/db/chat.queries.ts` pages with `createdAt < cursorDate`; messages sharing the boundary timestamp can be skipped. Use stable (`createdAt`, `id`) tuple.
5. **P1 feed bounds and privacy.** `lib/db/post.queries.ts` caps all ranked feeds at 50 with no cursor; public profile includes complete up/down vote activity without user controls.
6. **P1 moderation gap.** `app/api/reports/route.ts` supports creating, listing and status updates but no actual removal or role delegation.
7. **P2 resilience.** `checkRateLimit` defaults fail-open for most authenticated writes; upload batching may leave prior successful storage objects after a sibling fails. No comprehensive real-service fault injection.
8. **P2 consistency.** Database model lacks structured roles, bans, private communities, post moderation flags and user blocks; do not mistake general content-actions `hidden`/`muted` for blocks or moderation.
9. **P2 operational uncertainty.** No verified cron schedule, migration state, alerting, external OAuth/passkey/realtime configuration, browser accessibility testing or live dependency tests.
10. **P2 dependency hygiene.** Two package-manager lockfiles exist and Prisma declared range is looser than generated local version; establish one reproducible package manager and CI version gate.

## Recalculated feature matrix

Each row is one distinct user-facing capability or operational acceptance item. Path references are repo-relative. `UNVERIFIED` deliberately prevents source-code presence from being misreported as tested.


### Authentication and accounts

| Feature | Status | Code evidence | Missing check / limitation |
|---|---|---|---|
| Email signup and login | **UNVERIFIED** | `components/auth/auth-methods.tsx`, `hooks/use-auth-form.ts` | Provider/database end-to-end untested |
| Username login | **PARTIAL** | `app/api/auth/username/route.ts`, `lib/username-signin.ts`, `services/username-session.ts`, `hooks/use-auth-form.ts` | Server-side password verification and non-enumerating session exchange are covered by pure tests; live Supabase session/MFA, endpoint, ingress and browser acceptance remain |
| Google/Apple OAuth | **UNVERIFIED** | `hooks/use-auth-form.ts`, `app/auth/callback/route.ts` | Live provider configuration and callback not exercised |
| Password recovery | **UNVERIFIED** | `app/auth/forgot-password/page.tsx`, `app/auth/update-password/page.tsx` | Email delivery and session transition untested |
| Session refresh and route protection | **UNVERIFIED** | `proxy.ts`, `lib/auth.ts` | Source reviewed; deployment auth/MFA matrices missing |
| MFA TOTP enrollment and verification | **UNVERIFIED** | `components/dialogs/mfa-dialog.tsx`, `hooks/use-auth-form.ts` | Live AAL2 challenge and protected route checks missing |
| MFA backup-code recovery | **PARTIAL** | `lib/actions/security.ts`, `hooks/use-auth-form.ts:190-218` | Code consumed without obtaining Supabase AAL2; UI redirects anyway |
| Passkey login and account settings | **UNVERIFIED** | `components/auth/account-settings.tsx`, `hooks/use-auth-form.ts` | Supabase experimental/provider recovery requires device tests |
| OAuth linking/unlinking | **UNVERIFIED** | `components/auth/account-settings.tsx` | No provider integration test |
| Persisted account deletion and retries | **PARTIAL** | `lib/account-deletion.ts`, `lib/server/account-deletion.ts`, `prisma/migrations/202609250001_pending_account_deletions/migration.sql` | 7 failure-injection unit tests; migration/job/staging integration outstanding; race and cross-service rollback gaps |
| Chat-participant cleanup on deletion | **UNVERIFIED** | `lib/server/account-deletion.ts`, `prisma/schema.prisma` | Explicit deleteMany and FK cascade; no database test |
| Deletion reconciliation authorization | **PARTIAL** | `app/api/internal/account-deletions/route.ts`, `lib/cron-auth.ts` | 2 secret tests; deployment schedule, observability, concurrency unverified |

### Profiles and relationships

| Feature | Status | Code evidence | Missing check / limitation |
|---|---|---|---|
| Public profiles and karma | **UNVERIFIED** | `app/(public)/u/[username]/page.tsx`, `lib/db/user.queries.ts` | Code path present; live render not tested |
| Avatar and cover management | **UNVERIFIED** | `app/api/images/route.ts`, `app/api/user/route.ts` | Ownership checks inspected; storage integration untested |
| Bio and display-name settings | **UNVERIFIED** | `app/api/user/route.ts`, `components/profile/profile-settings-form.tsx` | Schema validation inspected; UI-to-DB untested |
| Post/comment activity tabs | **UNVERIFIED** | `components/profile/profile-activity-tabs.tsx`, `app/(public)/u/[username]/page.tsx` | Queries limited and no browser verification |
| Follow/unfollow via author hover | **UNVERIFIED** | `components/feed/author-hover-card.tsx`, `hooks/useQueries.ts` | State unit tests; no real UI/API integration |
| Start DM via author hover | **UNVERIFIED** | `components/feed/author-hover-card.tsx`, `app/api/chat/conversations/route.ts` | State unit tests; real navigation/event untested |
| Block user | **MISSING** | `prisma/schema.prisma`, `app/api/content-actions/route.ts` | No blocking model or enforcement across chat/feed |
| Vote-history privacy | **MISSING** | `app/(public)/u/[username]/page.tsx`, `prisma/schema.prisma` | Public up/down-voted content with no toggle |
| Notification preferences | **MISSING** | `prisma/schema.prisma`, `app/(authenticated)/settings/page.tsx` | No per-type preferences |

### Communities and moderation

| Feature | Status | Code evidence | Missing check / limitation |
|---|---|---|---|
| Create and edit community | **UNVERIFIED** | `app/api/community/route.ts`, `components/community/create-community-form.tsx` | Owner checks and transaction inspected, browser/database missing |
| Join/leave public community | **UNVERIFIED** | `app/api/community/join/route.ts` | Membership and chat transaction inspected; race tests missing |
| Community feed, members and stats | **UNVERIFIED** | `app/api/community/feed/route.ts`, `lib/db/community.queries.ts` | API and UI present; integration absent |
| Community privacy/restriction | **MISSING** | `prisma/schema.prisma` | All modeled communities publicly accessible |
| Join requests/invitations | **MISSING** | `prisma/schema.prisma` | No approval/invite flow |
| Moderator roles and delegation | **MISSING** | `prisma/schema.prisma` | Only createdByID ownership |
| Community bans | **MISSING** | `prisma/schema.prisma` | No enforcement model |
| Community rules | **MISSING** | `prisma/schema.prisma` | Description exists but no structured rules |
| Owner report queue | **UNVERIFIED** | `app/api/reports/route.ts`, `components/community/community-reports-panel.tsx` | Ownership checks inspected; not database/browser tested |
| Report-driven content removal | **MISSING** | `app/api/reports/route.ts` | PATCH only changes report status |
| Community deletion | **MISSING** | `app/api/community/route.ts` | No DELETE handler or owner workflow |

### Posts, comments and voting

| Feature | Status | Code evidence | Missing check / limitation |
|---|---|---|---|
| Text/image post create | **UNVERIFIED** | `app/api/posts/route.ts`, `components/post/submit-post-form.tsx` | Membership/schema/ownership checked in source; storage + DB missing |
| Post edit/delete | **UNVERIFIED** | `app/api/posts/route.ts` | Author checks and transaction reviewed; race and orphan storage tests absent |
| Media upload and optimization | **PARTIAL** | `app/api/images/route.ts`, `lib/storage.ts` | Sharp validation and URL ownership; uploads may be orphaned after partial failure |
| Post detail and lightbox | **UNVERIFIED** | `app/(public)/post/[id]/page.tsx`, `components/post/post-image-gallery.tsx` | Rendering code present; browser untested |
| Link posts | **MISSING** | `prisma/schema.prisma` | No dedicated URL type |
| Post drafts | **MISSING** | `prisma/schema.prisma` | No persistence/autosave |
| Content flags, lock and pin | **MISSING** | `prisma/schema.prisma` | No post states or enforcement |
| Nested comments and replies | **PARTIAL** | `lib/comment-tree.ts`, `app/api/comments/route.ts`, `tests/core.test.ts` | Tree unit test; parent membership and concurrent write integration missing |
| Comment edit/soft delete | **UNVERIFIED** | `app/api/comments/route.ts` | Owner checks present; UI/database testing missing |
| Comment sorting | **PARTIAL** | `components/post/comment-thread.tsx` | Best/top/new present; old/controversial absent |
| Cross-post vote target check | **PARTIAL** | `app/api/votes/route.ts` | Mismatch check source-verified; omitted postID accepted and no API test |
| Vote score atomicity and rapid intent | **PARTIAL** | `lib/db/vote.queries.ts`, `lib/vote-reconciliation.ts`, `tests/core.test.ts` | Intent unit test; race/integrity database tests missing |
| Save and hide content | **UNVERIFIED** | `app/api/content-actions/route.ts`, `app/(authenticated)/saved/page.tsx` | API and pages present; UI-to-DB test missing |
| Comment moderation removal | **MISSING** | `app/api/comments/route.ts` | Only author soft-delete |
| Comment mentions | **MISSING** | `app/api/comments/route.ts` | No parsing or mention notifications |

### Feeds, chat, notifications

| Feature | Status | Code evidence | Missing check / limitation |
|---|---|---|---|
| Public ranked and community feeds | **UNVERIFIED** | `lib/db/post.queries.ts`, `components/feed/home-feed.tsx` | Hot/new/top/rising/controversial code inspected; no DB benchmark |
| Time-window feed filters | **UNVERIFIED** | `lib/db/post.queries.ts`, `components/feed/feed-time-filter.tsx` | Parameterized SQL inspected; real query untested |
| Personalized joined-community feed | **MISSING** | `components/feed/home-feed.tsx`, `lib/db/post.queries.ts` | Home uses all communities |
| Feed cursor pagination | **MISSING** | `lib/db/post.queries.ts` | LIMIT 50 without cursor/next page |
| Search across content types | **UNVERIFIED** | `lib/db/search.queries.ts`, `app/(public)/search/page.tsx` | Post/comment/people/community query paths; real search missing |
| Explore and suggestions | **UNVERIFIED** | `app/(public)/explore/page.tsx`, `app/api/search/suggestions/route.ts` | UI and endpoint present; browser missing |
| Direct and community chat | **UNVERIFIED** | `lib/db/chat.queries.ts`, `components/chat/chat-widget.tsx` | Participant authorization inspected; real realtime/membership test absent |
| Chat cursor pagination | **PARTIAL** | `lib/db/chat.queries.ts:186-209` | Timestamp-only cursor can miss same-timestamp messages |
| Realtime chat delivery | **UNVERIFIED** | `components/chat/chat-widget.tsx`, `lib/chat-events.ts` | Supabase realtime behavior not tested |
| Notification list and marking read | **UNVERIFIED** | `app/api/notifications/route.ts` | Server route present; browser/API test missing |
| Realtime notification delivery | **MISSING** | `app/api/notifications/route.ts` | No end-to-end push subscription |

### Security, operations and UX

| Feature | Status | Code evidence | Missing check / limitation |
|---|---|---|---|
| Sensitive username fail-close | **PARTIAL** | `lib/server/rate-limit.ts`, `lib/username-signin.ts`, `app/api/auth/username/route.ts`, `tests/rate-limit.test.ts`, `tests/username-signin.test.ts` | 3 rate-limit + 8 username-auth tests; forwarded IP provenance and Redis outage endpoint test missing |
| General write rate limiting | **PARTIAL** | `lib/server/rate-limit.ts`, `app/api/posts/route.ts` | Fail-open by default on most write routes; outage abuse risk |
| CSRF/origin checks | **PARTIAL** | `proxy.ts` | Source validates cross-site header and matching host; no spoofed-header/integration test |
| Content and image ownership | **PARTIAL** | `app/api/images/route.ts`, `lib/storage.ts`, `tests/core.test.ts` | URL ownership unit test; live storage RLS/end-to-end absent |
| Global and route error boundaries | **UNVERIFIED** | `app/global-error.tsx`, `app/(public)/error.tsx`, `app/(authenticated)/error.tsx`, `tests/error-boundaries.test.ts` | 2 rendering tests pass; forced crash/reset untested |
| Liveness/readiness probes | **PARTIAL** | `app/api/health/route.ts`, `lib/server/health.ts`, `tests/health.test.ts` | 6 injected tests; real dependency response and latency untested |
| Responsive app shell/dark mode | **UNVERIFIED** | `app/layout.tsx`, `app/globals.css`, `components/layout` | Browser/mobile/a11y tests absent |
| Keyboard/a11y audit | **UNVERIFIED** | `components/ui`, `components/feed/author-hover-card.tsx` | No assistive-tech or contrast testing |
| SEO and crawl surfaces | **UNVERIFIED** | `app/sitemap.ts`, `app/robots.ts`, `app/layout.tsx` | Generated in build; external crawling and OG verification absent |
| Redis feed cache/invalidation | **PARTIAL** | `lib/server/feed-cache.ts`, `app/api/posts/route.ts` | Write invalidation present; real cache outage/race and hit behavior untested |
| Dependency version reproducibility | **PARTIAL** | `package.json`, `pnpm-lock.yaml`, `package-lock.json` | Installed Prisma 7.10.0 vs package ^7.8.0; two lockfiles; pinning/toolchain policy needed |
| Unit/smoke suite | **COMPLETE** | `tests/*.test.ts`, `package.json` | pnpm test **43/43 pass**, zero skipped; separate integration suite is explicit opt-in |
| Typecheck and lint gates | **COMPLETE** | `package.json`, `tsconfig.json`, `eslint.config.mjs` | pnpm typecheck and pnpm lint pass |
| Production compilation | **COMPLETE** | `package.json`, `next.config.ts` | pnpm build pass with 40 static pages generated |
| Database/API integration suite | **PARTIAL** | `tests/integration/account-deletion.integration.test.ts`, `package.json` | One real PostgreSQL fixture test passed on the confirmed main test project using explicit opt-in; broad API and Supabase Auth/Storage integration remain absent |
| Browser E2E suite | **MISSING** | `tests/` | No Playwright/browser automation present |
| Production telemetry and reconciler scheduling | **PARTIAL** | `vercel.json`, `scripts/check-p0-staging.mjs`, `docs/p0-staging-runbook.md` | Optional hourly Vercel cron and read-only smoke script exist; deployment, credentials, alerts and non-Vercel scheduling unverified |

## External and manual verification still required

Use disposable staging credentials, seed fixtures and explicit authorization; do not run production deletion tests. Apply the migration first in staging; verify account-request persist failure, failed/ambiguous Auth delete, successful Auth followed by crash, transaction rollback, simultaneous reconciler requests, delayed uploads, partial storage removal and recovery after losing the browser session. Exercise real GET health endpoints during Auth/DB/Redis outages; verify Supabase bucket rules and server image permissions. In a browser, test both hover actions across guests/self/signed-in users, injected client errors and reset, MFA TOTP/backup-code assurance transitions, mobile tap/keyboard/reader accessibility, realtime messages, all principal API resource-authorization paths, and cache freshness after edits/deletion. Inspect cloud scheduler, migrations, monitoring and deployed secrets without disclosing their values.

## Prior-audit history (preserved)

- **2026-09-24**: initial feature audit and P0 vote/rate-limit fixes; baseline totals `62 complete / 16 partial / 0 broken / 40 missing` were based heavily on inspection and are **not** current verified acceptance figures.
- **2026-09-25**: P0.1 hover actions, P0.2 boundaries, P0.3 health and persisted, staged deletion were introduced in the *uncommitted checkout*. Locally the suite grew to 27 and compile/lint/build passed. This re-audit separates those implemented code paths from unperformed browser, database, provider and deployment acceptance.
- Historical Prisma-first deletion reorder is **superseded** by persisted Auth-first staged cleanup; any historical lost application data is not reconstructed by the new ledger.

## 2026-09-25 P0 implementation follow-up (historical snapshot before main-test rollout)

- Introduced a 15-minute per-account recovery lease using atomic Prisma `updateMany`, claim-scoped stage transitions and a dedicated migration. Pending user IDs are rejected by API session checks; previously authenticated in-flight mutations remain a race to test in staging. Ambiguous Auth HTTP 404 is no longer sufficient to assume deletion: only Supabase `user_not_found` qualifies.
- Reworked legacy backup codes into explicit factor **reset**, not session AAL2 upgrade. The action is Redis-limited and fails closed; a verified code consumes once, administrative factor deletion revokes sessions, the UI signs out, and a new TOTP is required after re-login. Protected server account APIs reject incomplete AAL2. Provider-level behavior is unverified in this environment; native Supabase recovery-code APIs are experimental and a separate possible future migration.
- Added global/per-username limiter keys that cannot be evaded via spoofed `x-forwarded-for`. Deployment may opt into a proxy-overwritten trusted header; no header trusted by default. Username-to-email lookup still returns a known user's email, so enumeration is **not fully fixed** and remains P0.
- Added opt-in dedicated-database integration test (skipped: no test DB credentials), read-only staging health script (skipped: no staging origin) and optional hourly Vercel production cron configuration (not deployed). See `docs/p0-staging-runbook.md` for an ordered rollout without production destructive checks.
- Post-change verification: `pnpm lint` PASS, `pnpm typecheck` PASS, `pnpm test` **40/40 pass** (zero skipped), `pnpm build` PASS (39/39 static pages); `pnpm test:integration` **0/1 run, 1 skipped**; `pnpm check:staging` skipped. No live Supabase deletion, real database transaction or deployment was executed.

## 2026-09-25 Celestia main TEST database rollout (latest verification)

- **Environment:** The owner explicitly confirmed the existing `celestia` Supabase main project is test-only. No separate staging project was required. The local Supabase URL and `DIRECT_URL` project identities matched; credentials were not printed or committed.
- **Preflight:** `prisma migrate diff` showed that the existing modeled schema lacked only `account_deletions` and its indexes. Read-only catalog checks confirmed existing username/chat triggers, functions, chat RLS policies and primary/foreign keys. Fourteen historical SQL-only CHECK constraints were missing, and all affected tables had zero rows violating their intended constraints.
- **Migration reconciliation:** Marked the 12 existing migrations through `202607140003_notifications` applied, then deployed `202609250001_pending_account_deletions`, `202609250002_account_deletion_lease` and new `202609250003_reconcile_legacy_checks`. All **15/15 migrations** now register as applied. The new ledger has RLS and its two secondary indexes; **all 14 restored CHECK constraints are present and validated**. Added `@default(now())` to the Prisma `updatedAt` property to match the database; subsequent `prisma migrate diff` reported **no difference**.
- **Actual database acceptance:** Expanded the integration-test opt-in to allow only a specifically acknowledged test-only main project whose ref matches the configured Supabase URL and direct database URL. The PostgreSQL fixture test **passed 1/1**, proving simultaneous claims are exclusive, failed transactions roll back and expired leases can be retaken. The test created and deleted only its own random database fixture; it did not call Supabase Auth or delete the existing account.
- **Local gates:** `pnpm typecheck`, `pnpm lint`, `pnpm test` (**43/43**) and `pnpm build` (**40/40 generated static pages**) pass. The configured main test project is not evidence of a deployed application or functional health endpoint.
- **Provider access verification (2026-09-25):** Read-only Supabase Admin API probes against the configured main test project now return HTTP **200** for Auth user listing and Storage bucket listing. The configured `SUPABASE_SERVICE_ROLE_KEY` is accepted for this exact `NEXT_PUBLIC_SUPABASE_URL` project without exposing its value. This clears the previous 401/403 access blocker; do not treat it as proof of real Auth deletion, Storage failure recovery or MFA factor reset.
- **Remaining P0 acceptance:** Supabase Auth deletion and failure recovery, real MFA factor reset and session revocation, live username endpoint/provider/browser acceptance, external Storage retries, in-flight mutations, live health/error browser checks, Redis integration, deployed cron secrets/scheduling and monitoring remain open. Do not present real PostgreSQL fixture acceptance as full cross-service deletion acceptance.
