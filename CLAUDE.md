# Portfolio Website

## Overview
Modern, dark-mode-first portfolio website with blog functionality for **Rajat Kumar R** - Software Architect & Developer. Live at https://www.rajatkumarr.com.

Single Next.js app with **Payload CMS embedded** (admin at `/admin`). There is no separate backend service — the former Strapi-on-Render backend was retired in June 2026.

## Tech Stack
- **App**: Next.js 16 (App Router, TypeScript, Turbopack)
- **CMS**: Payload 3 (embedded; Postgres adapter, schema `payload`)
- **Database**: Neon Postgres via Vercel Marketplace (prod) / Docker Postgres on port 5434 (dev)
- **Media**: Vercel Blob, public store `portfolio-media` (prod) / local disk `frontend/media/` (dev, gitignored)
- **Styling**: Tailwind CSS v4 + shadcn/ui
- **Animations**: Framer Motion + Lenis (smooth scroll)
- **Email**: Resend
- **Deployment**: Vercel only (project `portfolio`, root directory `frontend`, auto-deploys from `master`)

## Requirements
- **Node.js**: v24 LTS (odd versions unsupported). A Node 24 binary lives at `~/.nvm/versions/node/v24.13.0/bin` if the shell default differs.
- `frontend/package.json` has `"type": "module"` — required for the Payload CLI to work; do not remove.

## Project Structure
```
portfolio/
├── frontend/                       # The entire application
│   ├── src/
│   │   ├── app/
│   │   │   ├── (site)/            # Public site: layout, pages, sitemap, robots
│   │   │   ├── (payload)/         # Payload admin + REST/GraphQL (template files)
│   │   │   └── api/
│   │   │       ├── contact/       # Resend contact form
│   │   │       └── dev-import/    # Dev-only content seeder (idempotent)
│   │   ├── payload/               # Collections + globals (content model)
│   │   ├── payload.config.ts      # Payload config (db, blob plugin, guards)
│   │   ├── migrations/            # Committed DB migrations (run in CI)
│   │   ├── migration/             # Recovered seed/snapshot content (import source)
│   │   ├── lib/cms/               # Data layer: queries + types + getMediaURL
│   │   └── components/
│   └── scripts/export-strapi-neon.mjs  # Legacy Strapi DB export (July 2026 reconciliation)
├── migration-data/                 # Extracted live-site content (migration archive)
└── CLAUDE.md
```

## Development Commands
```bash
cd frontend
npm run dev              # Dev server (site :3000, admin /admin); schema auto-pushes in dev
npm run build            # Production build
npm run lint             # ESLint
npm run generate:types   # Regenerate src/payload-types.ts after collection changes
npm run ci               # What Vercel runs: payload migrate (unpooled URL) && next build
```

Local dev DB (one-time): `docker run -d --name portfolio-payload-pg -p 5434:5432 -e POSTGRES_USER=payload -e POSTGRES_PASSWORD=payload -e POSTGRES_DB=payload postgres:16-alpine`

Seed/reseed dev content: `curl -X POST http://localhost:3000/api/dev-import`

## Content Model (frontend/src/payload/)
- **Collections**: `projects`, `blog-posts` (both with drafts), `categories`, `media` (upload), `users` (admin auth)
- **Globals**: `about` (skills/experience/education arrays), `site-settings`
- Long-form `content` fields are **Markdown** (code field), rendered with react-markdown — not Lexical.
- Public queries MUST filter `_status: published` — `lib/cms` does this; Payload's local API otherwise returns drafts.

## Environment Variables

### frontend/.env.local (dev)
```
PAYLOAD_SECRET=<random>
DATABASE_URI=postgresql://payload:payload@localhost:5434/payload
NEXT_PUBLIC_SITE_URL=http://localhost:3000
RESEND_API_KEY=
CONTACT_EMAIL=
OLD_NEON_DATABASE_URL=<legacy Strapi DB, for scripts/export-strapi-neon.mjs>
```

### Vercel (production — already configured)
- `DATABASE_URL` / `DATABASE_URL_UNPOOLED` etc. — auto-injected by the Neon Marketplace integration (`neon-bole-bridge`)
- `BLOB_READ_WRITE_TOKEN` — auto-injected by the Blob store (`portfolio-media`)
- `PAYLOAD_SECRET`, `NEXT_PUBLIC_SITE_URL`, `RESEND_API_KEY`, `CONTACT_EMAIL`
- Build Command override: `npm run ci`

## Schema Changes
Dev uses drizzle push (automatic). Production uses committed migrations in `frontend/src/migrations/`:
1. Change collections, verify in dev.
2. `payload migrate:create <name>` — NOTE: drizzle codegen fails under the CLI's tsx loader on Windows (and sometimes Linux); the working alternative is a raw-SQL migration (pg_dump the dev schema and wrap it — see `20260612_000000_initial.ts`).
3. Commit; Vercel's `npm run ci` applies it over `DATABASE_URL_UNPOOLED` before building.
- Never point `npm run dev` at the prod DB without `PAYLOAD_DB_PUSH=false` (env-gated in payload.config.ts).
- Do NOT add `sharp` back to payload.config — its libvips native lib gets dropped from the Vercel function bundle and 500s `/admin`.

## Code Conventions
- TypeScript strict mode; absolute imports via `@/`; `@payload-config` resolves to src/payload.config.ts
- Components PascalCase; Reveal component for scroll animations; dark mode default
- Pages keep hardcoded fallback content for when the DB returns nothing — preserve this pattern
- ISR: all CMS pages export `revalidate = 3600`

## Pages
| Route | Description |
|-------|-------------|
| `/` | Home - Hero, Skills marquee, Featured projects, Latest posts |
| `/about` | Bio, Experience timeline, Skills grid |
| `/projects` + `/projects/[slug]` | Listing with filters + case studies |
| `/blog` + `/blog/[slug]` | Listing + article with reading progress |
| `/contact` | Contact form (Resend) |
| `/admin` | Payload admin |

## Pending / History
- **~July 2026**: old Strapi Neon DB (`OLD_NEON_DATABASE_URL`) exits compute-quota lockout — run `node scripts/export-strapi-neon.mjs` and reconcile any blog posts/drafts not among the migrated content. Delete the Render service `portfolio-strapi` if not already done.
- Migration history and details: see PROGRESS.md and git history (commits `30d4ccf`, `ee8041a`).
