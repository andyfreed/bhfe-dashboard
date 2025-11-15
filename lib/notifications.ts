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

  try {
    // Check if service worker is available (preferred for PWA)
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready
        
        if (!registration) {
          console.warn('[Notifications] Service worker not ready')
          return
        }

        console.log('[Notifications] Showing notification via service worker')
        await registration.showNotification(title, {
          icon: '/icon-192x192.png',
          badge: '/icon-192x192.png',
          ...options,
        } as NotificationOptions)
      } catch (swError) {
        console.error('[Notifications] Service worker notification failed, trying fallback:', swError)
        // Fallback to regular notification if service worker fails
        new Notification(title, {
          icon: '/icon-192x192.png',
          ...options,
        })
      }
    } else {
      // Fallback to regular notification if service worker not available
      console.log('[Notifications] Showing notification without service worker')
      new Notification(title, {
        icon: '/icon-192x192.png',
        ...options,
      })
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

