# Manual Vercel Deployment Guide

## Issue: Automatic deployments not triggering

Since automatic deployments via GitHub webhooks are not working, here are manual deployment options.

## Option 1: Manual Deployment via Vercel Dashboard (Recommended)

### Steps:
1. **Go to Vercel Dashboard**
   - Visit: https://vercel.com/dashboard
   - Login to your account

2. **Select Your Project**
   - Find: `stars_vacation_management_v2`
   - Click on it

3. **Create Manual Deployment**
   - Click on **"Deployments"** tab
   - Click **"Create Deployment"** button (top right)
   - Select:
     - **Git Repository**: `PierreCStars/stars-vacation-management`
     - **Branch**: `main`
     - **Production**: Check this box
   - Click **"Deploy"**

4. **Monitor Deployment**
   - Watch the build logs
   - Wait for deployment to complete
   - Check for any build errors

## Option 2: Install Vercel CLI and Deploy

### Install Vercel CLI:
```bash
npm install -g vercel
```

### Login to Vercel:
```bash
vercel login
```

### Deploy from project directory:
```bash
cd /Users/mktcomm/stars-vacation-management
vercel --prod
```

This will:
- Build the project
- Deploy to production
- Show deployment URL

## Option 3: Fix GitHub Webhook (Permanent Solution)

### Check Webhook Status:
1. Go to: https://github.com/PierreCStars/stars-vacation-management/settings/hooks
2. Look for Vercel webhook (URL contains `vercel.com`)
3. Check "Recent Deliveries" for any failures

### Reconnect Repository in Vercel:
1. **Vercel Dashboard** → Your Project
2. **Settings** → **Git**
3. Click **"Disconnect"** (if connected)
4. Click **"Connect Git Repository"**
5. Select: `PierreCStars/stars-vacation-management`
6. Configure:
   - **Production Branch**: `main`
   - **Framework Preset**: Next.js (auto-detected)
7. Click **"Connect"**

This will:
- Create a new webhook
- Enable automatic deployments
- Future pushes to `main` will auto-deploy

## Option 4: Use Vercel API (Advanced)

If you have a Vercel API token:

```bash
# Set your Vercel token
export VERCEL_TOKEN="your-vercel-token"

# Trigger deployment
curl -X POST \
  "https://api.vercel.com/v13/deployments?projectId=prj_EZJW12NzwMFdp7idK1WvpZUO0iYx" \
  -H "Authorization: Bearer $VERCEL_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "stars_vacation_management_v2",
    "gitSource": {
      "type": "github",
      "repo": "PierreCStars/stars-vacation-management",
      "ref": "main"
    }
  }'
```

## Verification

After manual deployment:
1. ✅ Check Vercel Dashboard → Deployments → Latest deployment shows commit `234c703`
2. ✅ Build completes successfully
3. ✅ App is accessible at production URL
4. ✅ Test `/api/calendar/diagnostic` endpoint
5. ✅ Test "Sync to Calendar" button

## Why Webhooks Might Not Work

Common causes:
1. **Webhook not created** - Repository never connected in Vercel
2. **Webhook deleted** - Repository was disconnected
3. **Webhook failing** - Authentication issues or incorrect URL
4. **Branch mismatch** - Vercel watching different branch
5. **Vercel project settings** - Auto-deployments disabled

## Quick Fix Checklist

- [ ] Check Vercel Dashboard for project connection
- [ ] Verify GitHub webhook exists
- [ ] Try manual deployment via dashboard
- [ ] Reconnect repository if needed
- [ ] Verify production branch is `main`
- [ ] Check webhook delivery logs in GitHub

## Next Steps

1. **Immediate**: Use Option 1 (Manual Deployment) to deploy now
2. **Permanent**: Use Option 3 (Fix Webhook) to enable auto-deployments
3. **Verify**: Test the deployed app to ensure Google Calendar fixes are live

