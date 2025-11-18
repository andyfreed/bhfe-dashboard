# Electron Desktop App Setup

This app can now be built as both a web application and a Windows desktop application (.exe).

## Structure

- **Web app**: Runs normally on Next.js (unchanged)
- **Desktop app**: Uses Electron to wrap the Next.js app in a native window

Both versions share the same codebase and stay in sync automatically.

## Development

### Web Development (Normal)
```bash
npm run dev
```
Runs the Next.js app at http://localhost:3000

### Electron Development
```bash
npm run dev:electron
```
Runs Next.js dev server AND opens Electron window. Changes hot-reload in both.

## Building

### Build Web App
```bash
npm run build:web
```
Builds the Next.js app for web deployment (Vercel, Netlify, etc.)

### Build Electron App
```bash
npm run build:electron
```
Builds the Next.js app as static export and packages it into a Windows installer (.exe)

### Build Electron (Directory Only)
```bash
npm run build:electron:dir
```
Builds Electron app without creating installer - useful for testing

## How It Works

1. **Conditional Builds**: The `next.config.ts` detects `ELECTRON_BUILD=true` and switches to static export mode
2. **Electron Wrapper**: `electron/main.js` creates a native window and loads your app
3. **Environment Detection**: Use `isElectron()` from `lib/utils.ts` to detect if running in Electron
4. **Shared Codebase**: 95%+ of code is shared between web and desktop

## Detecting Electron in Your Code

```typescript
import { isElectron, getElectronAPI } from '@/lib/utils'

if (isElectron()) {
  // Desktop-specific code
  const electronAPI = getElectronAPI()
  // Use electronAPI for desktop features
} else {
  // Web-specific code
}
```

## Notes

- **API Routes**: Currently, API routes (`app/api/*`) won't work in the Electron build because it uses static export. These need to be handled differently for desktop (e.g., direct Supabase calls or Electron IPC).
- **PWA Features**: PWA features are disabled in Electron builds
- **Auto-Updates**: Can be added later using `electron-updater`

## Next Steps

1. Install dependencies: `npm install`
2. Test Electron dev: `npm run dev:electron`
3. Build installer: `npm run build:electron`
4. Installer will be in `dist/` folder

