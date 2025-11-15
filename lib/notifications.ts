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
    console.warn('This browser does not support notifications')
    return
  }

  if (Notification.permission !== 'granted') {
    console.warn('Notification permission not granted')
    return
  }

  // Check if service worker is available
  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.ready
    
    await registration.showNotification(title, {
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      ...options,
    } as NotificationOptions)
  } else {
    // Fallback to regular notification if service worker not available
    new Notification(title, {
      icon: '/icon-192x192.png',
      ...options,
    })
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

