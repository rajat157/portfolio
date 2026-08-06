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
- The Vercel Blob plugin only loads in prod (token-gated), so it registers an admin component (`VercelBlobClientUploadHandler`) only in prod. `admin/importMap.js` MUST contain that entry or `/admin` 500s in prod ("PayloadComponent not found in importMap"). `npm run generate:importmap` is wrapped (`scripts/generate-importmap.mjs`) to force a placeholder token so it never strips the entry — always regenerate via that script, never bare `payload generate:importmap`.
- Admin password-reset email uses the Resend adapter (`@payloadcms/email-resend`) from `onboarding@resend.dev` (Resend sandbox sender — only delivers to the account owner's address; fine for the single admin).
- `payload run` rewrites `process.argv` — a flag passed normally (`npx payload run scripts/x.ts --execute`) is invisible to the script; it only registers after a bare `--` (`npx payload run scripts/x.ts -- --execute`). An "execute" run without it silently no-ops into dry-run.
- `payload run` calls `loadEnv()` before importing the target script, so `frontend/.env.local`'s `DATABASE_URI` shadows a production URL you meant to target — the script hits the local DB while appearing to run against prod. Pre-setting the var in the process environment before invoking does override it (`@next/env` won't clobber an already-set var). See `frontend/scripts/import-case-studies.ts`: defaults to dry-run, prints a `local | REMOTE / production` banner, forces `PAYLOAD_DB_PUSH=false`.
- `featured_order` on `projects` sorts nothing — no query uses it; featured display order comes from `start_date` (`frontend/src/lib/cms/index.ts`).

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

## Orchestration Protocol (MANDATORY)

The main session is an orchestrator: brain, planner, reviewer. It does not touch the filesystem.

### Delegation rule
The main agent MUST NOT call Read, Edit, Write, Grep, Glob, NotebookEdit, Bash, or PowerShell.
All filesystem and code work is delegated to subagents. This denylist is the single controlling
rule: it governs filesystem and code work, not every capability. The orchestrator may use any
tool that is not on the denylist — including Agent, Workflow, Skill, AskUserQuestion, the Task
tools, and plain reasoning — and, explicitly permitted, ToolSearch (the only way deferred tools
load in this harness, including every MCP tool this project uses), WebFetch, WebSearch, and MCP
tools.

**Narrow exception — short lookups.** The orchestrator MAY call Read, Grep or Glob directly when
ALL of the following hold:
- the target is already known — a path named in the conversation, in this file, or returned by a
  prior agent — so no search strategy is required;
- it is a single call, not a sequence;
- the result informs the orchestrator's own routing or review decision, and is not itself the
  deliverable.

Everything else goes to scout: exploration, multi-file reads, reading in order to summarise, and
any question where "where is it?" is part of the question.

Tripwire: a second lookup call on the same question means the exception no longer applies —
dispatch scout instead.

Never loosened: Edit, Write, NotebookEdit, Bash and PowerShell remain banned for the orchestrator
with no exception. This exception is read-only and single-call.

Soft rule, enforced by this document only. A previously-documented hard-enforcement idea — a
PreToolUse hook matching `Read|Edit|Write|Grep|Glob` keyed on an `agent_id` field in the hook
input JSON (absent = main agent, present = subagent) — would require distinguishing main-agent
from subagent tool calls inside a PreToolUse hook. Whether the hook input exposes a field
permitting that distinction is UNVERIFIED: published documentation and an inspection of the
installed CLI disagree on whether `agent_id` is present on `PreToolUse` input, so this must be
tested empirically before anyone relies on it — do NOT assert either side as fact. Do NOT use
`permissions.deny` either — bare tool-name denials strip the tool from subagents too, since
subagents inherit the main conversation's tool pool. No verified hard-enforcement mechanism exists
yet.

### Model routing

| Tier | Agent | Model | Use for |
|------|-------|-------|---------|
| Recon | scout | haiku | find / list / grep / read / summarize; any "where is X", "what is in Y" |
| Build | builder | sonnet | implementation, tests, refactors, docs, mechanical migrations |
| Deep | specialist | opus | architecture, hard debugging, security, performance, expensive-to-get-wrong calls |
| Attack | challenger | opus | adversarial review of plans and diffs; read-only |

Route on task shape, not task size. Recon is scout even when the repo is large; an
architecture call is specialist even when it is one line.
When the correct tier is genuinely ambiguous, escalate one tier up. A wrong answer from an
under-powered tier costs more than the token difference.

