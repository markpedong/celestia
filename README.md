# Celestia

Celestia is a modern community forum for discovering signals, sharing posts, voting on ideas, and joining threaded conversations across technology, space, science, gaming, and culture.

Built with the Next.js App Router, Supabase, Prisma, and React, Celestia is designed as a polished client-ready social platform: public discovery pages are crawlable, authenticated flows are protected, and community content is organized around posts, votes, replies, profiles, and topic spaces.

## Highlights

- Public feeds for Hot, Latest, Top, Explore, community, post, and profile pages.
- Authenticated posting, voting, commenting, community joining, and profile management.
- Threaded comments with nested context for longer discussions.
- Community creation and management with avatars, cover images, descriptions, stats, and member controls.
- User profiles with activity, karma, posts, comments, votes, avatar, cover image, and bio.
- Account settings for password, MFA, backup codes, sensitive settings, and account deletion.
- Responsive light and dark UI with reusable component modules.
- SEO-ready metadata, sitemap, robots rules, manifest, icons, and social preview images.

## Tech Stack

- Next.js 16 App Router
- React 19 and TypeScript
- Tailwind CSS 4 and Sass
- Prisma 7
- Supabase Postgres, Auth, and Storage
- TanStack Query
- Radix UI, lucide-react, framer-motion, and shadcn-compatible components

## Getting Started

Install dependencies:

```bash
npm install
```

Create `.env.local` from the example file:

```bash
cp .env.example .env.local
```

Fill in the Supabase and database values:

```bash
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."
NEXT_PUBLIC_SUPABASE_URL="https://PROJECT_REF.supabase.co"
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="..."
SUPABASE_SERVICE_ROLE_KEY="..."
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
```

Apply the database schema, generate Prisma, and apply Supabase policies:

```bash
npm run db:push
```

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

- `npm run dev` - generate Prisma and start the local Next.js server.
- `npm run build` - push the database schema, generate Prisma, and build the production app.
- `npm run start` - serve the production build.
- `npm run lint` - run ESLint.
- `npm run db:push` - apply Prisma schema changes, generate Prisma, and apply Supabase RLS.
- `npm run db:reset` - reset local data, auth users, storage, and policies.

## SEO

Celestia includes the core assets needed for search and social sharing:

- Global metadata in `app/layout.tsx`.
- Dynamic route metadata for communities, posts, and profiles.
- Static route metadata for Home, Explore, Latest Posts, and Top Posts.
- `app/sitemap.ts` for `/sitemap.xml`.
- `app/robots.ts` for `/robots.txt`.
- `app/manifest.ts` for `/manifest.webmanifest`.
- App icons in `app/icon.svg`, `app/favicon.ico`, and `app/apple-icon.png`.
- Default social preview image at `public/images/celestia-reference.png`.

Before deploying, set `NEXT_PUBLIC_SITE_URL` to the production domain so canonical links, sitemap URLs, and social previews resolve correctly.

## Client Demo

Use `CLIENT_HANDOFF.md` for a presentation checklist, production readiness notes, and client talking points. Use `SEO_CHECKLIST.md` for launch-specific SEO verification.

Suggested demo flow:

1. Show the home feed and sort tabs.
2. Open Explore and navigate into a community.
3. Open a post and review voting, comments, and image handling.
4. Sign in and create a post.
5. Show profile, account settings, and community management.
6. Resize to mobile width to demonstrate responsive navigation.

## Deployment Notes

- Configure Supabase Auth redirect URLs for local and production domains.
- Ensure storage buckets and row-level security policies are applied before client review.
- Use production-approved content and images before submitting the sitemap.
- Run `npm run lint` and `npm run build` before delivery.

## Project Structure

```text
app/          Next.js routes, layouts, metadata, sitemap, robots, and manifest
components/   Reusable UI, feed, post, profile, community, auth, and layout components
lib/          Data access, Supabase clients, Prisma helpers, SEO helpers, and utilities
prisma/       Database schema and migrations
public/       Static public assets
scripts/      Supabase setup, reset, storage, and policy scripts
```
