# Portfolio Deployment Guide

Quick deploy to **Vercel** (frontend) + **Render** (backend) + **Neon** (database).

---

## 1️⃣ Database (Neon) - 2 minutes

1. Go to [neon.tech](https://neon.tech) and sign up (GitHub login works)
2. Create a new project: `portfolio-db`
3. Copy the **Connection String** (looks like `postgresql://user:pass@ep-xxx.region.aws.neon.tech/neondb?sslmode=require`)
4. Save it - you'll need it for Render

---

## 2️⃣ Backend (Render) - 5 minutes

1. Go to [render.com](https://render.com) and sign up
2. Click **New** → **Blueprint**
3. Connect your GitHub repo (`portfolio`)
4. Render detects `render.yaml` automatically
5. **Before deploying**, update these environment variables:
   - `DATABASE_URL` → paste your Neon connection string
   - `PUBLIC_URL` → will be `https://portfolio-strapi.onrender.com` (or your custom domain)

6. Click **Apply** → wait ~5 minutes for build

⚠️ **Free tier note**: Render spins down after 15 min of inactivity. First request takes ~30s to wake up.

---

## 3️⃣ Frontend (Vercel) - 3 minutes

1. Go to [vercel.com](https://vercel.com) and sign up
2. Click **Add New** → **Project**
3. Import your GitHub repo
4. Set **Root Directory** to `frontend`
5. Add environment variables:
   ```
   NEXT_PUBLIC_STRAPI_URL=https://portfolio-strapi.onrender.com
   STRAPI_API_TOKEN=<create one in Strapi admin>
   REVALIDATION_SECRET=<generate a random string>
   NEXT_PUBLIC_SITE_URL=https://your-vercel-url.vercel.app
   ```
6. Click **Deploy**

---

## 4️⃣ Post-Deploy Setup

### Create Strapi API Token
1. Open your Render Strapi URL: `https://portfolio-strapi.onrender.com/admin`
2. Create admin account
3. Go to **Settings** → **API Tokens** → **Create new API Token**
4. Name: `frontend`, Type: `Full access`
5. Copy token → add to Vercel env vars

### Seed Content (Optional)
Your Strapi has seed scripts - run them locally first, then the data syncs via the shared DB.

---

## Quick Reference

| Service | URL | Dashboard |
|---------|-----|-----------|
| Frontend | `*.vercel.app` | [vercel.com/dashboard](https://vercel.com/dashboard) |
| Backend | `*.onrender.com` | [dashboard.render.com](https://dashboard.render.com) |
| Database | - | [console.neon.tech](https://console.neon.tech) |

---

## Troubleshooting

**Strapi won't start?**
- Check Render logs for errors
- Verify `DATABASE_URL` is correct
- Ensure `DATABASE_SSL=true` is set

**Frontend can't reach API?**
- Check CORS in Strapi: `config/middlewares.ts`
- Verify `NEXT_PUBLIC_STRAPI_URL` has no trailing slash

**Slow first load?**
- Normal for free tier - Render needs to wake up
- Consider upgrading to paid ($7/mo) for always-on

---

Total time: ~15 minutes ⚡
