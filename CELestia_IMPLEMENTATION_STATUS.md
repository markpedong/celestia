# Celestia implementation status

Audit date: 2026-07-14

Status meanings: **Working** is implemented end to end in the current repository; **Partial** has a usable core but important gaps; **Broken** has a correctness or security defect; **Missing** has no implementation; **Obsolete/duplicated** should be removed or consolidated.

## Current implementation result

The tables in this section describe the repository after the 2026-07-14 implementation pass. The longer audit below is retained as the pre-implementation snapshot that drove the work.

| Area | Current status | Delivered implementation | Primary files |
| --- | --- | --- | --- |
| Registration and OAuth callback | Working | Confirmed-email sign-up now exchanges its code through the callback, creates the Prisma profile without relying on public RLS writes, reserves collision-safe usernames, and updates linked identities without overwriting an existing avatar. Username sign-in has validation and rate limiting. | `hooks/use-auth-form.ts`, `app/auth/callback/route.ts`, `app/api/auth/username/route.ts` |
| Votes | Working | Post and comment votes use desired-state values `-1/0/1`, an idempotent transactional server mutation, authoritative score responses, authenticated SSR hydration, and a reconciler that converges rapid input to the latest intent. Invalid legacy vote values are repaired and database checks prevent recurrence. | `lib/db/vote.queries.ts`, `app/api/votes/route.ts`, `components/providers/vote-provider.tsx`, `lib/vote-reconciliation.ts`, migration `202607140001_harden_comments_votes` |
| Comments | Working core | Arbitrary-depth replies are retained. Comment creation is schema-validated; authors can edit and soft-delete; deleted/edited presentation, saves, reports, permalinks, viewer votes, reply/post notifications, and confirmation UI are connected end to end. | `app/api/comments/route.ts`, `components/post/comment-node.tsx`, `lib/comment-tree.ts`, `lib/db/comment.queries.ts` |
| Feeds and ranking | Working core | Ranking runs over the full eligible set in PostgreSQL rather than sorting only the newest 50. Hot, New, Top, Rising, and Controversial work; Top and Controversial accept hour/day/week/month/year/all windows. Hidden posts and muted communities are excluded from aggregate feeds. Authenticated responses are never placed in the shared feed cache. | `lib/db/post.queries.ts`, `components/feed/feed-sort-tabs.tsx`, `components/feed/feed-time-filter.tsx`, feed pages, `lib/server/feed-cache.ts` |
| Search | Working | Dedicated `/search` results cover posts, comments, communities, and people with safe highlighting, optional community scope, per-type tabs, and 20-result server pagination. Navbar suggestions and recent searches remain, and searches launched from a community carry its scope. | `app/(public)/search/page.tsx`, `lib/db/search.queries.ts`, `components/layout/search-box.tsx`, `app/api/search/suggestions/route.ts` |
| Saved, hidden, followed, muted | Working core | One constrained content-action model and API powers real save/hide/follow/mute controls. Saved and hidden pages are authenticated, follow creates a notification, and feed filters honor hidden/muted state. | `app/api/content-actions/route.ts`, `lib/db/content.queries.ts`, `components/ui/content-action-button.tsx`, `app/(authenticated)/saved`, `app/(authenticated)/hidden`, migration `202607140002_content_actions_reports` |
| Reports and owner moderation queue | Partial | Users can report posts, comments, and profiles. Community owners have a paginated queue and can approve or dismiss reports. Full moderator roles, bans, removals, locks, mod logs, and enforcement actions are not modeled. | `app/api/reports/route.ts`, `components/ui/report-button.tsx`, `components/community/community-reports-panel.tsx`, community settings pages |
| Notifications | Working core | Reply, post-comment, and follow notifications are stored, listed in the chat widget, counted as unread, linked to their target, and can be marked individually or all at once. Preferences, mention parsing, and community/moderator notification types remain future work. | `app/api/notifications/route.ts`, `components/chat/chat-widget.tsx`, comment/content-action APIs, migration `202607140003_notifications` |
| Chat | Working core | Direct and community chat retain authorization, realtime refresh, pagination, optimistic sends, and read state. Join creates community participation, leave revokes it, and unread counts are fetched in one query instead of an N+1 loop. | `lib/db/chat.queries.ts`, `app/api/chat/*`, `app/api/community/join/route.ts`, `components/chat/chat-widget.tsx` |
| Storage | Working | Upload URLs must use an allowed bucket and current-user prefix. Delete requests can remove only the current user's objects. Both custom-domain and legacy Supabase URLs parse safely. Post/account deletion performs best-effort owned-file cleanup. | `lib/storage.ts`, `app/api/images/route.ts`, post/community/profile APIs, `lib/actions/security.ts` |
| API and request security | Working core | Server Zod validation was added on touched mutations; write-heavy endpoints have Redis-backed, fail-open rate limits; cross-site mutation requests are rejected; remote image hosts are allowlisted. Moderator/private-community authorization awaits those data models. | `lib/server/rate-limit.ts`, `proxy.ts`, `next.config.ts`, API routes |
| Destructive/data cleanup | Working core | Post deletion has confirmation and removes polymorphic votes/actions/reports/notifications before cascade deletion. Account deletion also cleans application-owned relationships, transfers owned communities to no owner, and removes profile/post media best-effort. Auth and PostgreSQL cannot be made one atomic transaction, so an infrastructure failure between those systems remains recoverable operational risk. | `components/post/edit-post-form.tsx`, `app/api/posts/route.ts`, `lib/actions/security.ts` |
| Fake controls | Working | Share uses Web Share or clipboard fallback; save/hide/follow/mute/report/notification/delete controls now perform real actions. The decorative profile More menu was removed. | shared UI controls and post/comment/profile/chat components |
| Production operations | Working | `npm run build` generates Prisma and builds Next without mutating the database. `npm run db:deploy` applies migrations, regenerates Prisma, reapplies Supabase RLS, and verifies storage buckets. The previously pushed chat schema was baselined with `prisma migrate resolve` before deploying the three new migrations. | `package.json`, `prisma/migrations/*`, `scripts/*` |

