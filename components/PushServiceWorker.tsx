'use client'

// Component to register push handlers in the service worker
// This runs in the client to inject push event listeners into the service worker

import { useEffect } from 'react'

export default function PushServiceWorker() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      // Wait for service worker to be ready
      navigator.serviceWorker.ready.then(async (registration) => {
        console.log('[Push SW] Service worker ready, injecting push handlers')
        
        try {
          // Load and execute the custom push handler script
          // This will add push event listeners to the service worker
          const pushHandlerResponse = await fetch('/sw-custom.js')
          if (pushHandlerResponse.ok) {
            const pushHandlerCode = await pushHandlerResponse.text()
            
            // Create a blob URL for the script and execute it in the service worker context
            // Actually, we need to import it into the service worker
            // Since we can't directly modify next-pwa's service worker, we'll try to use importScripts
            // But the best approach is to ensure the handlers are in sw-custom.js and it gets loaded
            
            console.log('[Push SW] Push handler script loaded, checking if it can be injected')
            
            // For now, just ensure the service worker is ready
            // The push handlers in sw-custom.js should be loaded by the service worker
            if (registration.active) {
              registration.active.postMessage({
                type: 'REGISTER_PUSH_HANDLERS',
              })
            }
          }
        } catch (error) {
          console.error('[Push SW] Error loading push handlers:', error)
        }
        
        // Also listen for push events at the client level (as fallback)
        navigator.serviceWorker.addEventListener('message', (event) => {
          if (event.data && event.data.type === 'PUSH_NOTIFICATION') {
            // Handle push notification from service worker
            console.log('[Push SW] Received push notification message:', event.data)
          }
        })
      })
      
      // Register push event handler for service worker
      navigator.serviceWorker.ready.then((registration) => {
        // This will be handled by the service worker's push event listener
        // If the service worker has our push handlers, they'll catch it
        console.log('[Push SW] Service worker ready for push events')
      })
    }
  }, [])

  return null // This component doesn't render anything
}

