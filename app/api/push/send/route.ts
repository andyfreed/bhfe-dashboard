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
    console.log('[Push] Looking up subscriptions for receiverId:', receiverId)
    
    const { data: subscriptions, error: fetchError } = await supabase
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth, user_id')
      .eq('user_id', receiverId)

    if (fetchError) {
      console.error('[Push] Error fetching subscriptions:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch subscriptions' }, { status: 500 })
    }

    // Also check what subscriptions exist (for debugging)
    const { data: allSubs } = await supabase
      .from('push_subscriptions')
      .select('user_id, endpoint')
      .limit(10)
    console.log('[Push] All subscriptions in database (first 10):', allSubs?.map(s => ({
      userId: s.user_id,
      endpoint: s.endpoint.substring(0, 30) + '...',
    })))

    console.log('[Push] 🔍 Subscription lookup result:', {
      receiverId,
      foundCount: subscriptions?.length || 0,
      foundSubscriptions: subscriptions?.map(s => ({
        endpoint: s.endpoint.substring(0, 40) + '...',
        userId: s.user_id,
      })) || [],
      availableUserIds: allSubs?.map(s => s.user_id) || [],
    })

    if (!subscriptions || subscriptions.length === 0) {
      console.warn('[Push] ❌ No subscriptions found for user:', receiverId)
      console.warn('[Push] This means the receiverId doesn\'t match any subscription user_id')
      console.warn('[Push] Available user IDs with subscriptions:', allSubs?.map(s => s.user_id) || [])
      return NextResponse.json({ 
        message: 'No subscriptions found', 
        sent: 0,
        receiverId,
        availableUserIds: allSubs?.map(s => s.user_id) || [],
      })
    }

    console.log('[Push] Sending notification to', subscriptions.length, 'subscription(s) for user:', receiverId)
    console.log('[Push] Subscription endpoints:', subscriptions.map(s => s.endpoint.substring(0, 50) + '...'))

    // Send notification to all subscriptions
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
              title,
              body,
              tag: tag || 'notification',
              icon: icon || '/icon-192x192.png',
              badge: badge || '/icon-192x192.png',
              data: data || {},
            }
          )
          return { success: true, endpoint: sub.endpoint }
        } catch (error: any) {
          console.error('[Push] Failed to send to endpoint:', sub.endpoint.substring(0, 50) + '...', error)
          throw error
        }
      })
    )

    const successful = results.filter((r) => r.status === 'fulfilled').length
    const failed = results.filter((r) => r.status === 'rejected').length
    
    // Log detailed results
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        console.log('[Push] ✅ Successfully sent to subscription', index + 1)
      } else {
        console.error('[Push] ❌ Failed to send to subscription', index + 1, ':', result.reason)
      }
    })

    // Clean up invalid/expired subscriptions
    const invalidSubscriptions: string[] = []
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        const error = result.reason
        const errorMessage = error?.message || String(error)
        const statusCode = error?.statusCode
        
        // Check for expired or invalid subscriptions (410, 404 status codes)
        if (
          statusCode === 410 || 
          statusCode === 404 || 
          errorMessage.includes('expired') || 
          errorMessage.includes('invalid') ||
          errorMessage.includes('Subscription expired')
        ) {
          invalidSubscriptions.push(subscriptions[index].endpoint)
          console.log('[Push] 🗑️ Marking subscription as invalid:', subscriptions[index].endpoint.substring(0, 50) + '...')
        }
      }
    })

    if (invalidSubscriptions.length > 0) {
      console.log('[Push] 🗑️ Cleaning up', invalidSubscriptions.length, 'invalid subscription(s)')
      const { error: deleteError } = await supabase
        .from('push_subscriptions')
        .delete()
        .in('endpoint', invalidSubscriptions)
      
      if (deleteError) {
        console.error('[Push] Error deleting invalid subscriptions:', deleteError)
      } else {
        console.log('[Push] ✅ Cleaned up', invalidSubscriptions.length, 'invalid subscription(s)')
      }
    }

    const response = {
      success: successful > 0,
      sent: successful,
      failed,
      invalidSubscriptions: invalidSubscriptions.length,
      totalSubscriptions: subscriptions.length,
    }
    
    console.log('[Push] Send result:', response)
    
    return NextResponse.json(response)
  } catch (error) {
    console.error('[Push] Error in send route:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

