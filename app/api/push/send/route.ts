// API route to send push notifications

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendPushNotification } from '@/lib/push'
import type { PushSubscription } from '@/lib/push'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get notification payload from request body
    const { receiverId, title, body, tag, icon, badge, data } = await request.json()
    
    if (!receiverId || !title || !body) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Get all push subscriptions for the receiver
    const { data: subscriptions, error: fetchError } = await supabase
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth')
      .eq('user_id', receiverId)

    if (fetchError) {
      console.error('[Push] Error fetching subscriptions:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch subscriptions' }, { status: 500 })
    }

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({ message: 'No subscriptions found', sent: 0 })
    }

    // Send notification to all subscriptions
    const results = await Promise.allSettled(
      subscriptions.map((sub) =>
        sendPushNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          },
          {
            title,
            body,
            tag: tag || 'notification',
            icon: icon || '/icon-192x192.png',
            badge: badge || '/icon-192x192.png',
            data: data || {},
          }
        )
      )
    )

    const successful = results.filter((r) => r.status === 'fulfilled').length
    const failed = results.filter((r) => r.status === 'rejected').length

    // Clean up invalid subscriptions
    const invalidSubscriptions = results
      .map((result, index) => {
        if (result.status === 'rejected' && result.reason?.message === 'Subscription expired or invalid') {
          return subscriptions[index].endpoint
        }
        return null
      })
      .filter((endpoint) => endpoint !== null)

    if (invalidSubscriptions.length > 0) {
      await supabase
        .from('push_subscriptions')
        .delete()
        .in('endpoint', invalidSubscriptions)
    }

    return NextResponse.json({
      success: true,
      sent: successful,
      failed,
      invalidSubscriptions: invalidSubscriptions.length,
    })
  } catch (error) {
    console.error('[Push] Error in send route:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

