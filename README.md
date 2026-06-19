# Celestia

Celestia is a cosmic community forum for discovering signals, sharing posts, voting on ideas, and joining threaded conversations across technology, space, science, gaming, and more.

## Features

- Community feed with Hot, New, and Top sorting
- Post search and topic filtering
- Threaded comments for deeper discussions
- Upvotes and downvotes for posts and comments
- Authenticated posting with Neon Auth
- Responsive dark and light visual theme

## Tech Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS 4 and Sass
- Prisma 7
- Neon Postgres and Neon Auth

## Getting Started

Install dependencies:

```bash
npm install
```

Create a local `.env` file with the required connection values:

```bash
DATABASE_URL="postgresql://..."
NEON_AUTH_BASE_URL="https://..."
NEON_AUTH_COOKIES_SECRET="..."
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
```

Push the Prisma schema and generate the client:

```bash
npm run db:push
```

Seed the database with starter content:

```bash
npm run db:seed
```

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Scripts

- `npm run dev` starts the local development server.
- `npm run build` pushes the database schema, generates Prisma, and builds the app.
- `npm run start` serves the production build.
- `npm run lint` runs ESLint.
- `npm run db:push` applies the Prisma schema and generates the Prisma client.
- `npm run db:seed` seeds starter content.

## Branding

The app metadata uses the Celestia logo preview from `public/images/celestia-reference.png`. Browser and app icons are generated from `app/icon.svg`, with favicon and Apple touch variants stored in `app/favicon.ico` and `app/apple-icon.png`.
