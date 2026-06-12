# Portfolio Website

Modern, dark-mode-first portfolio website with blog functionality for **Rajat Kumar R**, live at [rajatkumarr.com](https://www.rajatkumarr.com). A single Next.js app with Payload CMS embedded — no separate backend.

## Tech Stack

| Layer | Technology |
|-------|------------|
| App | Next.js 16 (App Router), TypeScript |
| CMS | Payload 3 (embedded — admin at `/admin`) |
| Database | Neon Postgres (prod, via Vercel Marketplace) / Dockerized Postgres (dev) |
| Media | Vercel Blob (prod) / local disk (dev) |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Animations | Framer Motion, Lenis (smooth scroll) |
| Email | Resend |
| Hosting | Vercel (everything) |

## Prerequisites

- **Node.js** v24 LTS (even versions only)
- **Docker** (for the local dev database)

## Local Development

```bash
# one-time: local Postgres for Payload
docker run -d --name portfolio-payload-pg -p 5434:5432 \
  -e POSTGRES_USER=payload -e POSTGRES_PASSWORD=payload -e POSTGRES_DB=payload \
  postgres:16-alpine

cd frontend
npm install
npm run dev          # site on :3000, admin on :3000/admin
```

Required `frontend/.env.local`:

```env
PAYLOAD_SECRET=<random>
DATABASE_URI=postgresql://payload:payload@localhost:5434/payload
NEXT_PUBLIC_SITE_URL=http://localhost:3000
RESEND_API_KEY=
CONTACT_EMAIL=
```

In dev the database schema syncs automatically (drizzle push). Seed content with `curl -X POST http://localhost:3000/api/dev-import` (idempotent; dev-only route).

## Production

Deploys automatically on push to `master`. The Vercel Build Command is `npm run ci`, which runs committed migrations (`frontend/src/migrations/`) against Neon before building. Schema changes need a migration — `migrate:create` requires Linux/CI (drizzle codegen breaks under the CLI's tsx loader in some setups); a raw-SQL migration is a fine alternative, see `src/migrations/20260612_000000_initial.ts`.

Production env (managed on Vercel): `DATABASE_URL`* (auto-injected by the Neon integration), `BLOB_READ_WRITE_TOKEN` (auto-injected by the Blob store), `PAYLOAD_SECRET`, `NEXT_PUBLIC_SITE_URL`, `RESEND_API_KEY`, `CONTACT_EMAIL`.

## Content Model

Collections: `projects`, `blog-posts`, `categories`, `media`, `users` · Globals: `about`, `site-settings`. Defined in `frontend/src/payload/`; long-form content is Markdown rendered with `react-markdown`.

## Pages

| Route | Description |
|-------|-------------|
| `/` | Home - Hero, Skills, Featured projects, Latest posts |
| `/about` | Bio, Experience timeline, Skills grid |
| `/projects` | Projects with category filters |
| `/projects/[slug]` | Project detail/case study |
| `/blog` | Blog listing with filters |
| `/blog/[slug]` | Article with reading progress |
| `/contact` | Contact form |
| `/admin` | Payload admin panel |

## License

MIT