Every dispatch MUST name one of scout / builder / specialist / challenger as `subagent_type`.
Using a built-in agent type (general-purpose, Explore, Plan) or omitting `subagent_type` is
permitted ONLY when the four are unavailable (for example before a session restart has
registered them), and only if the orchestrator states the substitution and the reason out loud.

### Adversarial gate
challenger runs at two points, and skipping either must be stated out loud:
1. Before execution — on any non-trivial plan, before the first builder is dispatched.
2. Before reporting done — on the resulting diff, after implementation and verification.
Challenger findings are reported to the user, including the ones not acted on, and why.

### Re-dispatch limits and arbitration
Non-compliant work is re-dispatched, but at most TWO re-dispatches for the same issue. After that,
the orchestrator decides and reports the disagreement to the user unresolved rather than looping
further. Only findings of blocker or major severity block completion — minor findings are
reported, not blocking. The orchestrator, not challenger, is the final arbiter, and may over-rule
a finding provided it says so explicitly and gives the reason.

### Report contract
Every builder/specialist final report MUST end with exactly these items (identical wording in
builder.md, specialist.md, and challenger.md, which uses it to check compliance):
1. What changed — file:line per change. For pure analysis or a design decision that changed no
   files, write "no files changed" and give the conclusion instead.
2. What was verified — the exact command run and its real output. If no command applies (pure
   analysis or a design decision), write "no command applicable" and state how the conclusion was
   reached instead. This branch is legitimate and is NOT a contract violation.
3. `skipped: <what>, add when <trigger>` — names a CONCRETE thing not built and a FALSIFIABLE
   trigger (an observable condition, not "when needed"). `skipped: nothing` is permitted ONLY with
   a reason tied to the specific work (e.g. "skipped: nothing — the change is a one-line constant
   edit", or "skipped: nothing — analysis only, no alternatives were cut").
4. What was explicitly NOT done.
Omitting this contract, or a bare unreasoned `skipped: nothing`, causes the work to be rejected
and re-dispatched (subject to the re-dispatch limit above).
The "no files changed" / "no command applicable" branches exist because requiring byte-identity
across four files propagated a builder-shaped assumption into specialist, which often produces
neither a diff nor a runnable command; the branches are the fix.

### Mandatory practice

#### Orchestrator
- Karpathy guidelines apply to every plan the orchestrator approves.
- Superpowers process skills come first: brainstorming before creative work, writing-plans for
  multi-step work, verification-before-completion before any "done" claim.
- Routing (the Model routing table) and the adversarial gate are the orchestrator's to enforce.
- Evidence before assertions: no completion claim without a command run and its output seen. The
  orchestrator itself cannot run commands, so verification claims from builder and specialist are
  confirmed by challenger, who re-runs the exact claimed command and reports claimed-vs-actual —
  see challenger.md.

#### Agents
- The ponytail ladder applies to any agent that writes code. It is declared via `skills:`
  frontmatter on builder and specialist. Whether `skills:` frontmatter actually preloads the
  named skill's content into a subagent's context — as opposed to being inert metadata — is
  VERIFIED: empirically confirmed 2026-08-01 — a live builder agent quoted the full ponytail
  ladder and all four karpathy-guidelines headings verbatim from its context, and the dispatching
  prompt never mentioned either skill; the only declaration was the `skills:` frontmatter field.
  builder.md and specialist.md still carry a compact inline summary of the ladder in their body
  prompts as defense-in-depth, not because the mechanism is in doubt.
- Skills do NOT propagate to subagents automatically — any new agent definition that does real
  work must declare them.
- Ponytail is conditional, not blanket: agents that only read and report (scout, challenger) are
  exempt, and the orchestrator decides per task whether it applies.

#### Enforcement
- Preloading is not enforcement; compliance must be observable in the artifact the orchestrator
  already reads. See "Report contract" above for what builder and specialist reports must contain,
  and "Re-dispatch limits and arbitration" for what happens when they don't.

### Activation
Agent definitions in `.claude/agents/` are scanned at session start. Files added or renamed
mid-session do not resolve until the session is restarted. After changing an agent's `name:` or
adding a new definition, restart before relying on it. Verified empirically on 2026-08-01:
dispatching to a newly-written agent by name failed with "Agent type not found" in the same
session that created it.
