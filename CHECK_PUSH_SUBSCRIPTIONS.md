# How to Check Push Subscriptions

## On iPhone - No Console Access Needed

I've added a **Push Subscription Debug** component at the top of the Chat page that shows:
- Notification permission status
- Whether push subscription exists
- Whether it's synced with the server
- The subscription endpoint (first 80 characters)
- Any errors

Just open the Chat page and you'll see the debug card at the top!

## Query Database in Supabase

To check if push subscriptions are stored in the database, run this SQL query in Supabase SQL Editor:

```sql
-- View all push subscriptions
SELECT 
  ps.id,
  ps.user_id,
  p.name,
  p.email,
  LEFT(ps.endpoint, 50) as endpoint_preview,
  ps.created_at,
  ps.updated_at
FROM public.push_subscriptions ps
LEFT JOIN public.profiles p ON ps.user_id = p.id
ORDER BY ps.created_at DESC;
```

Or to check subscriptions for a specific user:

```sql
-- View subscriptions for a specific user (replace with actual email)
SELECT 
  ps.*,
  p.name,
  p.email
FROM public.push_subscriptions ps
JOIN public.profiles p ON ps.user_id = p.id
WHERE p.email = 'your-email@example.com';
```

## Do You Need to Reinstall?

**Short answer: Usually not, but sometimes yes.**

### Service Worker Updates
- **For service worker changes**: You may need to clear cache or reinstall
- **For code changes**: Usually just refresh the page

### How to Clear Service Worker on iPhone:
1. Open Settings > Safari
2. Scroll down to "Advanced"
3. Tap "Website Data"
4. Find your app's URL
5. Swipe left and tap "Delete"
6. Or use "Remove All Website Data" (clears everything)

### After Pushing Updates:
1. **Refresh the page** (pull down to refresh)
2. If that doesn't work, **clear Safari cache** (see above)
3. If still not working, **remove and re-add** the app to home screen:
   - Long press the app icon
   - Tap "Remove from Home Screen"
   - Open Safari and go to your app URL
   - Tap Share > "Add to Home Screen" again

### Quick Test After Updates:
1. Open the app
2. Go to the Chat page
3. Check the "Push Subscription Debug" card at the top
4. Click "Check Status" button
5. If it shows "Push Subscription: Not Found", click "Register Push"

## Debugging Checklist

1. ✅ **Check Debug Card** on Chat page
2. ✅ **Check Database** using SQL queries above
3. ✅ **Verify VAPID Keys** are set in Vercel environment variables
4. ✅ **Check Notification Permission** is granted (Settings > BHFE Dashboard > Notifications)
5. ✅ **Test with Test Button** in NotificationTest component
6. ✅ **Send Chat Message** and check console logs (if accessible)
7. ✅ **Check Vercel Logs** for API route errors (`/api/push/send`)

## Common Issues

### "Push Subscription: Not Found"
- Click "Register Push" button on the debug card
- Or enable notifications if not already enabled

### "Server Sync: Not Synced"
- The subscription exists locally but isn't in the database
- Click "Register Push" to sync it

### No Notifications When App Closed
- This is an **iOS limitation** - push notifications may not work when app is fully closed
- They should work when app is in background
- Check if push subscription is registered (debug card)
- Check if subscription is in database (SQL query)

## Viewing Console Logs on iPhone (Optional)

If you have a Mac, you can use Safari Web Inspector:
1. Connect iPhone to Mac via USB
2. On iPhone: Settings > Safari > Advanced > Web Inspector (enable)
3. On Mac: Safari > Develop > [Your iPhone] > [Your App]
4. This opens the console where you can see all logs

But the debug card should be enough for most cases!

