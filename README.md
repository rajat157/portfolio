# Portfolio Website

A modern, dark-mode-first portfolio website with blog functionality built with Next.js and Strapi.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16 (App Router), TypeScript, Tailwind CSS v4, shadcn/ui |
| Animations | Framer Motion, Lenis (smooth scroll) |
| CMS | Strapi 5 (headless) |
| Database | SQLite (local dev) / PostgreSQL 16 (Docker) |
| Reverse Proxy | nginx (Docker only) |
| Email | Resend |

## Prerequisites

- **Node.js**: v24 LTS (v20, v22, v24 supported; odd versions like v25 NOT supported by Strapi)
- **Docker & Docker Compose**: Required for containerized deployment

## Local Development

### Backend (Strapi)

```bash
cd backend
npm install
npm run develop  # Starts on http://localhost:1337
```

Access the Strapi admin panel at `http://localhost:1337/admin`.

### Frontend (Next.js)

```bash
cd frontend
npm install
npm run dev  # Starts on http://localhost:3000
```

Create `frontend/.env.local` with:

```env
NEXT_PUBLIC_STRAPI_URL=http://localhost:1337
STRAPI_API_TOKEN=<from Strapi admin>
NEXT_PUBLIC_SITE_URL=http://localhost:3000
REVALIDATION_SECRET=<random string>
RESEND_API_KEY=<from Resend>
CONTACT_EMAIL=your@email.com
```

## Docker Deployment

### Quick Start

```bash
# Copy and configure environment variables
cp .env.example .env
# Edit .env with your values (see Environment Variables section)

# Build and start all services
docker-compose up -d --build
```

### Access Points

| Service | URL |
|---------|-----|
| Frontend | http://localhost |
| Strapi Admin | http://localhost/admin |

### Docker Commands

```bash
# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f strapi
docker-compose logs -f frontend

# Stop all services
docker-compose down

# Rebuild after code changes
docker-compose up -d --build

# Reset everything (including database)
docker-compose down -v
docker-compose up -d --build
```

## Environment Variables

Copy `.env.example` to `.env` and configure:

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_NAME` | PostgreSQL database name | Yes |
| `DATABASE_USERNAME` | PostgreSQL username | Yes |
| `DATABASE_PASSWORD` | PostgreSQL password | Yes |
| `APP_KEYS` | Strapi app keys (4 comma-separated) | Yes |
| `API_TOKEN_SALT` | Strapi API token salt | Yes |
| `ADMIN_JWT_SECRET` | Strapi admin JWT secret | Yes |
| `TRANSFER_TOKEN_SALT` | Strapi transfer token salt | Yes |
| `JWT_SECRET` | Strapi JWT secret | Yes |
| `STRAPI_API_TOKEN` | API token from Strapi admin | Yes |
| `NEXT_PUBLIC_SITE_URL` | Public URL of the site | Yes |
| `REVALIDATION_SECRET` | Secret for ISR revalidation | No |
| `RESEND_API_KEY` | Resend API key for emails | No |
| `CONTACT_EMAIL` | Email for contact form | No |

## Project Structure

```
portfolio/
├── frontend/              # Next.js application
│   ├── src/
│   │   ├── app/          # App Router pages
│   │   ├── components/   # React components
│   │   └── lib/          # Utilities, API client
│   └── Dockerfile
├── backend/               # Strapi CMS
│   ├── src/api/          # Content types
│   ├── config/           # Database, server config
│   └── Dockerfile
├── nginx/                 # Reverse proxy config
│   └── nginx.conf
├── docker-compose.yml     # Docker services
├── .env.example          # Environment template
└── CLAUDE.md             # Development guide
```

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

## License

MIT
