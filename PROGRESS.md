# Portfolio Website - Progress Tracker

## Resume

- NEXT: waiting on Rajat. Nothing else is in progress (master = 4a15fcb, PRs #1–#10 and #12 live).
  - Smooth scroll + snapping, DRAFT PR #11 (`proto/smooth-snap`; preview
    https://portfolio-git-proto-smooth-snap-rajats-projects-6181289d.vercel.app). Rajat: "still needs a bit of work".
    Ask what feels off (snap strength or speed, which stops, the trackpad feel), then iterate on that branch.
    - It must also pass the perf gate: the hero scrub p95 was 29.6ms against 25ms (Lenis's rAF plus resnapping).
    - Keep it a draft until he says it feels right. Its builder worktree is
      `.claude/worktrees/agent-a8e74a64a20092fa7` (remove it when done; check for a media junction first).
  - Still open (unanswered since 2026-10-15):
    - the "trading platforms" / "high-frequency trading" wording in the About bio and blog post 1 (vs the Tredye
      "monitoring" rule);
    - the About bio's SahasraT/IISc opener;
    - optional polish: the 404's nested <html> (move to global-not-found), the static hero's no-op tab stop, the
      outputFileTracingRoot/turbopack.root build warning, and trimming the stale tracker below this Resume.
  - This Resume is a local commit on master, not pushed (a docs-only push rebuilds production). It rides along with
    the next PR.
- Shipped 2026-10-15: #12, "Where to next" as a sheet set (Rajat's option A; design/drafted/where-to-next-sheet-set.html).
  - `components/home/sheet-map.tsx` turns `#map`'s four plain links into labels pinned over four 3D drawing sheets.
    - Point or Tab to mark a sheet out; click or Enter dives in (1.25s), then `router.push`. Contact dives, then lands on
      the brief. Esc in the dive goes back. Phones tap to choose, then Go.
    - No JS, no WebGL and reduced motion keep the plain nodes. three loads only once #map is within 1.5 screens, and
      the scene is disposed 4 screens away. One `sync()` settles both observers: either can report first, which once
      left the map down for good.
  - Fixed from the prototype:
    - The phone dive showed empty plane above the sheet. Now the approach keeps the layout's pitch, the sheet tilts to
      meet the camera, the paper covers the frame, and the fog is pushed back.
    - The fit reserves a marked-out label's measured height under the heading. The real section is 61–102px shorter
      than the review frame.
    - An invisible hit area above each sheet. A marked-out label rises with its sheet, and the pointer fell into the
      gap and unmarked it (the prototype has the same bug).
    - Colour management stays on, since the stage shares `three`.
  - Harness:
    - `home sheet map`: 16 checks.
    - `home perf` gains a scrub into the live map with both canvases up: p95 17–19ms on the Vega 8.
    - Matrix 1602/1. The 1 was the existing hero scrub at p95 31.0ms under load; three reruns alone gave
      21.3/23.5/20.9.
    - Home JS: +23.2KB over /about (budget 35).
    - Live (dpl_AtQAgsw7BKSo4hjPwMoA1iig8R5k): all 16 checks pass on www; no runtime errors.
  - Gotchas:
    - SwiftShader (the matrix) draws the map at ~300ms a frame against 16.7ms on the GPU, so CSS transitions there lag
      by seconds. Map checks wait on conditions, never fixed sleeps.
    - An IntersectionObserver delivers already-queued entries after `disconnect()`, so guard on unmount.
- Earlier (all live): #7 "Who I am" stops on `steps.tsx`; #8 widescreen (`--page-w`, rem type); #9 self-hosted fonts,
  sslmode=verify-full, Strapi export dropped; #10 `chapters.tsx` (one pinned section, 6 stops).
  - Root scroll snapping on the pinned section was tried and DROPPED: WebKit trapped the wheel on the last stop.
  - The context handoff is at 90% (Rajat's rule), read from the status line cache.
- Ops:
  - The Vercel runtime errors list is empty. If a production build ever fails transiently, redeploy it with the Vercel
    MCP `create_deployment` (deploymentId = the failed one, target production).
  - Unconfirmed (dashboards I can't reach): whether the Render service `portfolio-strapi` and the old Strapi Neon
    project still exist. Deleting them is safe.
- Verify worktree removed. To recreate it:
  - `git worktree add --detach D:\Projects\portfolio-verify <sha>`;
  - give it a credential-free `frontend\.env.local` (PAYLOAD_SECRET, DATABASE_URI, NEXT_PUBLIC_SITE_URL only);
  - `npm ci` (about 9 min);
  - `cmd /c mklink /J frontend\media D:\Projects\portfolio\frontend\media`;
  - `next build` + `next start -p 3005`.
  - Unlink the junction (`cmd /c rmdir`) BEFORE `git worktree remove --force`.
- Reprompt (when there is new work): `Continue the portfolio work from PROGRESS.md "Resume". Keep going till finished; merge each PR once verified.`

---

**Last Updated:** 2026-01-20 (Phases 5-8 Completed)

**Owner:** Rajat Kumar R - Software Architect & Developer

---

## Project Overview

Modern, dark-mode-first portfolio website with blog functionality.

| Component | Technology |
|-----------|------------|
| Frontend | Next.js 16 (App Router, TypeScript) |
| CMS | Strapi 5.33.3 |
| Database | SQLite (local) / PostgreSQL 16 (production) |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Animations | Framer Motion + Lenis |
| Email | Resend |

---

## Progress Summary

### Phase 1: Foundation [COMPLETED]
- [x] Initialize git repository
- [x] Create monorepo structure (frontend + backend)
- [x] Set up Next.js 16 with TypeScript
- [x] Install Tailwind CSS v4 + shadcn/ui
- [x] Initialize Strapi 5 structure
- [x] Configure environment variables

### Phase 2: Core Infrastructure [COMPLETED]
- [x] Create Strapi content type schemas
- [x] Build typed Strapi API client with ISR support
- [x] Set up layout components (Header, Footer, Navigation)
- [x] Implement dark/light theme toggle (next-themes)
- [x] Configure Lenis smooth scroll
- [x] Create Reveal animation component

### Phase 3: Docker + PostgreSQL [COMPLETED]
- [x] Update Dockerfile for Strapi 5 (Node 22, yarn)
- [x] Update docker-compose.yml with PostgreSQL 16
- [x] Configure database.ts for PostgreSQL
- [x] Update backend .env with PostgreSQL credentials
- [x] Add `pg` driver to package.json

### Phase 4: Pages Implementation [COMPLETED]
- [x] Update Hero section with Rajat's info
- [x] Create Skills Marquee component
- [x] Create About page with experience timeline
- [x] Create Projects listing page with filters
- [x] Create Project detail page ([slug])
- [x] Create Blog listing page
- [x] Create Blog article page ([slug]) with reading progress
- [x] Create Contact page with validated form

### Phase 5: Content Population [COMPLETED]
- [x] Start Strapi locally (SQLite)
- [x] Create Strapi admin user
- [x] Create content types (Category, Project, BlogPost, About, SiteSettings)
- [x] Set up API permissions (public read access)
- [x] Generate API token for frontend

### Phase 6: API Integration [COMPLETED]
- [x] Connect Home page to Strapi API (featured projects, latest posts)
- [x] Connect Projects page to Strapi (listing + detail pages)
- [x] Connect Blog page to Strapi (listing + detail pages)
- [x] Connect About page to Strapi (single type)
- [x] Implement SSG with generateStaticParams

### Phase 7: Email & Newsletter [COMPLETED]
- [x] Install Resend package
- [x] Implement contact form email sending
- [x] Add HTML email template
- [x] Graceful fallback when API key not configured

### Phase 8: SEO & Performance [COMPLETED]
- [x] Add JSON-LD schemas (Person, WebSite)
- [x] Update metadata with Rajat's info
- [x] Generate dynamic sitemap (sitemap.ts)
- [x] Create robots.ts configuration
- [ ] Run Lighthouse audit
- [ ] Optimize images

### Phase 9: Deployment [PENDING]
- [ ] Deploy frontend to Vercel
- [ ] Deploy Strapi to Strapi Cloud or VPS
- [ ] Configure webhooks for ISR
- [ ] Set up custom domain

---

## File Structure

```
portfolio/
├── frontend/                          # Next.js 16 Application
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx              # Home (Hero, Featured Projects, Blog)
│   │   │   ├── layout.tsx            # Root layout with providers
│   │   │   ├── about/page.tsx        # About with timeline
│   │   │   ├── projects/
│   │   │   │   ├── page.tsx          # Projects listing
│   │   │   │   └── [slug]/page.tsx   # Project detail
│   │   │   ├── blog/
│   │   │   │   ├── page.tsx          # Blog listing
│   │   │   │   └── [slug]/page.tsx   # Article detail
│   │   │   ├── contact/page.tsx      # Contact form
│   │   │   └── api/contact/route.ts  # Contact API
│   │   ├── components/
│   │   │   ├── ui/                   # shadcn components
│   │   │   ├── layout/               # Header, Footer, ThemeToggle
│   │   │   ├── sections/             # Hero, SkillsMarquee
│   │   │   ├── about/                # ExperienceTimeline, SkillsGrid
│   │   │   ├── projects/             # ProjectCard, ProjectGrid, ProjectFilter
│   │   │   ├── blog/                 # ArticleCard, ReadingProgress, TOC
│   │   │   ├── forms/                # ContactForm
│   │   │   └── animations/           # Reveal
│   │   ├── lib/
│   │   │   ├── strapi/               # API client, types
│   │   │   ├── utils/                # reading-time, generate-toc
│   │   │   └── validations/          # Zod schemas
│   │   ├── providers/                # Theme, Lenis, Toast
│   │   └── styles/                   # Custom CSS
│   ├── .env.local
│   └── package.json
├── backend/                           # Strapi 5 CMS
│   ├── src/
│   │   ├── api/
│   │   │   ├── project/              # Project content type
│   │   │   ├── blog-post/            # Blog post content type
│   │   │   ├── category/             # Category content type
│   │   │   ├── about/                # About single type
│   │   │   └── site-setting/         # Site settings single type
│   │   └── index.ts
│   ├── config/
│   │   ├── database.ts               # PostgreSQL config
│   │   ├── server.ts
│   │   ├── admin.ts
│   │   └── middlewares.ts
│   ├── Dockerfile                    # Node 22, yarn
│   ├── .env                          # PostgreSQL credentials
│   └── package.json
├── docker-compose.yml                 # Strapi + PostgreSQL
├── .gitignore
├── CLAUDE.md
├── PROGRESS.md                        # This file
└── README.md
```

---

## Generated Routes

| Route | Type | Description |
|-------|------|-------------|
| `/` | Static | Home page with Hero, Skills, Featured Projects |
| `/about` | Static | About page with experience timeline |
| `/projects` | Static | Projects listing with category filters |
| `/projects/[slug]` | SSG | Project detail pages (4 generated) |
| `/blog` | Static | Blog listing with category filters |
| `/blog/[slug]` | SSG | Article pages with reading progress (5 generated) |
| `/contact` | Static | Contact form |
| `/api/contact` | Dynamic | Contact form API endpoint |

---

## Content to Add (from Resume)

### Projects
1. **Tredye** - Trading platform (Next.js 16, Docker, Redis, Kafka, PostgreSQL)
2. **Labbuild 2.0** - Lab automation tool (Python, pyVmomi) - 90% faster
3. **Labbuild Dashboard** - Flask, MongoDB, Bootstrap
4. **Operation Schedules** - FastAPI, PostgreSQL, Flask-ASPScheduler
5. **Pro Fit Club Dashboard** - Django, PostgreSQL, Svelte
6. **SahasraT Monitoring** - Django, PostgreSQL, Twilio, Plotly

### Experience
1. Voltvave Innovations (Nov 2025 - Present) - Freelance Software Architect
2. Red Education (Feb 2024 - Aug 2025) - Team Lead, Senior Python Engineer
3. Freelancer (Nov 2023 - Jan 2024) - Technical Consultant
4. Offpriced Canada Inc. (Jul 2022 - Oct 2023) - Senior Developer
5. HCL Technologies (Oct 2021 - Jun 2022) - Lead Engineer SQA
6. SERC, IISc (Jul 2019 - Sep 2021) - System Engineer
7. TEKsystems/HPE (Jun 2017 - Jun 2019) - Network Support Engineer

### Skills
- **Languages & Frameworks**: Python, Django, Flask, FastAPI, Node.js, ReactJS, Next.js, Svelte
- **Databases**: PostgreSQL, MongoDB, Redis
- **DevOps & Cloud**: Docker, Kubernetes, AWS, GCP, Azure, OCI, Jenkins, Nginx
- **Testing**: Pytest, Selenium, Automated Testing
- **Tools**: Git, Jira, Confluence, Kafka

---

## Commands

### Development
```bash
# Start frontend (port 3000)
cd frontend && npm run dev

# Start Strapi locally (port 1337)
cd backend && npm run develop
```

### Docker (Alternative)
```bash
# Start Strapi + PostgreSQL with Docker
docker-compose up -d

# View Strapi logs
docker-compose logs -f strapi

# Stop containers
docker-compose down
```

### Build
```bash
# Build frontend
cd frontend && npm run build

# Build Strapi
cd backend && npm run build
```

### Docker
```bash
# Rebuild Strapi image
docker-compose build strapi

# Reset database (WARNING: deletes data)
docker-compose down -v
docker-compose up -d
```

---

## Environment Variables

### Frontend (.env.local)
```
NEXT_PUBLIC_STRAPI_URL=http://localhost:1337
STRAPI_API_TOKEN=<get from Strapi admin>
REVALIDATION_SECRET=<generate random string>
RESEND_API_KEY=<get from Resend>
CONTACT_EMAIL=rajat.kumar.r@outlook.com
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### Backend (.env)
```
HOST=0.0.0.0
PORT=1337
NODE_ENV=development

DATABASE_CLIENT=postgres
DATABASE_HOST=strapiDB
DATABASE_PORT=5432
DATABASE_NAME=strapi
DATABASE_USERNAME=strapi
DATABASE_PASSWORD=strapi_secure_password_2026

APP_KEYS=<generate 4 random keys>
API_TOKEN_SALT=<generate random string>
ADMIN_JWT_SECRET=<generate random string>
TRANSFER_TOKEN_SALT=<generate random string>
JWT_SECRET=<generate random string>
```

---

## Next Immediate Steps

1. **Start Strapi:**
   ```bash
   docker-compose up -d
   ```

2. **Create Admin User:**
   - Go to http://localhost:1337/admin
   - Create your admin account

3. **Generate API Token:**
   - Settings → API Tokens → Create new token
   - Copy to frontend/.env.local

4. **Add Content:**
   - Add your projects with screenshots
   - Write blog posts
   - Configure site settings

5. **Connect to Strapi:**
   - Replace placeholder data with API calls
   - Test ISR revalidation

---

## Design References

- **Ashfall Studio** (https://ashfall.studio/) - Grid layouts, scroll animations
- **Gianluca Gradogna** (https://gianlucagradogna.com/) - Massive typography, dark theme

---

## Notes

- Frontend build: **Successful** (18 pages generated)
- All pages connected to Strapi API with graceful fallbacks
- Dark mode is the default theme
- All pages have Framer Motion animations
- Contact form has Zod validation + Resend email integration
- SEO: JSON-LD schemas, dynamic sitemap, robots.txt configured
- SSG enabled with generateStaticParams for projects and blog posts

---

## Phase 9: Strapi -> Payload Migration (2026-06-12/13) - COMPLETED

The Strapi-on-Render backend died (Render free tier + Neon compute quota exhaustion)
and was burning the Vercel Hobby compute quota via hung ISR revalidations.

- Band-aid (commit 30d4ccf): fetch timeouts, STRAPI_DISABLED kill switch, hourly ISR.
- Migration (commit ee8041a): Payload 3.85.1 embedded into the Next.js app
  (admin at /admin), Neon Postgres via Vercel Marketplace, media on Vercel Blob.
  All 9 projects, 3 blog posts, categories, about, site settings recovered from
  seed scripts + live-page snapshots and imported. Pages rewired to a local-API
  data layer (lib/cms). Deployed and verified 2026-06-13.
- Cleanup: backend/, docker-compose/nginx stack, render.yaml, lib/strapi removed.
- Dropped (2026-10-14, Rajat): the planned export of the old Strapi Neon DB;
  scripts/export-strapi-neon.mjs is removed.
