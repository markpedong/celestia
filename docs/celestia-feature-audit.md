# Celestia Current Feature Re-Audit

**Audit date:** 2026-09-25 (Asia/Manila)  
**Baseline:** branch `main`, HEAD `496e7d8fd8f036fdb5a579f09e72f57dd8285e5e`; actual working tree, including uncommitted and untracked changes, is the source of truth.  
**Scope:** read-only source inspection and safe local verification. Only this audit and the roadmap were edited. No production data or account was changed.  
**Classification:** COMPLETE requires suitable automated evidence; UNVERIFIED means an implementation was located but end-to-end acceptance is not established; PARTIAL means a demonstrable implementation/requirements gap; MISSING means required functionality not present; BROKEN requires a reproduced failure, not speculation.

## Executive summary

| Status | Count |
|---|---:|
| COMPLETE | 3 |
| PARTIAL | 17 |
| BROKEN | 0 |
| MISSING | 21 |
| UNVERIFIED | 34 |
| NOT APPLICABLE | 0 |
| **Total independently inventoried features** | **75** |

Counts are calculated once from the individual unique rows below, rather than inherited from the outdated September 24 audit. The original document previously claimed 62 complete / 16 partial / 40 missing based largely on code inspection; that historical scoring is superseded. No live production or browser acceptance is claimed.

### Repository state and verified architecture

- The checkout began with **31 changed/untracked entries**. Modified tracked code: `app/api/auth/username/route.ts`, `app/api/votes/route.ts`, `components/feed/author-hover-card.tsx`, `hooks/useQueries.ts`, `lib/actions/security.ts`, `lib/server/rate-limit.ts`, `lib/server/redis.ts`, `prisma/schema.prisma`, `proxy.ts`. The two documentation files were untracked at audit start. Other untracked work includes deletion ledger/migration, internal reconciler, health, boundaries, tests, lockfile and workspace settings; preserve all.
- HEAD `496e7d8fd8f036fdb5a579f09e72f57dd8285e5e` (latest committed work dated 2026-07-14). Current uncommitted additions cannot be attributed to a newer Git commit. Compare `git diff` **and** untracked files before claiming a change is committed.
- Next.js **16.2.6** App Router / React **19.2.4** / TypeScript 5 / Tailwind 4 / Radix/shadcn; PostgreSQL with Prisma declared **^7.8.0**, locally installed/generated **7.10.0**; Supabase SSR Auth, Storage, and Realtime; TanStack Query 5; Upstash Redis; Sharp image transforms; Zod 4. `package-lock.json` tracked, `pnpm-lock.yaml` untracked.
- Data flow: server-rendered feeds call `lib/db/*.queries.ts`; client mutations use `hooks/useQueries.ts` and `services/index.ts`; `app/api/**/route.ts` checks session/validation and writes Prisma; `proxy.ts` applies request origin and session behavior; Supabase Admin performs Auth and Storage operations. Only account deletion uses an independent persisted recovery ledger.

## Exact verification executed

| Command | Result | Limitations |
|---|---|---|
| `pnpm typecheck` | PASS, `tsc --noEmit` | Static typing only |
| `pnpm lint` | PASS, `eslint` | Static lint only |
| `pnpm test` | **27 pass, 0 fail, 0 skipped, 0 todo** | Tests are pure unit/SSR smoke/failure-injection; no real Prisma/Supabase integration |
| `pnpm build` | PASS, Prisma client generated and Next.js 16.2.6 compiled; **39/39 static pages** generated | Does not prove live HTTP/service health or browser behavior |
| `pnpm list prisma @prisma/client --depth 0` | Both installed at 7.10.0 | Package specification is ^7.8.0; generated client matches installed |
| Integration/E2E | NOT RUN: no integration/E2E suite located | Staging credentials and disposable database/service harness not provided |
| Deployment/migration/cron | NOT RUN (safety) | Cannot assume migration applied or reconciliation scheduled |

**Important:** `pnpm build` runs `prisma generate` and writes build/generated artifacts; source-code fixes were not made. Tests did not contact or delete real accounts. No dependency was installed for this audit.

## Independently inspected prior fixes

