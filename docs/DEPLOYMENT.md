# 🚀 Deployment Guide

Deploy Mission Control to production in minutes.

---

## Quick Deploy (Vercel + Convex)

**Fastest path to production:**

```bash
# 1. Deploy Convex backend
npx convex deploy

# 2. Deploy Next.js frontend to Vercel
npx vercel --prod

# 3. Seed production data
npx convex run seed:seed --prod
```

Done! Your Mission Control is live.

---

## Deployment Platforms

Mission Control works on any platform that supports Next.js. We recommend:

| Platform | Difficulty | Deploy Time | Best For |
|----------|-----------|-------------|----------|
| **Vercel** | ⭐ Easy | ~3 min | Recommended, zero-config |
| **Netlify** | ⭐⭐ Medium | ~5 min | Alternative to Vercel |
| **Railway** | ⭐⭐ Medium | ~5 min | Full-stack, includes DB |
| **AWS Amplify** | ⭐⭐⭐ Hard | ~10 min | Enterprise, AWS integration |

---

## Deploy to Vercel (Recommended)

### Prerequisites
- Convex account (free tier OK)
- Vercel account ([Sign up](https://vercel.com/signup))
- GitHub repository (optional, but recommended)

### Step 1: Deploy Convex Backend

```bash
# Login to Convex
npx convex login

# Deploy to production
npx convex deploy --prod
```

**What happens:**
- Creates a production Convex deployment
- Generates production `NEXT_PUBLIC_CONVEX_URL`
- Outputs deployment URL (save this!)

**Example output:**
```
✓ Deployed convex functions to prod:mission-control-abc123
  Dashboard: https://dashboard.convex.dev/t/yourteam/mission-control-abc123/prod
  
  Environment variables for Next.js:
  CONVEX_DEPLOYMENT=prod:mission-control-abc123
  NEXT_PUBLIC_CONVEX_URL=https://happy-bird-123.convex.cloud
```

### Step 2: Deploy to Vercel

#### Option A: Deploy via GitHub (Recommended)

1. Push your code to GitHub:
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. Go to [vercel.com/new](https://vercel.com/new)

3. Import your GitHub repository

4. Add environment variables:
   - Click "Environment Variables"
   - Add from `.env.local`:
     - `CONVEX_DEPLOYMENT` → `prod:mission-control-abc123`
     - `NEXT_PUBLIC_CONVEX_URL` → `https://happy-bird-123.convex.cloud`
     - (Optional) `STRIPE_SECRET_KEY`, `OPENAI_API_KEY`, etc.

5. Click **Deploy**

#### Option B: Deploy via CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy (follow prompts)
vercel --prod
```

When prompted, add environment variables:
```bash
? Set up environment variables? Yes
? NEXT_PUBLIC_CONVEX_URL: https://happy-bird-123.convex.cloud
? CONVEX_DEPLOYMENT: prod:mission-control-abc123
```

### Step 3: Seed Production Data

```bash
npx convex run seed:seed --prod
```

### Step 4: Test Production

Visit your Vercel URL (e.g., `https://mission-control.vercel.app`) and verify:
- ✅ Agent cards load
- ✅ Task board displays
- ✅ Metrics bar shows data
- ✅ Activity feed updates

### Step 5: Set Up Custom Domain (Optional)

1. Go to Vercel dashboard → Your project → Settings → Domains
2. Add your domain (e.g., `mission.yourdomain.com`)
3. Update DNS records (Vercel provides instructions)
4. Wait for SSL certificate (automatic)

---

## Deploy to Netlify

### Step 1: Build Configuration

Create `netlify.toml`:

```toml
[build]
  command = "npm run build"
  publish = ".next"

[[plugins]]
  package = "@netlify/plugin-nextjs"
```

### Step 2: Deploy via Netlify CLI

```bash
# Install Netlify CLI
npm i -g netlify-cli

# Login
netlify login

# Deploy
netlify deploy --prod
```

### Step 3: Environment Variables

1. Go to Netlify dashboard → Site settings → Environment variables
2. Add:
   - `CONVEX_DEPLOYMENT`
   - `NEXT_PUBLIC_CONVEX_URL`
   - (Optional) Other API keys

### Step 4: Redeploy

```bash
netlify deploy --prod
```

---

## Deploy to Railway

Railway provides a full-stack platform with database included.

### Step 1: Create Railway Project

1. Go to [railway.app](https://railway.app/)
2. Click "New Project" → "Deploy from GitHub"
3. Select your repository

### Step 2: Add Environment Variables

In Railway dashboard:
- `CONVEX_DEPLOYMENT`
- `NEXT_PUBLIC_CONVEX_URL`
- (Optional) Other keys

### Step 3: Deploy

Railway auto-deploys on git push. Your app will be live at `https://yourapp.up.railway.app`.

---

## Environment Variables for Production

### Required

```bash
CONVEX_DEPLOYMENT=prod:mission-control-abc123
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
```

### Optional (Add as needed)

```bash
# Revenue tracking
STRIPE_SECRET_KEY=sk_live_xxxxx
WHOP_API_KEY=apik_xxxxx

# AI features
OPENAI_API_KEY=sk-proj-xxxxx

# Ops Kernel
SUPABASE_URL=https://yourproject.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJxxxxx
```

**⚠️ Security:**
- Never commit `.env.local` or `.env.production`
- Use platform secret management (Vercel secrets, Railway variables, etc.)
- Rotate keys regularly

---

## Post-Deployment Checklist

After deploying:

- [ ] Test all API endpoints
- [ ] Verify agent heartbeats work
- [ ] Check activity feed updates in real-time
- [ ] Test task creation/updates
- [ ] Verify metrics tracking
- [ ] Test revenue sync (if enabled)
- [ ] Check browser console for errors
- [ ] Test on mobile devices
- [ ] Set up monitoring (Sentry, LogRocket, etc.)
- [ ] Configure custom domain (optional)
- [ ] Add authentication (recommended for production)

---

## Continuous Deployment

### GitHub Actions (Vercel)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Vercel

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Install Convex
        run: npm install -g convex
      
      - name: Deploy Convex
        run: npx convex deploy --prod
        env:
          CONVEX_DEPLOY_KEY: ${{ secrets.CONVEX_DEPLOY_KEY }}
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

### Get Deploy Keys

**Convex Deploy Key:**
```bash
npx convex deploy --generate-deploy-key
# Add to GitHub Secrets as CONVEX_DEPLOY_KEY
```

**Vercel Token:**
- Go to [vercel.com/account/tokens](https://vercel.com/account/tokens)
- Create a new token
- Add to GitHub Secrets as `VERCEL_TOKEN`

---

## Rollback & Version Control

### Rollback Convex

```bash
# List deployments
npx convex deployments list

# Rollback to previous version
npx convex rollback <deployment-id>
```

### Rollback Vercel

1. Go to Vercel dashboard → Deployments
2. Find previous working deployment
3. Click "Promote to Production"

---

## Monitoring & Logging

### Convex Logs

View backend logs:
```bash
npx convex logs --prod
```

Or in dashboard: [dashboard.convex.dev](https://dashboard.convex.dev)

### Vercel Logs

View frontend logs:
```bash
vercel logs
```

Or in Vercel dashboard → Your project → Logs

### Error Tracking (Recommended)

Add Sentry for error tracking:

```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

---

## Performance Optimization

### Enable Caching

Vercel automatically caches static assets. For API routes, add:

```typescript
// src/app/api/your-route/route.ts
export const revalidate = 60; // Cache for 60 seconds
```

### Optimize Images

Use Next.js `<Image>` component:

```typescript
import Image from 'next/image';

<Image src="/logo.png" width={200} height={50} alt="Logo" />
```

### Database Indexes

Ensure Convex indexes are optimal in `convex/schema.ts`:

```typescript
.index("by_status", ["status"])
.index("by_agent", ["assignee"])
```

---

## Troubleshooting

### "Module not found" in production

- Clear build cache: `vercel --prod --force`
- Check `package.json` dependencies

### Environment variables not working

- Verify variables are set in platform dashboard
- Redeploy after adding env vars
- Check variable names (no typos)

### Convex connection fails

- Verify `NEXT_PUBLIC_CONVEX_URL` is correct
- Check Convex deployment status: `npx convex status --prod`
- Test backend directly: `npx convex logs --prod`

### API routes return 404

- Ensure files are in `src/app/api/` (not `pages/api/`)
- Check Next.js version (15+ required)
- Verify app router is enabled

---

## Scaling

Mission Control scales automatically with Convex and Vercel:

- **Database:** Convex handles millions of operations
- **Frontend:** Vercel CDN serves globally
- **Serverless:** Functions scale to demand

For high traffic:
1. Enable Vercel Pro plan
2. Upgrade Convex plan if needed
3. Add caching layers (Redis, Upstash)
4. Implement rate limiting

---

## Security Checklist

Before going live:

- [ ] Add authentication (NextAuth, Clerk, Auth0)
- [ ] Implement rate limiting
- [ ] Validate all API inputs
- [ ] Use HTTPS only (Vercel/Netlify do this automatically)
- [ ] Set up CORS policies
- [ ] Rotate API keys regularly
- [ ] Enable 2FA on all accounts
- [ ] Set up security headers

---

Need help? Check [SETUP.md](SETUP.md), [CONFIGURATION.md](CONFIGURATION.md), or open an [issue](https://github.com/YourUsername/mission-control-template/issues).
