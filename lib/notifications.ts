// Notification service for PWA push notifications

export type NotificationPermission = 'default' | 'granted' | 'denied'

/**
 * Request notification permission from the user
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications')
    return 'denied'
  }

  if (Notification.permission === 'granted') {
    return 'granted'
  }

  if (Notification.permission === 'denied') {
    return 'denied'
  }

  // Request permission
  const permission = await Notification.requestPermission()
  return permission as NotificationPermission
}

/**
 * Helper function to wait for service worker with timeout
 */
async function waitForServiceWorker(timeout = 3000): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    return null
  }

  try {
    // Check if service worker is already registered
    const existingRegistration = await navigator.serviceWorker.getRegistration()
    if (!existingRegistration) {
      console.warn('[Notifications] No service worker registration found')
      return null
    }

    // Wait for service worker to be ready with timeout
    const readyPromise = navigator.serviceWorker.ready
    const timeoutPromise = new Promise<null>((resolve) => {
      setTimeout(() => {
        console.warn('[Notifications] Service worker ready timeout')
        resolve(null)
      }, timeout)
    })

    const registration = await Promise.race([readyPromise, timeoutPromise])
    return registration
  } catch (error) {
    console.error('[Notifications] Error waiting for service worker:', error)
    return null
  }
}

/**
 * Show a notification
 */
export async function showNotification(
  title: string,
  options?: NotificationOptions
): Promise<void> {
  if (!('Notification' in window)) {
    console.warn('[Notifications] Browser does not support notifications')
    return
  }

  if (Notification.permission !== 'granted') {
    console.warn('[Notifications] Permission not granted:', Notification.permission)
    return
  }

  const notificationOptions: NotificationOptions = {
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    ...options,
  }

  try {
    // Try service worker first (preferred for PWA)
    if ('serviceWorker' in navigator) {
      console.log('[Notifications] Attempting to show notification via service worker...')
      const registration = await waitForServiceWorker(2000) // 2 second timeout
      
      if (registration && registration.active) {
        try {
          console.log('[Notifications] Showing notification via service worker')
          await registration.showNotification(title, notificationOptions)
          console.log('[Notifications] Notification sent successfully via service worker')
          return
        } catch (swError) {
          console.error('[Notifications] Service worker showNotification failed:', swError)
          // Fall through to fallback
        }
      } else {
        console.warn('[Notifications] Service worker not ready, using fallback')
      }
    }

    // Fallback to regular notification API
    console.log('[Notifications] Showing notification via Notification API')
    const notification = new Notification(title, notificationOptions)
    console.log('[Notifications] Notification created successfully')
    
    // Handle notification events for debugging
    notification.onclick = () => {
      console.log('[Notifications] Notification clicked')
      notification.close()
    }
    
    notification.onshow = () => {
      console.log('[Notifications] Notification shown')
    }
    
    notification.onerror = (error) => {
      console.error('[Notifications] Notification error:', error)
    }

  } catch (error) {
    console.error('[Notifications] Error showing notification:', error)
    throw error
  }
}

/**
 * Get current notification permission status
 */
export function getNotificationPermission(): NotificationPermission {
  if (!('Notification' in window)) {
    return 'denied'
  }
  return Notification.permission as NotificationPermission
}

