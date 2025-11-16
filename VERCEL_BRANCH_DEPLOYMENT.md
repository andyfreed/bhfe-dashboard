# Accessing Vercel Branch Deployments

## The Issue
Vercel creates **preview deployments** for each branch. These preview URLs are usually public, but sometimes Vercel requires authentication depending on your project settings.

## Solutions

### Option 1: Find the Preview Deployment URL

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click on your project (`bhfe-dashboard`)
3. Go to the **"Deployments"** tab
4. Find the deployment for the `iphone` branch (look for the branch name in the deployment list)
5. Click on that deployment
6. The URL should be visible at the top (e.g., `bhfe-dashboard-git-iphone-abc123.vercel.app`)
7. **Click the URL** - it should work directly without login

### Option 2: Configure Vercel Settings (Make Previews Public)

1. Go to Vercel Dashboard → Your Project → **Settings**
2. Scroll down to **"Security"** or **"Deployment Protection"**
3. Look for **"Preview Deployments"** settings
4. Make sure **"Require Authentication"** is **disabled** for preview deployments
5. Save settings

### Option 3: Merge to Main (Recommended)

If you want to use the main deployment URL (like you do for the main branch), merge the `iphone` branch to `main`:

```bash
# Switch to main
git checkout main

# Pull latest changes
git pull origin main

# Merge iphone branch
git merge iphone

# Push to main (this triggers production deployment)
git push origin main
```

This will deploy to your main production URL, so you can access it like your main branch.

### Option 4: Make `iphone` Branch the Production Branch

1. Go to Vercel Dashboard → Your Project → **Settings**
2. Go to **"Git"** section
3. Find **"Production Branch"**
4. Change it from `main` to `iphone`
5. Save settings

⚠️ **Warning:** This makes `iphone` your production branch, so production deployments will only happen from `iphone` branch.

## Recommendation

**Merge to main** (Option 3) is usually best because:
- ✅ You keep using the main deployment URL
- ✅ All features are in one place
- ✅ Standard workflow

Do you want me to merge `iphone` into `main`?