## Verification performed

| Check | Result |
| --- | --- |
| `npm run typecheck` | Passed |
| `npm run lint` | Passed with no warnings |
| `npm test` | 4/4 passed: rapid vote reconciliation, storage ownership/custom-domain parsing, arbitrary comment nesting/orphans, server schema rejection |
| `npx prisma validate` | Passed |
| `npm run db:deploy` | Passed against the configured Supabase database; migrations `202607140001`, `202607140002`, and `202607140003` applied; RLS and buckets verified |
| `npm run build` | Passed; Next generated 55 pages and route handlers, including `/search`, `/rising`, `/controversial`, `/saved`, and `/hidden` |

## Remaining product scope

The implemented application is deployable and its existing core workflows are functional. These requested Reddit-parity systems remain explicit scope rather than being represented by fake UI:

- Private/restricted communities, join requests, approved users, moderator roles, granular permissions, bans, removals, locks, mod logs, modmail, community archive/delete, rules, requirements, and flair.
- Link, native video, poll, draft, scheduled, crosspost, NSFW/spoiler/OC, pinned and moderator-removed post types/states.
- Personalized/custom feeds, subscriptions-driven ranking, cursor/infinite pagination, browsing history, and per-user content/notification preferences.
- Markdown rendering, mentions, rich link previews, profile blocking, privacy controls, deactivation/anonymization policy, and full notification types.
- A Supabase-supported recovery mechanism that truly upgrades a backup-code session to AAL2. The custom backup-code consumer remains unsuitable as an MFA assurance upgrade and is not claimed as fixed.
- A realistic development seed and broader integration/E2E coverage for external Supabase Auth, Storage, realtime chat, and browser flows.

## Initial repository baseline (pre-implementation)

| Area | Status | Existing files | Audit notes |
| --- | --- | --- | --- |
| Application stack | Working | `package.json`, `app/layout.tsx`, `components/providers/query-provider.tsx`, `lib/prisma.ts`, `lib/supabase/*` | Next.js App Router, React, TypeScript, Prisma 7, Supabase Auth/Storage, React Query, Tailwind, shadcn/Radix and Zod are already integrated. |
| Database history | Partial | `prisma/schema.prisma`, `prisma/migrations/*` | Core social and chat tables have migrations. Application-owned author relations are absent for posts/comments/votes/memberships, and several requested systems have no models. |
| Development scripts | Partial | `package.json`, `scripts/*` | Lint, build, database reset, RLS and bucket setup exist. There is no test script or seed. The build script mutates the database through `db:push`, which is unsafe for a normal production build. |
| Baseline verification | Partial | `eslint.config.mjs`, `tsconfig.json` | ESLint and TypeScript pass. ESLint reports one non-blocking `<img>` warning in `components/dialogs/mfa-dialog.tsx`. No automated tests exist. |

