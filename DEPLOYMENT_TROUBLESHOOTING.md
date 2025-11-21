# Deployment Troubleshooting

## Issue: Commits pushed but Vercel not deploying

### Current Status
- ✅ Commits are pushed to GitHub: `8b4395d` is on `origin/main`
- ✅ Repository: `https://github.com/PierreCStars/stars-vacation-management.git`
- ❓ Vercel deployment not triggering automatically

## Possible Causes

### 1. Vercel Webhook Not Configured
Vercel needs a webhook from GitHub to trigger deployments.

**Check:**
1. Go to GitHub repository: https://github.com/PierreCStars/stars-vacation-management
2. Go to Settings → Webhooks
3. Look for a Vercel webhook (should have `vercel.com` in the URL)
4. If missing, Vercel needs to be reconnected

**Fix:**
1. Go to Vercel Dashboard
2. Project Settings → Git
3. Disconnect and reconnect the GitHub repository
4. This will recreate the webhook

### 2. Vercel Project Not Connected to GitHub
The project might not be connected to the GitHub repository.

**Check:**
1. Vercel Dashboard → Your Project
2. Settings → Git
3. Verify it shows: `PierreCStars/stars-vacation-management`

**Fix:**
If not connected:
1. Settings → Git → Connect Git Repository
2. Select the repository
3. Configure branch (should be `main`)

### 3. Wrong Branch Being Watched
Vercel might be watching a different branch.

**Check:**
1. Vercel Dashboard → Project Settings → Git
2. Verify "Production Branch" is set to `main`

**Fix:**
Change Production Branch to `main` if it's different

### 4. Manual Deployment Required
Sometimes you need to trigger a deployment manually.

**Option 1: Via Vercel Dashboard**
1. Go to Vercel Dashboard → Your Project
2. Click "Deployments" tab
3. Click "Redeploy" on the latest deployment
4. Or click "Create Deployment" → Select branch `main`

**Option 2: Via Vercel CLI**
```bash
# If Vercel CLI is installed
vercel --prod
```

### 5. GitHub Webhook Delivery Issues
The webhook might be failing silently.

**Check:**
1. GitHub → Settings → Webhooks
2. Find Vercel webhook
3. Check "Recent Deliveries"
4. Look for failed deliveries (red X)

**Fix:**
- If webhook is failing, disconnect and reconnect in Vercel
- Check if webhook URL is correct
- Verify Vercel project still exists

## Quick Fix Steps

### Step 1: Verify GitHub Connection
1. Go to Vercel Dashboard
2. Project → Settings → Git
3. Confirm repository is connected

### Step 2: Check Webhook
1. GitHub → Repository → Settings → Webhooks
2. Verify Vercel webhook exists and is active

### Step 3: Manual Trigger
1. Vercel Dashboard → Deployments
2. Click "Redeploy" or create new deployment from `main` branch

### Step 4: Verify Branch
1. Vercel Dashboard → Settings → Git
2. Ensure Production Branch = `main`

## Alternative: Force Deployment via CLI

If Vercel CLI is installed:
```bash
cd /Users/mktcomm/stars-vacation-management
vercel --prod
```

This will:
- Build the project
- Deploy to production
- Bypass webhook issues

## Verification

After fixing, verify:
1. New deployment appears in Vercel Dashboard
2. Build logs show the latest commit `8b4395d`
3. Deployment completes successfully
4. App is updated with new changes

## Next Steps

1. **Check Vercel Dashboard** - See if there are any error messages
2. **Check GitHub Webhooks** - Verify webhook is configured
3. **Manual Deploy** - Trigger deployment manually if needed
4. **Contact Support** - If issues persist, check Vercel status page

