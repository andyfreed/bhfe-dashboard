// Custom service worker code to be injected
// This will be used to add push handlers to the next-pwa generated service worker

// Listen for push events (when app is closed or in background)
self.addEventListener('push', (event) => {
  console.log('[SW] Push event received:', event)

  let notificationData = {
    title: 'BHFE Dashboard',
    body: 'You have a new notification',
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    tag: 'notification',
    data: {},
  }

  if (event.data) {
    try {
      const data = event.data.json()
      notificationData = {
        title: data.title || notificationData.title,
        body: data.body || notificationData.body,
        icon: data.icon || notificationData.icon,
        badge: data.badge || notificationData.badge,
        tag: data.tag || notificationData.tag,
        data: data.data || notificationData.data,
      }
    } catch (e) {
      console.error('[SW] Error parsing push data:', e)
      // If JSON parsing fails, try text
      notificationData.body = event.data.text() || notificationData.body
    }
  }

  const promiseChain = self.registration.showNotification(notificationData.title, {
    body: notificationData.body,
    icon: notificationData.icon,
    badge: notificationData.badge,
    tag: notificationData.tag,
    data: notificationData.data,
    requireInteraction: false,
    silent: false,
  })

  event.waitUntil(promiseChain)
})

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event)
  
  event.notification.close()

  const urlToOpen = event.notification.data?.url || '/dashboard/chat'
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If app is already open, focus it and navigate to the URL
      for (const client of clientList) {
        if (client.url.includes(self.registration.scope) && 'focus' in client) {
          client.focus()
          if (client.navigate && client.url !== new URL(urlToOpen, self.location.origin).href) {
            client.navigate(urlToOpen)
          }
          return
        }
      }
      // Otherwise, open the app
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen)
      }
    })
  )
})

// Listen for messages from client to register handlers
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'REGISTER_PUSH_HANDLERS') {
    console.log('[SW] Push handlers registration message received')
    // Handlers are already registered above
  }
})

