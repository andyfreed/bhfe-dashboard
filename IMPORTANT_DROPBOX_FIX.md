# ⚠️ CRITICAL: Exclude .next Folder from Dropbox NOW

## The Problem

You're getting errors because **Dropbox is syncing the `.next` folder**, which Next.js is constantly updating during development. This causes file conflicts and missing files.

## ✅ Solution: Exclude .next from Dropbox Sync (Do This Now!)

### Method 1: Via Dropbox Desktop App (Recommended)

1. **Right-click the Dropbox icon** in your system tray (bottom-right corner)
2. Click your **profile picture** → **Preferences** (or Settings)
3. Go to the **"Sync"** tab
4. Click **"Selective Sync"** or **"Choose folders to sync"**
5. Find and expand **`AppWebFiles`** → **`bhfe-dashboard`**
6. **UNCHECK** these folders:
   - ✅ `.next` (MUST exclude)
   - ✅ `node_modules` (also exclude for performance)
7. Click **"Update"** or **"OK"**
8. **Wait for Dropbox to finish** (you'll see syncing stop)

### Method 2: Via Dropbox Website

1. Go to [dropbox.com](https://www.dropbox.com)
2. Sign in
3. Navigate to **`AppWebFiles/bhfe-dashboard`**
4. Right-click on **`.next`** folder → **Selective Sync** → Uncheck it
5. Do the same for **`node_modules`**

### Method 3: Create a Script (Alternative)

If Dropbox sync keeps interfering, you can temporarily pause sync while developing:

1. **Pause Dropbox sync** while working:
   - Right-click Dropbox icon → **Pause syncing** → **2 hours**
   - Work on your project
   - Resume sync when done

## After Excluding .next

1. **Stop the dev server** if it's running (Ctrl+C in terminal)
2. **Delete .next folder:**
   ```powershell
   Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
   ```
3. **Wait 10 seconds** for Dropbox to finish
4. **Restart dev server:**
   ```bash
   npm run dev
   ```

## How to Verify It's Excluded

1. Look at the **`.next`** folder in File Explorer
2. If there's a **green checkmark** or sync icon, Dropbox is still syncing it
3. If there's **no icon**, it's excluded (good!)

## Why This Happens

- `.next` folder contains build cache files that Next.js constantly updates
- Dropbox tries to sync these files in real-time
- When Next.js tries to write/rename files, Dropbox locks them
- This causes: `ENOENT`, `EPERM`, and missing manifest errors

## Alternative: Move Project Outside Dropbox

If Dropbox continues causing issues:

1. **Move project** to a non-Dropbox folder:
   - Example: `C:\Projects\bhfe-dashboard`
   - Or: `D:\Projects\bhfe-dashboard`
2. **Use Git/GitHub** for version control instead
3. **No sync conflicts** during development

## Current Status

✅ **Server should be running** if you've excluded `.next`  
✅ **Manifest file created** successfully  
✅ **Dependencies installed** correctly

If errors continue, **exclude `.next` from Dropbox sync** and try again!

