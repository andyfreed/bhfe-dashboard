// Client-side push notification utilities

export interface PushSubscriptionData {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
}

/**
 * Convert a browser PushSubscription to our format
 */
export function subscriptionToJson(subscription: globalThis.PushSubscription): PushSubscriptionData {
  const key = subscription.getKey('p256dh')
  const auth = subscription.getKey('auth')
  
  return {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: key ? btoa(String.fromCharCode(...new Uint8Array(key))) : '',
      auth: auth ? btoa(String.fromCharCode(...new Uint8Array(auth))) : '',
    },
  }
}

/**
 * Register for push notifications
 */
export async function registerPushSubscription(): Promise<globalThis.PushSubscription | null> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('[Push] Push notifications not supported')
    return null
  }

  try {
    // Get service worker registration
    const registration = await navigator.serviceWorker.ready
    
    // Get VAPID public key from server
    const response = await fetch('/api/push/vapid-public-key')
    const { publicKey: vapidPublicKey } = await response.json()
    
    if (!vapidPublicKey) {
      console.warn('[Push] VAPID public key not available')
      return null
    }

    // Convert VAPID key from base64 URL to Uint8Array
    const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey)

    // Subscribe to push notifications
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey,
    })

    // Send subscription to server
    const subscriptionData = subscriptionToJson(subscription)
    const subscribeResponse = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(subscriptionData),
    })

    if (!subscribeResponse.ok) {
      console.error('[Push] Failed to register subscription on server')
      return null
    }

    console.log('[Push] Subscription registered successfully')
    return subscription
  } catch (error) {
    console.error('[Push] Error registering for push notifications:', error)
    return null
  }
}

/**
 * Unregister push subscription
 */
export async function unregisterPushSubscription(): Promise<boolean> {
  try {
    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()
    
    if (!subscription) {
      return true
    }

    // Unsubscribe
    const unsubscribed = await subscription.unsubscribe()
    
    if (unsubscribed) {
      // Remove from server
      const subscriptionData = subscriptionToJson(subscription)
      await fetch('/api/push/subscribe', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ endpoint: subscriptionData.endpoint }),
      })
      console.log('[Push] Subscription unregistered successfully')
    }

    return unsubscribed
  } catch (error) {
    console.error('[Push] Error unregistering push subscription:', error)
    return false
  }
}

/**
 * Check if push notifications are supported
 */
export function isPushNotificationSupported(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
}

/**
 * Convert base64 URL to Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  
  return outputArray
}