| Previously claimed fix | Current status | Direct evidence | Test evidence and remaining acceptance |
|---|---|---|---|
| Cross-post vote validation | PARTIAL | `app/api/votes/route.ts` fetches actual comment `postID` and rejects a *supplied* mismatch | No dedicated route test. Missing `postID` is accepted; require/derive canonical target contract and test invalid, absent, cross-post and legitimate requests |
| Sensitive auth rate-limit fail-close | PARTIAL | `app/api/auth/username/route.ts` passes `{failOpen:false}` to `checkRateLimit` | 3 unit tests pass; endpoint-level Redis outage, forwarded-header provenance and account enumeration behavior remain |
| Account-deletion durable stages | PARTIAL | `lib/account-deletion.ts`, `lib/server/account-deletion.ts`; independent `AccountDeletion` model and migration; Auth before Prisma cleanup, cleanup+status in a Prisma transaction, storage separately retried | 7 injected orchestration tests pass. No cross-system atomicity; live transaction failure, racing write, concurrent cron, migration, actual Supabase Auth/Storage, recovery after sign-out and scheduling unverified |
| Chat participant cleanup | UNVERIFIED | Explicit `tx.chatParticipant.deleteMany({where:{userID}})` and `ChatParticipant.user` onDelete Cascade | No real FK/integration test; ensure group conversations and direct messages behave appropriately after deletion |
| Author hover Follow | UNVERIFIED | `author-hover-card.tsx` calls existing `useContentAction`; guest/self/loading/error UI present | 3 pure state tests, but no browser/API test for follow/unfollow, rollback and session transitions |
| Author hover Start Chat | UNVERIFIED | `author-hover-card.tsx` calls `useStartDirectConversation`, existing API uses directKey upsert | State tests only; check success event/navigation, duplicate clicks, failures, keyboard/mobile |
| Global and route boundaries | UNVERIFIED | `app/global-error.tsx`, both route-group `error.tsx` and shared `RouteError` | 2 SSR fallback tests; crash/retry, shell styles and meaningful production telemetry unverified |
| Health and readiness | PARTIAL | `/api/health?probe=live` skips deps; default readiness probes DB and Auth, optionally Redis; generic JSON and 503 on mandatory failure | 6 pure injected tests pass; live HTTP during dependency outage and deployment monitoring not verified |
| MFA backup-code behavior | PARTIAL | `verifyBackupCodeAction` atomically consumes code; `submitBackupCode` redirects after success | Supabase session AAL2 is **not** upgraded by this step; protect sensitive actions consistently; real recovery flow untested |

## Newly identified risk and acceptance gaps

1. **P0 release gate: deletion retry correctness.** The ledger is independent of deleted `Users`, and successful Auth confirmation precedes app cleanup. Yet concurrent `processAccountDeletion` invocations have no lease/claim guard; writes during deletion can reintroduce data or media; storage manifest covers *user profile and post* media but not owned community avatar/cover media; final storage cleanup is external and retryable, not atomic. Test concurrency, late writes, orphaned files, migration rollout and post-deletion cache invalidation against disposable services.
2. **P0/P1 MFA recovery semantics.** A valid backup code is marked used and client navigates to `/`, but it does not achieve AAL2. Clearly differentiate proving backup-code possession from changing Supabase's assurance; do not claim full second-factor recovery for protected operations.
3. **P1 auth-enumeration/rate-limit provenance.** Username lookup reveals an email for a valid username and uses the first caller-supplied `x-forwarded-for` element for a 30/min fail-closed limit. Validate trusted proxy forwarding, return appropriate non-enumerating behavior and test real Redis unavailability.
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
| Username login lookup | **PARTIAL** | `app/api/auth/username/route.ts`, `lib/server/rate-limit.ts` | Fail-closed Redis verified in unit test; trust of forwarded IP and response email disclosure require hardening |
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
| Sensitive username fail-close | **PARTIAL** | `lib/server/rate-limit.ts`, `app/api/auth/username/route.ts`, `tests/rate-limit.test.ts` | 3 unit tests; forwarded IP provenance and Redis outage endpoint test missing |
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
| Unit/smoke suite | **COMPLETE** | `tests/*.test.ts`, `package.json` | pnpm test 27/27 pass, zero skipped |
| Typecheck and lint gates | **COMPLETE** | `package.json`, `tsconfig.json`, `eslint.config.mjs` | pnpm typecheck and pnpm lint pass |
| Production compilation | **COMPLETE** | `package.json`, `next.config.ts` | pnpm build pass with 39 static pages generated |
| Database/API integration suite | **MISSING** | `tests/` | No real-test-DB API tests |
| Browser E2E suite | **MISSING** | `tests/` | No Playwright/browser automation present |
| Production telemetry and reconciler scheduling | **MISSING** | `app/api/internal/account-deletions/route.ts`, `README.md` | Endpoint exists but no verified schedule/alerts/deployed service |

## External and manual verification still required

Use disposable staging credentials, seed fixtures and explicit authorization; do not run production deletion tests. Apply the migration first in staging; verify account-request persist failure, failed/ambiguous Auth delete, successful Auth followed by crash, transaction rollback, simultaneous reconciler requests, delayed uploads, partial storage removal and recovery after losing the browser session. Exercise real GET health endpoints during Auth/DB/Redis outages; verify Supabase bucket rules and server image permissions. In a browser, test both hover actions across guests/self/signed-in users, injected client errors and reset, MFA TOTP/backup-code assurance transitions, mobile tap/keyboard/reader accessibility, realtime messages, all principal API resource-authorization paths, and cache freshness after edits/deletion. Inspect cloud scheduler, migrations, monitoring and deployed secrets without disclosing their values.

## Prior-audit history (preserved)

- **2026-09-24**: initial feature audit and P0 vote/rate-limit fixes; baseline totals `62 complete / 16 partial / 0 broken / 40 missing` were based heavily on inspection and are **not** current verified acceptance figures.
- **2026-09-25**: P0.1 hover actions, P0.2 boundaries, P0.3 health and persisted, staged deletion were introduced in the *uncommitted checkout*. Locally the suite grew to 27 and compile/lint/build passed. This re-audit separates those implemented code paths from unperformed browser, database, provider and deployment acceptance.
- Historical Prisma-first deletion reorder is **superseded** by persisted Auth-first staged cleanup; any historical lost application data is not reconstructed by the new ledger.
