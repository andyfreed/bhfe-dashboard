# PWA (Progressive Web App) Setup for iPhone

This app is now configured as a Progressive Web App (PWA) that can be installed on iPhone home screens and supports push notifications.

## Features Enabled

✅ **Home Screen Installation** - Users can add the app to their iPhone home screen with a custom icon
✅ **Push Notifications** - Get notified about new chat messages (requires iOS 16.4+ and home screen installation)
✅ **Offline Support** - Basic service worker for offline functionality
✅ **App-like Experience** - Standalone display mode when added to home screen

## Setup Requirements

### 1. Add App Icons

You need to add three icon files to the `public` folder:

- `icon-192x192.png` (192x192 pixels)
- `icon-512x512.png` (512x512 pixels)
- `apple-icon-180x180.png` (180x180 pixels)

See `public/ICON_INSTRUCTIONS.md` for detailed instructions.

### 2. Build and Deploy

The PWA features are **disabled in development mode** for performance. To test:

1. Build the production version:
   ```bash
   npm run build
   ```

2. Start the production server:
   ```bash
   npm start
   ```

3. Or deploy to Vercel (production build automatically enables PWA)

## How to Install on iPhone

1. **Open the app** in Safari on your iPhone
2. **Tap the Share button** (square with arrow pointing up)
3. **Scroll down and tap "Add to Home Screen"**
4. **Edit the name** if desired (default: "BHFE Dashboard")
5. **Tap "Add"**

The app icon will now appear on your home screen!

## How Notifications Work

### Prerequisites

- iOS 16.4 or later
- App must be added to home screen (not just opened in Safari)
- User must grant notification permission

### Notification Flow

1. **First Time**: User will see a prompt asking to enable notifications (appears after a few seconds on first visit)
2. **Permission**: User can click "Enable" to allow notifications
3. **Notifications**: Users will receive notifications for:
   - New chat messages (when not on the chat page)

### Testing Notifications

1. Install the app on your iPhone home screen
2. Grant notification permission when prompted
3. Have someone send a chat message while you're on a different page
4. You should receive a notification

## Technical Details

### Files Created/Modified

- `public/manifest.json` - Web app manifest with app metadata
- `next.config.ts` - Configured with `next-pwa` plugin
- `app/layout.tsx` - Added iOS meta tags and notification prompt
- `lib/notifications.ts` - Notification service utilities
- `hooks/useNotifications.ts` - React hook for notifications
- `components/NotificationPrompt.tsx` - Component to request notification permission
- `app/dashboard/chat/page.tsx` - Integrated notifications for new messages

### Service Worker

The `next-pwa` package automatically generates a service worker that:
- Caches app assets for offline use
- Handles push notifications
- Manages app updates

Service worker files are generated in the `public` folder during build and are automatically ignored in git (see `.gitignore`).

## Browser Support

- **iPhone (Safari)**: Full support (iOS 16.4+ for notifications)
- **Android (Chrome)**: Full support
- **Desktop**: Full support (can install as desktop app)

## Troubleshooting

### Notifications Not Working

1. **Check iOS version**: Must be iOS 16.4 or later
2. **Check installation**: App must be added to home screen
3. **Check permission**: Go to Settings > BHFE Dashboard > Notifications and ensure enabled
4. **Test in production**: Notifications only work in production builds, not development

### Icon Not Showing

1. **Verify icon files exist** in `public` folder
2. **Clear Safari cache** and reload
3. **Remove and re-add** to home screen
4. **Check file names** match exactly: `apple-icon-180x180.png`

### Service Worker Issues

If the service worker is causing issues:

1. **Clear browser data**: Settings > Safari > Clear History and Website Data
2. **Hard reload**: Hold Shift and click Reload
3. **Reinstall**: Remove from home screen and add again

## Future Enhancements

Potential improvements:
- Background sync for offline actions
- Scheduled notifications for reminders/todos
- Badge counts on home screen icon
- More notification types (new todos, calendar events, etc.)