## Initial feature audit (pre-implementation)

| Feature | Status | Existing files | Changes made | Database changes | Tests | Remaining issues |
| --- | --- | --- | --- | --- | --- | --- |
| Email/password registration and sign-in | Broken | `app/auth/[pathname]/page.tsx`, `components/auth/auth-methods.tsx`, `hooks/use-auth-form.ts`, `app/auth/callback/route.ts`, `app/api/auth/username/route.ts` | Pending | None | None | Confirmed-email registrations redirect around the code-exchange/profile-creation callback; username validation is inconsistent; username lookup has no rate limit. |
| Google/Apple OAuth | Partial | `hooks/use-auth-form.ts`, `app/auth/callback/route.ts`, `components/auth/account-settings.tsx` | Pending | None | None | Sign-in and link/unlink flows exist, but first-login username generation can collide and callback profile creation depends on restrictive Supabase RLS behavior. |
| OAuth linking/unlinking | Working | `components/auth/account-settings.tsx` | — | None | None | Prevents removal of the final available sign-in method. Provider availability still depends on Supabase configuration. |
| Sessions and route gates | Partial | `proxy.ts`, `lib/auth.ts`, `app/(authenticated)/layout.tsx`, authenticated pages | Pending | None | None | Pages perform server redirects, but the authenticated layout itself is only a public-layout wrapper; MFA assurance handling does not itself redirect or block lower-assurance access. |
| Password recovery | Working | `components/auth/password-recovery-form.tsx`, `app/auth/forgot-password/page.tsx`, `app/auth/update-password/page.tsx`, `app/auth/callback/route.ts`, `proxy.ts` | — | None | None | Recovery cookie limits the recovery session. |
| MFA and backup codes | Broken | `components/auth/account-settings.tsx`, `components/dialogs/mfa-dialog.tsx`, `components/dialogs/backup-codes.tsx`, `lib/actions/security.ts`, `hooks/use-auth-form.ts` | Pending | `backup_codes` | None | TOTP enrollment works, but consuming an application backup code does not upgrade the Supabase session to AAL2. |
| Passkeys | Partial | `lib/supabase/client.ts`, `components/auth/account-settings.tsx`, `hooks/use-auth-form.ts` | — | Supabase Auth-owned | None | Register/list/delete/sign-in exists and depends on Supabase experimental passkey support. No recovery-path test exists. |
| Public profiles, bio, avatar and cover | Partial | `app/(public)/u/[username]/page.tsx`, `components/profile/*`, `app/api/user/route.ts`, `app/api/images/route.ts` | Pending | `users` profile columns | None | Viewing/editing works. Replaced profile media is not deleted, and submitted storage URLs are not ownership-validated. |
| Karma and public activity | Partial | `lib/db/user.queries.ts`, `app/(public)/u/[username]/page.tsx`, `app/api/user/stats/route.ts` | Pending | Derived from `votes` | None | Post/comment totals work, but the main profile display omits comment karma and publicly reveals every user's vote history without a privacy control. |
| Account preferences/privacy/deactivation | Missing | `components/auth/account-settings.tsx` | — | None | None | Theme exists; privacy, notification/content preferences and deactivation do not. |
| Account deletion | Broken | `lib/actions/security.ts`, `components/dialogs/delete-account.tsx` | Pending | None | None | Deletes Auth before application data, can leave inconsistent state on failure, does not remove uploaded files, and hard-deletes authored content rather than applying an explicit anonymization policy. |
| Community creation | Partial | `components/community/create-community-form.tsx`, `app/api/community/route.ts`, `lib/form-schemas.ts` | Pending | `community`, `community_members` | None | Core creation and owner membership work. Server does not run the full validation schema and abandoned pre-uploads are not cleaned up. |
| Community join/leave | Broken | `components/community/community-membership-button.tsx`, `app/api/community/join/route.ts`, `hooks/useQueries.ts` | Pending | `community_members` | None | Unique membership prevents duplicates and owners cannot leave, but leaving does not revoke the user's existing community-chat participant row. |
| Community appearance/settings | Partial | `app/(authenticated)/settings/communities/[slug]/page.tsx`, `components/community/community-settings-panels.tsx`, `app/api/community/route.ts` | Pending | Existing community columns | None | Owner authorization exists. Clearing media and deleting replaced storage objects are incomplete; server validation is incomplete. |
| Community types, requests and approved users | Missing | None | — | None | None | Only public communities exist. |
| Moderators, roles, bans, mutes and mod log | Missing | Owner-only checks in `app/api/community/route.ts` and settings page | — | None | None | No moderator or enforcement model/API/UI exists. |
| Rules, requirements and flair | Missing | None | — | None | None | No schema or UI. |
| Community archive/delete | Missing | None | — | None | None | No schema or owner action. |
| Text/image/gallery posts | Partial | `components/post/submit-post-form.tsx`, `components/post/image-upload-field.tsx`, `app/api/posts/route.ts`, gallery components | Pending | `posts`, `post_tags` | None | Text and up-to-four-image posts work. Server title/body validation is incomplete and storage ownership is not verified. |
| Post edit/delete | Partial | `components/post/edit-post-form.tsx`, `components/auth/client-post-controls.tsx`, `app/api/posts/route.ts` | Pending | Existing tables | None | Author authorization exists and deletion cleans post images best-effort. No confirmation UI; edit accepts malformed server input. |
| Link/video/poll/draft/crosspost/flair posts | Missing | None | — | None | None | No data model or end-to-end flows. |
| Post NSFW/spoiler/OC/lock/pin/remove/report | Missing | None | — | None | None | No data model or moderation actions. |
| Share/copy link | Broken | `components/feed/post-card.tsx`, `components/auth/client-post-controls.tsx`, `components/post/comment-node.tsx` | Pending | None | None | Visible Share buttons are decorative. |
| Post votes and optimistic queue | Broken | `components/providers/vote-provider.tsx`, `components/feed/vote-buttons.tsx`, `app/api/votes/route.ts`, `lib/db/vote.queries.ts` | Pending | `votes` | None | Queueing exists, but the server API uses non-idempotent toggle semantics; retries, multiple tabs or interrupted reconciliation can store a vote different from the final intent. |
| Comment votes | Broken | Same voting files plus `components/post/comment-node.tsx` | Pending | `votes` | None | Same reconciliation defect as post voting. |
| Nested comments/replies/collapse/thread lines | Working | `lib/comment-tree.ts`, `components/post/comment-thread.tsx`, `components/post/comment-node.tsx`, related SCSS | — | `comments.parent_id` | None | Arbitrary-depth nesting, reply composer, collapse/expand and connection-line presentation exist. |
| Comment creation/optimistic UI | Partial | `app/api/comments/route.ts`, `hooks/useQueries.ts`, comment components | Pending | `comments` | None | Membership and parent/post checks exist. Server length validation and error rollback feedback need hardening. |
| Comment edit/delete/moderation/save/report/permalink | Missing | None | — | None | None | No end-to-end controls or routes. |
| Comment sorting | Partial | `components/post/comment-thread.tsx`, `lib/comment-tree.ts` | — | None | None | Best/top/new are client-side over the fully loaded tree; controversial and old are missing. |
| Home/latest/top/community feeds | Partial | feed pages, `components/feed/*`, `lib/db/post.queries.ts`, `app/api/posts/route.ts`, `app/api/community/feed/route.ts` | Pending | Existing indexes | None | Feeds work, but ranking sorts only the 50 newest database rows. Rising/controversial, time ranges, cursor pagination and infinite scrolling are missing. |
| Personalized/popular/all/custom feeds | Missing | None | — | None | None | Home is an all-community hot feed, not a joined/followed personalized feed. |
| Feed cache | Broken | `lib/server/feed-cache.ts`, posts/community feed API routes | Pending | Upstash external | None | Cache integration exists but caches viewer-specific `userVote` payloads. Redis is not configured in the current environment. |
| Search posts and communities | Partial | `components/layout/search-box.tsx`, `app/api/search/suggestions/route.ts`, `lib/db/search.queries.ts`, `lib/db/post.queries.ts` | — | Existing indexes only | None | Suggestions, recent searches and full post keyword filtering exist. Results have no pagination, highlighting, time filters or dedicated page. |
| Search users/comments | Missing | None | — | None | None | No APIs or result UI. |
| Direct and community chat | Partial | chat Prisma models/migration, `lib/db/chat.queries.ts`, chat API routes, `components/chat/chat-widget.tsx` | Pending | Chat tables and RLS | None | Direct/community conversations, authorization, unread state, optimistic sends, pagination and realtime invalidation exist. Community access is not revoked on leave and conversation unread counting is N+1. |
| Notifications | Missing | Disabled tab in `components/chat/chat-widget.tsx` | — | None | None | The visible tab is disabled; no model/API/preferences. |
| Modmail | Missing | None | — | None | None | No model/API/UI. |
| Saved/hidden/followed/muted/custom feeds/history | Missing | Disabled Follow in `components/auth/client-profile-controls.tsx` | — | None | None | Vote history exists; the requested convenience models and APIs do not. |
| Image validation/processing/upload limits | Partial | `app/api/images/route.ts`, `constants/index.ts`, `scripts/setup-supabase-storage.ts`, `lib/storage.ts` | Pending | Supabase Storage buckets | None | MIME/size/count validation, Sharp WebP processing, cache control and allowed buckets are correct. GIF animation is converted to animated WebP. |
| Custom file domain and old-file parsing | Working | `lib/storage.ts` | — | None | None | Both `files.ivory.atlascelestia.site` and the current Supabase public URL are parsed. |
| Storage authorization | Broken | `app/api/images/route.ts`, profile/community/post mutation routes | Pending | None | None | Any authenticated user can request deletion of another user's known object URL or attach another user's uploaded URL. |
| Markdown and sanitization | Missing | Plain-text rendering in post/comment components | — | None | None | Content is React-escaped plain text; Markdown, mentions and link metadata are absent. |
| Rate limiting | Missing | `lib/server/redis.ts` only | — | Upstash external | None | No request limiter is applied to auth lookup, votes, posting, comments, uploads, chat or community actions. |
| API input validation | Broken | API routes, `lib/form-schemas.ts` | Pending | None | Zod schemas exist for clients/forms but are not consistently enforced at server trust boundaries. |
| Private-resource authorization | Partial | chat query assertions/RLS, owner/author checks in API routes | Pending | Existing RLS | None | Chat IDOR checks are good. Moderator/private-community systems do not exist; image deletion has an IDOR defect. |
| Responsive/accessibility/loading/errors | Partial | existing pages/components/loading routes/SCSS | Pending | None | None | Core UI is responsive and many forms have labels/errors/loading states. Several client gates render blank while resolving; destructive post actions lack confirmation; fake controls remain. |
| SEO/PWA | Partial | `app/layout.tsx`, `app/sitemap.ts`, `app/robots.ts`, `app/manifest.ts`, metadata in public pages | — | None | None | Metadata, sitemap, robots, icons and manifest exist. `NEXT_PUBLIC_SITE_URL` is currently unset, so canonical URLs fall back to localhost. |
| Automated tests | Missing | None | Pending | None | None | No tests or test command. |

