# Quick Fix: Exclude Folders from Dropbox Sync

## ⚠️ IMPORTANT: Do this BEFORE running `npm run dev`

The `.next` folder is created automatically when you start the dev server. We need to exclude it (and `node_modules`) from Dropbox sync to prevent file permission errors.

## Step-by-Step Instructions

### Option 1: Exclude via Dropbox Website (Easiest)

1. Go to [Dropbox.com](https://www.dropbox.com) and sign in
2. Navigate to your `AppWebFiles` folder
3. Find the `bhfe-dashboard` folder
4. Right-click on it
5. Select **"Selective Sync"** or **"Sync settings"**
6. Uncheck:
   - ✅ **`.next`** (when it appears after you run npm run dev)
   - ✅ **`node_modules`** (already exists)

### Option 2: Exclude via Dropbox Desktop App

1. Click the **Dropbox icon** in your system tray (bottom right)
2. Click your **profile picture/icon** → **Preferences** (or Settings)
3. Go to the **"Sync"** tab
4. Click **"Selective Sync"** or **"Choose folders to sync"**
5. Expand your `AppWebFiles` → `bhfe-dashboard` folder
6. Uncheck:
   - ✅ **`.next`** (will appear after running npm run dev)
   - ✅ **`node_modules`**
7. Click **"Update"** or **"OK"**

### Option 3: Move Project Outside Dropbox (Alternative)

If Dropbox sync continues to cause issues, you could:

1. Move the entire project to a non-Dropbox folder (e.g., `C:\Projects\bhfe-dashboard`)
2. Keep your code in Git/GitHub for version control
3. This eliminates all Dropbox sync issues

## What to Exclude

**ALWAYS exclude from Dropbox:**
- `.next/` - Next.js build cache (created automatically)
- `node_modules/` - npm packages (can be reinstalled with `npm install`)
- `.env.local` - Your environment variables (sensitive data)
- `.vercel/` - Vercel configuration (if exists)

**ALWAYS sync:**
- All source code files (`.ts`, `.tsx`, `.js`, `.jsx`)
- Configuration files (`package.json`, `next.config.ts`, etc.)
- Documentation (`.md` files)
- Database schema (`supabase/schema.sql`)

## After Excluding Folders

1. **Verify exclusions** are set in Dropbox
2. **Run the dev server:**
   ```bash
   npm run dev
   ```
3. **When `.next` is created**, Dropbox should ignore it automatically (if you excluded it)

## If You Still Get Errors

If the error persists after excluding:

1. **Stop the dev server** (Ctrl+C)
2. **Delete `.next` folder** (if it exists):
   ```powershell
   Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
   ```
3. **Wait 10 seconds** for Dropbox to finish syncing
4. **Start dev server again:**
   ```bash
   npm run dev
   ```

## Why This Happens

- Dropbox syncs files in real-time
- Next.js constantly creates/updates files in `.next` during development
- Dropbox tries to sync these files while Next.js is using them
- This causes file locks and permission errors
- Solution: Don't sync build/cache folders!

