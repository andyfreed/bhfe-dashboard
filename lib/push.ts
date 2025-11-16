// Push notification utilities for Web Push API

import webpush from 'web-push'

// VAPID keys (set in environment variables)
const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
const privateKey = process.env.VAPID_PRIVATE_KEY || ''
const subject = process.env.VAPID_SUBJECT || 'mailto:admin@bhfe.com'

// Set VAPID details if keys are available
let vapidConfigured = false
if (publicKey && privateKey) {
  try {
    webpush.setVapidDetails(subject, publicKey, privateKey)
    vapidConfigured = true
    console.log('[Push] VAPID keys configured successfully')
  } catch (error) {
    console.error('[Push] Error setting VAPID details:', error)
  }
} else {
  console.warn('[Push] ⚠️ VAPID keys not configured!')
  console.warn('[Push] Public key available:', !!publicKey)
  console.warn('[Push] Private key available:', !!privateKey)
  console.warn('[Push] Set NEXT_PUBLIC_VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY in environment variables.')
}

export interface PushSubscription {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
}

/**
 * Send a push notification to a subscription
 */
export async function sendPushNotification(
  subscription: PushSubscription,
  payload: {
    title: string
    body: string
    tag?: string
    icon?: string
    badge?: string
    data?: any
  }
): Promise<void> {
  if (!vapidConfigured || !publicKey || !privateKey) {
    const error = new Error('VAPID keys not configured. Check Vercel environment variables.')
    console.error('[Push] ❌', error.message)
    throw error
  }

  try {
    const notificationPayload = JSON.stringify({
      title: payload.title,
      body: payload.body,
      icon: payload.icon || '/icon-192x192.png',
      badge: payload.badge || '/icon-192x192.png',
      tag: payload.tag || 'notification',
      data: payload.data || {},
    })

    console.log('[Push] Sending notification to endpoint:', subscription.endpoint.substring(0, 50) + '...')
    console.log('[Push] Notification payload:', { title: payload.title, body: payload.body.substring(0, 50) })
    
    await webpush.sendNotification(subscription, notificationPayload)
    console.log('[Push] Notification sent successfully to:', subscription.endpoint.substring(0, 50) + '...')
  } catch (error: any) {
    console.error('[Push] Error sending notification:', error)
    console.error('[Push] Error details:', {
      statusCode: error.statusCode,
      message: error.message,
      endpoint: subscription.endpoint.substring(0, 50) + '...',
    })
    
    // If subscription is invalid, we might want to remove it
    if (error.statusCode === 410 || error.statusCode === 404) {
      throw new Error('Subscription expired or invalid')
    }
    throw error
  }
}

/**
 * Get the VAPID public key (for client-side subscription)
 */
export function getVapidPublicKey(): string | null {
  return publicKey || null
}

