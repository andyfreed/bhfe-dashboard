# Push Notifications Setup Guide

This guide explains how to set up Web Push API for notifications that work even when the app is closed.

## Prerequisites

- Node.js installed
- Supabase database access
- Production deployment (Vercel or similar)

## Step 1: Generate VAPID Keys

VAPID keys are required for Web Push API. Run the following command to generate them:

```bash
node scripts/generate-vapid-keys.js
```

This will output three environment variables:
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY` - Public key (safe to expose in client-side code)
- `VAPID_PRIVATE_KEY` - Private key (keep secret!)
- `VAPID_SUBJECT` - Email address or URL (e.g., `mailto:admin@bhfe.com`)

## Step 2: Add Environment Variables

Add the VAPID keys to your environment variables:

### Local Development (.env.local)
```env
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your-public-key-here
VAPID_PRIVATE_KEY=your-private-key-here
VAPID_SUBJECT=mailto:admin@bhfe.com
```

### Production (Vercel)

1. Go to your Vercel project settings
2. Navigate to "Environment Variables"
3. Add the three variables:
   - `NEXT_PUBLIC_VAPID_PUBLIC_KEY` (Production)
   - `VAPID_PRIVATE_KEY` (Production)
   - `VAPID_SUBJECT` (Production)

**Important:** The `NEXT_PUBLIC_` prefix makes the public key available to client-side code, which is required for push subscriptions.

## Step 3: Run Database Migration

Run the push subscriptions migration in your Supabase SQL editor:

1. Open Supabase Dashboard
2. Go to SQL Editor
3. Run the migration file: `supabase/migrations/create_push_subscriptions.sql`

This creates the `push_subscriptions` table to store user push subscriptions.

## Step 4: Deploy to Production

1. Push your code to GitHub
2. Vercel will automatically deploy
3. Make sure environment variables are set in Vercel

## Step 5: Test Push Notifications

1. **Open the app** in your browser (must be HTTPS in production)
2. **Enable notifications** - You'll be prompted to allow notifications
3. **Register for push** - The app will automatically register for push notifications
4. **Test** - Have someone send a chat message while your app is closed
5. **You should receive a notification** even when the app is fully closed!

## How It Works

1. **User enables notifications** - Browser requests notification permission
2. **Push subscription** - Browser creates a push subscription with VAPID public key
3. **Subscription stored** - Subscription is saved to Supabase database
4. **Message sent** - When a chat message is created, the app calls `/api/push/send`
5. **Push notification sent** - Server uses VAPID private key to send push notification
6. **Service worker receives** - Service worker handles push event even when app is closed
7. **Notification shown** - User sees notification on their device

## Troubleshooting

### Notifications Not Working

1. **Check VAPID keys** - Ensure they're set in environment variables
2. **Check HTTPS** - Push notifications require HTTPS (localhost is exception)
3. **Check service worker** - Open browser DevTools > Application > Service Workers
4. **Check subscription** - Open browser DevTools > Application > Service Workers > Push > Subscriptions
5. **Check console** - Look for `[Push]` logs in browser console

### Common Issues

**"VAPID keys not configured"**
- Ensure environment variables are set correctly
- Restart your dev server after adding variables
- In production, ensure variables are set in Vercel

**"Subscription expired or invalid"**
- Browser may have unsubscribed
- Re-enable notifications to get a new subscription

**"Push notifications not supported"**
- Ensure you're using HTTPS (required for push notifications)
- Check browser support (iOS 16.4+, modern browsers)

## Browser Support

- ✅ **iOS 16.4+** - Full support when added to home screen
- ✅ **Android** - Full support
- ✅ **Desktop Chrome/Edge** - Full support
- ✅ **Desktop Firefox** - Full support
- ❌ **Desktop Safari** - Limited support (no push when app closed)
- ❌ **iOS < 16.4** - Not supported

## Security Notes

- **Never expose** `VAPID_PRIVATE_KEY` in client-side code
- The `NEXT_PUBLIC_VAPID_PUBLIC_KEY` is safe to expose
- VAPID keys identify your application to push services
- Each app should have unique VAPID keys

## API Routes

- `POST /api/push/subscribe` - Register a push subscription
- `DELETE /api/push/subscribe` - Unregister a push subscription
- `GET /api/push/vapid-public-key` - Get VAPID public key
- `POST /api/push/send` - Send a push notification (requires auth)

## Files Created

- `lib/push.ts` - Server-side push utilities
- `lib/push-client.ts` - Client-side push utilities
- `app/api/push/subscribe/route.ts` - Subscription API
- `app/api/push/vapid-public-key/route.ts` - Public key API
- `app/api/push/send/route.ts` - Send notification API
- `public/sw-push-handler.js` - Service worker push handler
- `supabase/migrations/create_push_subscriptions.sql` - Database migration
- `scripts/generate-vapid-keys.js` - VAPID key generator

