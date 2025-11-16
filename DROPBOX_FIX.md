# Fixing Dropbox Sync Issues with Next.js

The `.next` folder should **NOT** be synced by Dropbox as it causes file permission errors during development.

## Solution 1: Exclude `.next` from Dropbox Sync (Recommended)

1. **Right-click the `bhfe-dashboard` folder** in File Explorer
2. Select **"Choose folders to sync"** (or Dropbox Preferences > Sync)
3. Uncheck the `.next` folder
4. Click **"Update"**

OR

1. Open **Dropbox Preferences**
2. Go to **"Sync"** tab
3. Click **"Advanced"** or **"Selective Sync"**
4. Uncheck the `.next` folder
5. Click **"Update"**

## Solution 2: Move `.next` Outside Dropbox (Alternative)

If you can't exclude it, you can configure Next.js to build outside Dropbox:

1. Create a folder outside Dropbox (e.g., `C:\nextjs-cache`)
2. Update `next.config.ts`:
   ```typescript
   const nextConfig: NextConfig = {
     distDir: '../nextjs-cache/.next',
   };
   ```

However, **Solution 1 is recommended** as it's simpler.

## Solution 3: Use `.dropboxignore` (If Supported)

Create a `.dropboxignore` file in the project root:
```
.next/
node_modules/
.env.local
```

Note: Dropbox doesn't natively support `.dropboxignore` like Git, but some third-party tools can use it.

## Quick Fix for Current Error

1. **Stop the dev server** (Ctrl+C)
2. **Delete the `.next` folder**:
   ```powershell
   Remove-Item -Recurse -Force .next
   ```
3. **Exclude `.next` from Dropbox** (see Solution 1 above)
4. **Restart the dev server**:
   ```bash
   npm run dev
   ```

## Additional Tips

- **`.gitignore` already excludes `.next`** - good for Git, but Dropbox sync is separate
- **`node_modules` should also be excluded** from Dropbox for performance
- Only sync source code, not build artifacts or dependencies

## Verify Fix

After excluding `.next` from Dropbox:
1. Start dev server: `npm run dev`
2. If the error persists, try:
   ```powershell
   # Clear Next.js cache
   Remove-Item -Recurse -Force .next
   Remove-Item -Recurse -Force node_modules/.cache -ErrorAction SilentlyContinue
   npm run dev
   ```

