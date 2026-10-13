# Portfolio Website

## Overview
Portfolio website with blog functionality for **Rajat Kumar R** - Software Architect & Developer, in the "Drafted" design
(a light-only drafting-sheet language — see `design/drafted/BUILD-PLAN.md`). Live at https://www.rajatkumarr.com.

Single Next.js app with **Payload CMS embedded** (admin at `/admin`). There is no separate backend service — the former Strapi-on-Render backend was retired in June 2026.

## Tech Stack
- **App**: Next.js 16 (App Router, TypeScript, Turbopack)
- **CMS**: Payload 3 (embedded; Postgres adapter, schema `payload`)
- **Database**: Neon Postgres via Vercel Marketplace (prod) / Docker Postgres on port 5434 (dev)
- **Media**: Vercel Blob, public store `portfolio-media` (prod) / local disk `frontend/media/` (dev, gitignored)
- **Styling**: plain CSS (`frontend/src/app/(site)/globals.css`, one file, no Tailwind/shadcn, no dark mode — the "Drafted" design kit, light only)
- **Fonts**: next/font — Instrument Sans (sans, variable wdth/wght), Martian Mono (mono), Caveat (hand notes), Doto (counters)
- **3D**: three.js, loaded only on the home page (the shard stage), lazily
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

Local builds on Windows + podman: set `NODE_OPTIONS=--network-family-autoselection-attempt-timeout=3000` first — podman answers on
`::1` only, and under build load the default 250ms per-address Happy Eyeballs try times out, so pages fall back to a slower retry.

Other scripts (`frontend/scripts/`):
- `node_modules\.bin\tsx.cmd scripts/check-drawing.mts` — regression test of the `drawing` layout invariants (exact `describe()`
  strings, geometry at 4 widths).
- `node scripts/verify-site.mjs --routes /,/projects,/projects/*,/blog,/blog/*,/about,/contact` — the browser verification harness
  (system Chrome + WebKit via `playwright-core`, no downloaded Chromium). Run it against a built `npm run start`, not `npm run dev`.
  **Every check that submits the contact form intercepts `/api/contact`** — see the caution below.
- `node scripts/measure-grain.mjs` — the grain-overlay cost/visual-diff measurement (§4.7 Q6b of `design/drafted/BUILD-PLAN.md`),
  also against a running `npm run start`.
- `node scripts/og-image.mjs` — regenerates `public/og-image.png` from an HTML template via Playwright + system Chrome.
- `scripts/font-metrics.py` (fontTools; generates `src/lib/font-metrics.ts` and `src/lib/name-outline.ts`) — run with the miniconda
  Python environment (fontTools + brotli installed there), not whatever `python` resolves to by default.
- `node_modules\.bin\payload.cmd run scripts/import-case-studies.ts -- --content [--execute]` — content import/sync. Every run syncs
  title, description, technologies, live_url, featured/featured_order, `sheet` and `drawing` (overwriting admin edits to them);
  `--content` also syncs the markdown body. Defaults to dry-run; add `--execute` to write.

## Content Model (frontend/src/payload/)
- **Collections**: `projects`, `blog-posts` (both with drafts), `categories`, `media` (upload), `users` (admin auth)
- **Globals**: `about` (skills/experience/education arrays), `site-settings`
- Long-form `content` fields are **Markdown** (code field), rendered with react-markdown — not Lexical.
- Public queries MUST filter `_status: published` — `lib/cms` does this; Payload's local API otherwise returns drafts.
- `projects` has a `sheet` group (title-block fields shown on the case-study sheet) and a `drawing` json field (the
  deterministic layout data consumed by `src/lib/drawing.ts`/`drawing-view.tsx`); see `src/migration/case-studies/sheets.json`
  for the content source these were ported from.