## Duplicated or obsolete implementation

| Item | Status | Files | Resolution |
| --- | --- | --- | --- |
| Profile settings schema | Duplicated | `lib/form-schemas.ts`, `hooks/useFormSchema.ts` | Keep the shared server-capable schema in `lib/form-schemas.ts`; remove the hook-local duplicate when touched. |
| Legacy community settings URL | Obsolete but harmless | `app/(authenticated)/r/[slug]/settings/page.tsx` | Keep as a redirect for old links. |
| Two image-upload presentations | Partial duplication | `components/post/image-upload-field.tsx`, `components/ui/image-uploader.tsx`, community upload forms | They serve gallery versus cropped-profile use cases; share server upload validation rather than forcing a UI rewrite. |
| GET/POST duplicates for read endpoints | Obsolete compatibility | community member/stats/feed routes | Prefer GET; retain POST only until all callers are verified and migrated. |

## Original implementation order

1. Correct trust-boundary validation, storage ownership, vote reconciliation, session vote hydration, cache privacy, community-chat revocation and registration callback defects.
2. Make existing visible controls real or remove them; add confirmations for destructive actions.
3. Correct server-side feed ranking/pagination and add the missing supported sort modes.
4. Add the missing data systems in safe migrations (saved/hidden/followed, notifications, reports and moderator permissions) before exposing UI.
5. Add built-in test coverage, production-safe database scripts, a seed, and run lint/type/build verification.

The current-result section at the top supersedes the `Pending` cells in this historical snapshot. “Missing” items are not represented as complete merely because a decorative control exists.
