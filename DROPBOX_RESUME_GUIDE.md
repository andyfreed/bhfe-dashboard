# Guide: Resuming Dropbox Sync Tomorrow

## ✅ Current Status
- Dropbox sync is **PAUSED** until tomorrow
- `.next` and `node_modules` are **EXCLUDED** from sync
- Development should work smoothly now

## When You Resume Dropbox Sync Tomorrow

### Before Resuming Sync:

1. **Stop the dev server** (Ctrl+C in terminal)

2. **Verify exclusions are still set:**
   - Open Dropbox Preferences → Sync
   - Check that these are still **UNCHECKED**:
     - ✅ `.next` folder
     - ✅ `node_modules` folder
     - ✅ `.env.local` (your environment variables)

3. **Important folders that SHOULD sync:**
   - All source code (`.ts`, `.tsx`, `.js`, `.jsx` files)
   - Configuration files (`package.json`, `next.config.ts`, etc.)
   - Documentation (`.md` files)
   - `supabase/schema.sql`
   - `components/`, `app/`, `lib/` directories

### Resume Dropbox Sync

1. Right-click Dropbox icon → **Resume syncing**
2. Verify it's syncing without errors
3. Check that `.next` and `node_modules` are NOT syncing (no icons on them)

## Best Practice Going Forward

### Option 1: Keep Dropbox Paused While Developing (Recommended)
- Pause Dropbox when you start working
- Resume when you're done for the day
- This eliminates all sync conflicts

### Option 2: Use Git Instead of Dropbox (Best Practice)
- Push code to GitHub regularly
- Dropbox becomes a backup only (not for active development)
- No sync conflicts ever

### Option 3: Move Project Outside Dropbox
- Move to: `C:\Projects\bhfe-dashboard` or `D:\Projects\bhfe-dashboard`
- Use Git for version control
- Sync only source code files to Dropbox (not entire project)

## What to Exclude from Dropbox (Always)

**NEVER sync these:**
- `.next/` - Build cache (recreated on every dev/build)
- `node_modules/` - Dependencies (can reinstall with `npm install`)
- `.env.local` - Your environment variables (sensitive!)
- `.vercel/` - Vercel config (if exists)
- `*.log` - Log files
- `.swc/` - SWC compiler cache

**ALWAYS sync these:**
- Source code files
- Configuration files
- Documentation
- Database schemas
- Git repository (`.git/` folder)

## Troubleshooting

If you get file lock errors after resuming:
1. Stop dev server
2. Delete `.next` folder
3. Verify exclusions are still set
4. Restart dev server

If `node_modules` still causes issues:
1. Delete `node_modules`
2. Verify it's excluded from sync
3. Run `npm install` again

## Quick Commands

```powershell
# Clean build folder
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue

# Reinstall dependencies
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
npm install

# Check Dropbox sync status
# (Check Dropbox icon in system tray)
```

## Summary

With Dropbox paused and folders excluded, you should have a smooth development experience. When you resume sync tomorrow, just make sure the exclusions are still in place!