- `featured_order` on `projects` sorts the featured set on `/` and `/projects` (ascending, then `start_date` descending as
  the tiebreak) — `frontend/src/lib/cms/index.ts`.

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
- The Vercel Blob plugin only loads in prod (token-gated), so it registers an admin component (`VercelBlobClientUploadHandler`) only in prod. `admin/importMap.js` MUST contain that entry or `/admin` 500s in prod ("PayloadComponent not found in importMap"). `npm run generate:importmap` is wrapped (`scripts/generate-importmap.mjs`) to force a placeholder token so it never strips the entry — always regenerate via that script, never bare `payload generate:importmap`.
- Admin password-reset email uses the Resend adapter (`@payloadcms/email-resend`) from `onboarding@resend.dev` (Resend sandbox sender — only delivers to the account owner's address; fine for the single admin).
- `payload run` rewrites `process.argv` — a flag passed normally (`npx payload run scripts/x.ts --execute`) is invisible to the script; it only registers after a bare `--` (`npx payload run scripts/x.ts -- --execute`). An "execute" run without it silently no-ops into dry-run.
- `payload run` calls `loadEnv()` before importing the target script, so `frontend/.env.local`'s `DATABASE_URI` shadows a production URL you meant to target — the script hits the local DB while appearing to run against prod. Pre-setting the var in the process environment before invoking does override it (`@next/env` won't clobber an already-set var). See `frontend/scripts/import-case-studies.ts`: defaults to dry-run, prints a `local | REMOTE / production` banner, forces `PAYLOAD_DB_PUSH=false`.
- `featured_order` on `projects` sorts the featured set (see Content Model above).

## Code Conventions
- TypeScript strict mode; absolute imports via `@/`; `@payload-config` resolves to src/payload.config.ts
- Components PascalCase; `PenBlocks` (`src/components/reveal.tsx`) for the sheet blocks' scroll-in drafting; light only, no dark mode
- Pages keep hardcoded fallback content for when the DB returns nothing — preserve this pattern
- ISR: all CMS pages export `revalidate = 3600`

## Pages
| Route | Description |
|-------|-------------|
| `/` | Home - the three.js shard stage, scroll story, "how I work", offerings, site map, routed contact brief |
| `/about` | Bio, experience timeline, skills grid |
| `/projects` + `/projects/[slug]` | Index of works (architecture drawn per sheet) + earlier works table + case-study sheets |
| `/blog` + `/blog/[slug]` | Listing + article with reading progress |
| `/contact` | Routed contact brief (Resend) |
| `/admin` | Payload admin |

## Local prod builds (caution)
- `frontend/.env.production.local` holds **production** secrets (`DATABASE_URL`, `DATABASE_URL_UNPOOLED`, `BLOB_READ_WRITE_TOKEN`,
  `RESEND_API_KEY`...). `next build`/`next start` load it; `next dev` does not. The DB stays local anyway because `DATABASE_URI`
  wins over `DATABASE_URL` in `payload.config.ts`, but the **production Blob token and Resend key are live** under `next start`.
  Never open `/admin` or submit the contact form under `next start` in this tree — check `/admin` under `next dev` only.
- `/api/contact` sends a real email to Rajat via Resend whenever `RESEND_API_KEY` is set (which it is, from `.env.production.local`,
  under `next start`). Any test or harness that submits the contact form **must intercept `/api/contact`** (e.g. Playwright
  `page.route`) rather than let the request through.

## Pending / History
- **~July 2026**: old Strapi Neon DB (`OLD_NEON_DATABASE_URL`) exits compute-quota lockout — run `node scripts/export-strapi-neon.mjs` and reconcile any blog posts/drafts not among the migrated content. Delete the Render service `portfolio-strapi` if not already done.
- Migration history and details: see PROGRESS.md and git history (commits `30d4ccf`, `ee8041a`).

## Working mode
- The main session reads, searches, edits and runs commands itself — no delegation for lookups or small edits.
- Use subagents only when they pay off, and put the context they need in the prompt:
  - independent chunks of work that can run in parallel;
  - long mechanical implementation → `builder` (Sonnet; saves Opus quota);
  - broad fan-out searches where only the conclusion matters → `Explore`.
- Review: one `challenger` pass on the finished diff when it touches DB migrations, production data, auth/security or payments; otherwise self-review against the plan. Challenge a plan only when a step is hard to reverse.
- Done = lint + build (+ tests) run by the main session, with the output seen.
- Ponytail and the Karpathy guidelines apply to all code; `builder` and `specialist` preload them via `skills:`.
- Effort: default for routine work; raise it only for hard debugging or architecture.
- `.claude/agents/` definitions load at session start — a new or renamed agent needs a restart.
