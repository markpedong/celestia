# Client Handoff

## Project Snapshot

Celestia is a responsive community forum built with Next.js, React, Prisma, and Supabase. It supports public browsing, authenticated posting, threaded replies, voting, community pages, profile pages, media uploads, and account settings.

## Demo Checklist

- Open the home feed and switch between Hot, New, and Top views.
- Search or browse communities from Explore.
- Open a community page and review the cover, profile image, description, stats, and feed.
- Open a post page and show voting, media gallery, comments, and related navigation.
- Sign in or create an account, then create a post inside a joined community.
- Visit profile and settings pages to show avatar, bio, account, password, MFA, and community management flows.
- Test responsive behavior on desktop and mobile widths.

## Production Readiness

- Set `NEXT_PUBLIC_SITE_URL` to the final public domain before deployment.
- Confirm Supabase Auth redirect URLs include the production domain and local development URL.
- Confirm Supabase storage buckets and row-level security policies are applied with `npm run db:push`.
- Replace placeholder seed/demo content with approved client content.
- Submit `/sitemap.xml` in Google Search Console after launch.
- Test social previews with the production URL after deployment.

## Useful URLs

- `/` - Hot community feed
- `/explore` - Community discovery
- `/posts` - Latest posts
- `/top` - Top posts
- `/r/[slug]` - Community detail page
- `/post/[id]` - Post detail page
- `/u/[username]` - Public profile page
- `/sitemap.xml` - Search engine sitemap
- `/robots.txt` - Crawler rules
- `/manifest.webmanifest` - App manifest

## Recommended Client Talking Points

- Modern App Router architecture with route-level SEO metadata.
- Supabase-backed authentication, database, and storage.
- Prisma-managed schema and typed data access.
- Public pages are crawlable and shareable with Open Graph and Twitter card previews.
- Responsive UI supports discovery, reading, posting, commenting, voting, and account management.
