#!/bin/bash
set -e

echo "🎯 Mission Control Deployment"
echo "=============================="
echo ""

# Step 1: Login to Convex (if not already)
echo "Step 1: Logging into Convex..."
npx convex login

# Step 2: Deploy Convex backend
echo ""
echo "Step 2: Deploying Convex backend..."
npx convex deploy

# Step 3: Get the deployment URL
echo ""
echo "Step 3: Getting deployment URLs..."
CONVEX_URL=$(grep NEXT_PUBLIC_CONVEX_URL .env.local | cut -d= -f2)
SITE_URL=$(grep NEXT_PUBLIC_CONVEX_SITE_URL .env.local | cut -d= -f2)

echo "  Convex URL: $CONVEX_URL"
echo "  HTTP Actions URL: $SITE_URL"

# Step 4: Deploy to Vercel
echo ""
echo "Step 4: Deploying to Vercel..."
npx vercel --prod

echo ""
echo "=============================="
echo "🎯 Mission Control is LIVE!"
echo ""
echo "HTTP Endpoints for agents:"
echo "  POST $SITE_URL/api/heartbeat"
echo "  POST $SITE_URL/api/activity"
echo "  POST $SITE_URL/api/task-update"
echo "  POST $SITE_URL/api/metric"
echo ""
echo "Seed data: Open the dashboard and click 'DEPLOY AGENT SQUAD'"
echo "Or run: npx convex run seed:seed"
