# Electron App Troubleshooting

## Issue: App shows "Loading..." and doesn't proceed

### Possible Causes:
1. **Environment variables not available** - Supabase credentials aren't being loaded
2. **HTML file path incorrect** - The app can't find the built files
3. **Supabase client not initializing** - The mock client is being used instead of real client

### Solutions:

#### 1. Check DevTools Console
The app now opens DevTools automatically. Check the console for:
- Error messages about loading files
- Warnings about Supabase env vars
- Any JavaScript errors

#### 2. Environment Variables
The Electron app needs Supabase environment variables. They can be provided via:

**Option A: .env.local file** (recommended for development)
- Create `.env.local` in the project root with:
  ```
  NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
  NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
  ```
- The Electron app will automatically load these when packaged

**Option B: System Environment Variables**
- Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` as system environment variables
- Restart the Electron app after setting them

#### 3. Rebuild the App
After making changes to `electron/main.js`, you need to rebuild:
```bash
npm run build:electron
```

#### 4. Check the Console Output
When you run the installed app, check:
- The DevTools console (should open automatically)
- Look for messages like:
  - "Loading HTML from: ..."
  - "Supabase env vars injected" or "Supabase env vars not found"
  - Any error messages

### Quick Fix:
1. Make sure you have a `.env.local` file with your Supabase credentials
2. Rebuild: `npm run build:electron` (as Administrator)
3. Reinstall the app
4. Check DevTools console for errors

