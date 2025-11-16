// Push notification utilities for Web Push API

import webpush from 'web-push'

// VAPID keys (set in environment variables)
const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
const privateKey = process.env.VAPID_PRIVATE_KEY || ''
const subject = process.env.VAPID_SUBJECT || 'mailto:admin@bhfe.com'

// Set VAPID details if keys are available
if (publicKey && privateKey) {
  try {
    webpush.setVapidDetails(subject, publicKey, privateKey)
    console.log('[Push] VAPID keys configured')
  } catch (error) {
    console.error('[Push] Error setting VAPID details:', error)
  }
} else {
  console.warn('[Push] VAPID keys not configured. Set NEXT_PUBLIC_VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY in environment variables.')
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
  if (!publicKey || !privateKey) {
    console.warn('[Push] VAPID keys not configured')
    return
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

    await webpush.sendNotification(subscription, notificationPayload)
    console.log('[Push] Notification sent successfully')
  } catch (error: any) {
    console.error('[Push] Error sending notification:', error)
    
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

