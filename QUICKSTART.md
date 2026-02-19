# 🚀 Quick Start Guide

Get Mission Control running in **5 minutes**.

---

## Step 1: Clone & Install

```bash
git clone https://github.com/ShoafSystems/mission-control-template.git
cd mission-control-template
npm install
```

## Step 2: Set Up Convex

```bash
npx convex login    # Login with GitHub
npx convex dev      # Start backend (keep this running!)
```

This auto-creates your `.env.local` with deployment credentials.

## Step 3: Start Frontend

**In a new terminal:**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Step 4: Seed Data

Click **"DEPLOY AGENT SQUAD"** button on the page, or run:

```bash
npx convex run seed:seed
```

## Step 5: Test API

```bash
curl -X POST http://localhost:3000/api/heartbeat \
  -H "Content-Type: application/json" \
  -d '{"name":"Jarvis","status":"active","currentTask":"Testing"}'
```

---

## ✅ You're Ready!

Your dashboard is live. Now:

1. **Customize agents** in `convex/seed.ts`
2. **Add metrics** in `src/components/MetricsBar.tsx`
3. **Integrate your agents** via the [HTTP API](README.md#-http-api-endpoints)
4. **Deploy to production** with `npx convex deploy && vercel --prod`

---

## 📚 Next Steps

- **Full Setup Guide:** [docs/SETUP.md](docs/SETUP.md)
- **Configuration:** [docs/CONFIGURATION.md](docs/CONFIGURATION.md)
- **Deployment:** [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)
- **Customization:** [docs/CUSTOMIZATION.md](docs/CUSTOMIZATION.md)

---

## 🆘 Troubleshooting

**"Convex deployment not found"**
- Make sure `npx convex dev` is running

**Port 3000 in use**
```bash
PORT=3001 npm run dev
```

**Empty dashboard**
- Click "DEPLOY AGENT SQUAD" or run `npx convex run seed:seed`

---

## 💬 Need Help?

- Check the [full README](README.md)
- Review [docs/](docs/) folder
- Open an [issue](https://github.com/ShoafSystems/mission-control-template/issues)

---

**Happy building!** 🎯
