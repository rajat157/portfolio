# Portfolio Website

## Overview
Modern, dark-mode-first portfolio website with blog functionality for **Rajat Kumar R** - Software Architect & Developer.

## Tech Stack
- **Frontend**: Next.js 16 (App Router, TypeScript)
- **CMS**: Strapi 5 (headless)
- **Database**: SQLite (local dev) / PostgreSQL 16 (production)
- **Styling**: Tailwind CSS v4 + shadcn/ui
- **Animations**: Framer Motion + Lenis (smooth scroll)
- **Email**: Resend
- **Deployment**: Vercel (frontend) + Docker/Strapi Cloud (backend)

## Requirements
- **Node.js**: v24 LTS (v20, v22, v24 supported; odd versions like v25 NOT supported by Strapi)
- **nvm**: Recommended for Node version management

## Project Structure
```
portfolio/
├── frontend/              # Next.js 16 application
│   ├── src/
│   │   ├── app/          # App Router pages
│   │   │   ├── about/
│   │   │   ├── projects/[slug]/
│   │   │   ├── blog/[slug]/
│   │   │   ├── contact/
│   │   │   └── api/contact/
│   │   ├── components/
│   │   │   ├── ui/       # shadcn components
│   │   │   ├── layout/   # Header, Footer
│   │   │   ├── sections/ # Hero, SkillsMarquee
│   │   │   ├── about/    # Timeline, Skills
│   │   │   ├── projects/ # Cards, Grid, Filter
│   │   │   ├── blog/     # Cards, ReadingProgress
│   │   │   └── animations/
│   │   ├── lib/
│   │   │   ├── strapi/   # API client, types
│   │   │   └── utils/
│   │   └── providers/
│   └── public/
├── backend/               # Strapi 5 CMS
│   ├── src/api/          # Content types
│   ├── config/           # Database, server config
│   ├── Dockerfile        # Node 22, yarn
│   └── .env              # PostgreSQL config
├── docker-compose.yml     # Strapi + PostgreSQL
├── PROGRESS.md           # Detailed progress tracking
└── CLAUDE.md             # This file
```

## Development Commands

### Frontend (Next.js)
```bash
cd frontend
npm run dev          # Start dev server (port 3000)
npm run build        # Production build
npm run lint         # Run ESLint
```

### Backend (Local Development)
```bash
cd backend

# Install dependencies
npm install

# Start Strapi dev server (port 1337)
npm run develop

# Build for production
npm run build

# Start production server
npm run start
```

### Backend (Docker - Alternative)
```bash
# Start Strapi + PostgreSQL
docker-compose up -d

# View logs
docker-compose logs -f strapi

# Stop containers
docker-compose down

# Rebuild after changes
docker-compose build strapi
```

## Pages

| Route | Description |
|-------|-------------|
| `/` | Home - Hero, Skills marquee, Featured projects, Latest posts |
| `/about` | About - Bio, Experience timeline, Skills grid |
| `/projects` | Projects listing with category filters |
| `/projects/[slug]` | Project detail/case study |
| `/blog` | Blog listing with category filters |
| `/blog/[slug]` | Article with reading progress, TOC |
| `/contact` | Contact form with validation |

## Strapi Content Types
- **Project**: title, slug, description, cover_image, technologies, category, featured, live_url, github_url
- **BlogPost**: title, slug, excerpt, content, cover_image, category, tags, published_date, reading_time
- **Category**: name, slug, type (project|blog|both), color
- **About**: name, headline, bio, skills, experience, education
- **SiteSettings**: site_title, site_description, social_links

## Environment Variables

### Frontend (.env.local)
```
NEXT_PUBLIC_STRAPI_URL=http://localhost:1337
STRAPI_API_TOKEN=<from Strapi admin>
REVALIDATION_SECRET=<random string>
RESEND_API_KEY=<from Resend>
CONTACT_EMAIL=rajat.kumar.r@outlook.com
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### Backend (.env)
```
# SQLite (local development - default)
DATABASE_CLIENT=sqlite
DATABASE_FILENAME=.tmp/data.db

# PostgreSQL (production/Docker)
# DATABASE_CLIENT=postgres
# DATABASE_HOST=localhost
# DATABASE_PORT=5432
# DATABASE_NAME=strapi
# DATABASE_USERNAME=strapi
# DATABASE_PASSWORD=strapi_secure_password_2026

APP_KEYS=<generate 4 comma-separated random keys>
API_TOKEN_SALT=<random string>
ADMIN_JWT_SECRET=<random string>
TRANSFER_TOKEN_SALT=<random string>
JWT_SECRET=<random string>
```

## Code Conventions
- TypeScript strict mode
- Absolute imports with `@/` alias
- Component naming: PascalCase
- Use Reveal component for scroll animations
- Dark mode default, toggle available

## Current Status
See `PROGRESS.md` for detailed progress tracking.

**Completed:**
- All pages created with placeholder data
- Docker + PostgreSQL configured
- Build successful (18 pages)

**Pending:**
- Start Strapi and create content
- Connect pages to Strapi API
- Configure email (Resend)
- Deploy

## Design References

The frontend design is inspired by these award-winning portfolio sites:

- **Ashfall Studio** (https://ashfall.studio/) - Grid layouts, scroll animations, minimal aesthetic
- **Gianluca Gradogna** (https://gianlucagradogna.com/) - Massive typography, dark theme, bold visuals

Key design principles:
- Dark mode first with subtle gradients
- Large, bold typography for headings
- Smooth scroll animations using Lenis
- Reveal animations on scroll using Framer Motion
- Clean grid layouts for projects and blog posts
- Minimal color palette with accent highlights
