'use client'

// Component to ensure push handlers are registered in the service worker
// Since next-pwa generates its own service worker, we need to manually inject push handlers

import { useEffect } from 'react'

export default function PushServiceWorker() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      const registerPushHandlers = async () => {
        try {
          const registration = await navigator.serviceWorker.ready
          console.log('[Push SW] Service worker ready, ensuring push handlers are registered')
          
          // The push handlers should be automatically registered by the service worker
          // But we'll send a message to ensure they're active
          if (registration.active) {
            registration.active.postMessage({
              type: 'REGISTER_PUSH_HANDLERS',
            })
            console.log('[Push SW] Sent push handlers registration message')
          }
          
          // Verify push manager is available
          if ('PushManager' in window && registration.pushManager) {
            console.log('[Push SW] ✅ Push Manager available in service worker')
            
            // Check for existing subscription
            const subscription = await registration.pushManager.getSubscription()
            if (subscription) {
              console.log('[Push SW] ✅ Push subscription found:', subscription.endpoint.substring(0, 50) + '...')
            } else {
              console.warn('[Push SW] ⚠️ No push subscription found')
            }
          } else {
            console.warn('[Push SW] ⚠️ Push Manager not available')
          }
        } catch (error) {
          console.error('[Push SW] ❌ Error setting up push handlers:', error)
        }
      }

      // Wait a bit for service worker to be ready
      setTimeout(registerPushHandlers, 1000)
      
      // Also try after a longer delay
      setTimeout(registerPushHandlers, 3000)
    }
  }, [])

  return null // This component doesn't render anything
}

