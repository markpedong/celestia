# Celestia Implementation Roadmap — Reconciled 2026-09-25

**Source of truth:** `docs/celestia-feature-audit.md` (re-audited working tree, not the original September 24 percentages). **HEAD:** `496e7d8fd8f036fdb5a579f09e72f57dd8285e5e`; current feature counts: COMPLETE 3, PARTIAL 17, BROKEN 0, MISSING 21, UNVERIFIED 34, NOT APPLICABLE 0 (75 unique items).

## Release decisions and statuses

**P0 is a release gate, not proof of a defect already exploited.** The current checkout passes typecheck/lint/27 pure tests/build. Staging migration, account-deletion failure recovery, MFA backup-code assurance semantics and trusted caller rate limits remain unresolved. No application source was changed by the audit.

### P0 — Data loss, critical trust and deployment blockers

| Order | Task / current state | Files / dependencies | Acceptance criteria and required tests |
|---|---|---|---|
| P0.1 | **PARTIAL**: Stage and prove recoverable account deletion | `prisma/migrations/202609250001_pending_account_deletions/migration.sql`, `lib/server/account-deletion.ts`, `lib/actions/security.ts`, `app/api/internal/account-deletions/route.ts`; depends on disposable staging DB/Supabase and reviewed migration | Apply migration in staging; real Auth/Prisma/Storage injected failure matrix; concurrent cron is single-owned or idempotent under races; late writes rejected/cleaned; community media policy documented; storage retry survives outage; scheduler+CRON_SECRET+alert on failed counts verified. Never run destructive production tests. |
| P0.2 | **PARTIAL**: Establish safe MFA backup recovery | `lib/actions/security.ts`, `hooks/use-auth-form.ts`, `proxy.ts`, account-settings sensitive actions; depends on supported Supabase AAL2 recovery mechanism | Do not represent consumed backup code as upgraded AAL2. Provide a supported recovery/re-enrollment design; verify fresh TOTP, backup-code reuse rejection, protection of sensitive routes, expired sessions, fallback and live Supabase session behavior. |
| P0.3 | **PARTIAL**: Harden sensitive auth lookup identity and limits | `app/api/auth/username/route.ts`, `lib/server/rate-limit.ts`, `proxy.ts`; depends on trusted reverse-proxy topology | Derive stable unspoofable client identity, mitigate username→email enumeration, verify Redis-down fail closed at endpoint, test forwarded-header injection and throttling. |
| P0.4 | **UNVERIFIED**: Validate deployment health and error recovery | `app/api/health/route.ts`, `lib/server/health.ts`, `app/global-error.tsx`, `app/(public)/error.tsx`, `app/(authenticated)/error.tsx`; depends on staging infrastructure | Real liveness unaffected by dependent outage; readiness 503 for mandatory dependency and degraded cache per policy; crash/reset works on mobile and desktop; opaque production logging and alerts established. |

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

- Prior P0 vote target and username rate-limit fixes were implemented in uncommitted source, but both remain PARTIAL pending contract and endpoint-level tests.
- Historical Prisma-first deletion reorder was unsafe; **superseded** by durable Auth-first recovery. Pure failure-injection tests pass (7), but no claim of distributed atomicity or deployed acceptance.
- Prior Phase 1 hover actions, error boundaries and liveness/readiness paths exist and their respective pure tests pass (3/2/6); real browser and staging acceptance stays UNVERIFIED/PARTIAL as indicated in audit.
- Current recorded verification: `pnpm typecheck` PASS; `pnpm lint` PASS; `pnpm test` **27/27 PASS** with zero skipped; `pnpm build` PASS (39/39 static pages). Integration/E2E absent; no migration, production deletion or deployment probe executed.

## Next implementation phase

**First stage the P0 release gate**, focusing on deletion migration + isolation/lease/reconciler scheduling, backup-code AAL2 semantics and endpoint-level sensitive-auth throttling. Only then implement P1 blocking, safe moderation, joined feed and reliable cursor pagination. Maintain one row per acceptance feature and reconcile audit counts from the inventory at each milestone. Preserve history instead of marking tests or deployment completed merely because a handler exists.
