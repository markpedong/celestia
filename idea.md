# Celestia Signals — Hermes Build Brief

## Product idea

Celestia should become a high-signal community network for technology, space, science, gaming, and culture.

The differentiator is **Signal Threads**: discussions that make it easy to understand what happened, why it matters, what evidence supports it, and what the community thinks. Celestia should feel more thoughtful than a generic social feed without becoming a slow, formal publishing platform.

The core loop is:

1. Discover a signal from a public feed, community, search result, or profile.
2. Understand it quickly through a clear summary, source, topic, and context.
3. Contribute through comments, votes, links, images, or a poll.
4. Save or follow the discussion and return when the signal changes.

## Current repository context

This is an existing Next.js App Router application using React, TypeScript, Prisma, Supabase Postgres/Auth/Storage, TanStack Query, Zod, Tailwind, Sass, Radix/shadcn-compatible components, and Redis-backed caching/rate limiting.

Already implemented in the current checkout:

- Public Hot, Latest, Top, Rising, Controversial, Explore, community, post, search, and profile pages.
- Authenticated posting, editing, deletion, voting, threaded comments, community joining, profile settings, saved/hidden/followed/muted actions, reports, notifications, and chat.
- Community creation and owner settings, media uploads, responsive layouts, SEO metadata, sitemap, robots, manifest, and social previews.
- Server-side validation and authorization on the implemented mutation paths, Prisma migrations, Supabase RLS/storage setup, and a small automated test suite.

Important existing paths to understand before changing anything:

- `app/(public)/` — public discovery, feed, search, post, community, and profile pages.
- `app/(authenticated)/` — posting, saved/hidden content, profile, account settings, and community management.
- `app/api/` — posts, comments, votes, communities, chat, notifications, content actions, reports, images, and user APIs.
- `services/index.ts` — the client-facing service abstraction for API mutations and queries.
- `lib/db/` — Prisma-backed query and mutation logic.
- `components/feed/`, `components/post/`, `components/community/`, `components/chat/`, and `components/ui/` — reusable UI and interaction layers.
- `prisma/schema.prisma` and `prisma/migrations/` — the authoritative application data model and migration history.
- `CELESTIA_IMPLEMENTATION_STATUS.md` — current implementation status and explicitly deferred Reddit-parity scope.

Do not assume that a schema model, route, or UI control is complete without tracing its actual call path.

## Recommended v2 direction

Build the first complete Signal Thread vertical slice. Keep the existing Post model and feed architecture as the foundation; extend them only where the new product behavior requires it.

### 1. Signal-aware posts

Add an optional post format and metadata layer:

- `discussion` — open-ended conversation.
- `link` — an external source with normalized URL, domain, title, and preview metadata.
- `question` — a focused question with an answer-oriented discussion.
- `poll` — a question with selectable options and a closing time.
- Optional source URL, source name, topic tags, and a short author summary.
- Optional states such as `open`, `resolved`, `updated`, or `archived` where they improve clarity.

The default creation flow should remain simple. Do not force every post to become a structured research form.

### 2. Better reading and context

On a Signal Thread, make the useful context visible without overwhelming the reader:

- Clear post type badge and source/domain treatment.
- Compact “what this is about” summary area.
- Link preview with safe, allowlisted remote metadata handling.
- Markdown-like text formatting only if it can be rendered and sanitized safely.
- Mentions and topic links only after their server-side parsing and authorization behavior is defined.
- Existing threaded comments, votes, saves, shares, reports, and related navigation should remain first-class.

### 3. Community governance before growth features

Turn community settings into a reliable foundation for signal quality:

- Owner plus moderator roles with explicit permissions.
- Community rules displayed during posting and on the community page.
- Private/restricted communities and join requests.
- Removal, lock, archive, and moderation-log actions.
- A clear report queue that records the reviewer and action taken.
- No fake moderation controls: every visible action must have a real API, authorization check, persistence path, and user-facing result.

### 4. Personalized discovery

Use existing feed ranking and content-action data to create a useful home feed:

- Followed communities and topics.
- A “For You” feed that combines recency, votes, discussion quality, follows, hides, and mutes.
- A separate “Following” feed that is predictable and chronological.
- Cursor-based pagination for feeds and search where the current offset model becomes a bottleneck.
- Transparent sort labels so users understand why a post appears.

Do not introduce opaque AI ranking as the first version. Start with explainable server-side ranking and measurable signals.

### 5. Return-worthy updates

Extend the existing notifications and chat/inbox foundation with notification preferences and signal updates:

- Replies, mentions, follows, poll closing, source updates, and moderator actions.
- Per-user controls for email/in-app frequency and muted communities/topics.
