// API route to test push notifications (for debugging)
// This allows you to manually trigger a push notification to yourself

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendPushNotification } from '@/lib/push'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all push subscriptions for the current user
    const { data: subscriptions, error: fetchError } = await supabase
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth')
      .eq('user_id', user.id)

    if (fetchError) {
      console.error('[Push Test] Error fetching subscriptions:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch subscriptions' }, { status: 500 })
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.warn('[Push Test] No subscriptions found for current user')
      return NextResponse.json({ error: 'No push subscriptions found. Make sure you have registered for push notifications.' }, { status: 404 })
    }

    console.log('[Push Test] Sending test notification to', subscriptions.length, 'subscription(s)')

    // Send test notification to all subscriptions
    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          await sendPushNotification(
            {
              endpoint: sub.endpoint,
              keys: {
                p256dh: sub.p256dh,
                auth: sub.auth,
              },
            },
            {
              title: 'Test Notification',
              body: 'This is a test push notification. If you see this, push notifications are working!',
              tag: 'test-notification',
              icon: '/icon-192x192.png',
              badge: '/icon-192x192.png',
              data: {
                url: '/dashboard/chat',
                type: 'test',
              },
            }
          )
          console.log('[Push Test] ✅ Sent successfully to:', sub.endpoint.substring(0, 50) + '...')
          return { success: true, endpoint: sub.endpoint }
        } catch (error: any) {
          console.error('[Push Test] ❌ Failed to send to:', sub.endpoint.substring(0, 50) + '...', error)
          throw error
        }
      })
    )

    const successful = results.filter((r) => r.status === 'fulfilled').length
    const failed = results.filter((r) => r.status === 'rejected').length
    
    const errors = results
      .filter((r) => r.status === 'rejected')
      .map((r) => (r.status === 'rejected' ? r.reason?.message || 'Unknown error' : ''))

    return NextResponse.json({
      success: successful > 0,
      sent: successful,
      failed,
      totalSubscriptions: subscriptions.length,
      errors: failed > 0 ? errors : undefined,
      message: successful > 0 
        ? `Test notification sent to ${successful} subscription(s)` 
        : 'Failed to send test notification',
    })
  } catch (error: any) {
    console.error('[Push Test] Error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message,
    }, { status: 500 })
  }
}

