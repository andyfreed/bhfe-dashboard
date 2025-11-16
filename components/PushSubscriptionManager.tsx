'use client'

// Component to manage push subscriptions automatically
// This ensures push subscriptions are registered when notifications are enabled

import { useEffect, useState } from 'react'
import { getNotificationPermission } from '@/lib/notifications'
import { registerPushSubscription } from '@/lib/push-client'

export default function PushSubscriptionManager() {
  const [isRegistered, setIsRegistered] = useState(false)

  useEffect(() => {
    // Check if notifications are already enabled and register for push
    const checkAndRegister = async () => {
      const permission = getNotificationPermission()
      
      console.log('[Push Manager] Checking permission:', permission)
      
      if (permission === 'granted') {
        try {
          // Check if push notifications are supported
          if (!('serviceWorker' in navigator)) {
            console.warn('[Push Manager] Service workers not supported')
            return
          }
          
          if (!('PushManager' in window)) {
            console.warn('[Push Manager] Push notifications not supported')
            return
          }

          // Wait for service worker to be ready (with timeout)
          let registration: ServiceWorkerRegistration | null = null
          try {
            registration = await Promise.race([
              navigator.serviceWorker.ready,
              new Promise<null>((resolve) => setTimeout(() => resolve(null), 5000)),
            ]) as ServiceWorkerRegistration | null
          } catch (error) {
            console.error('[Push Manager] Error getting service worker registration:', error)
            // Try to register service worker manually if not registered
            try {
              registration = await navigator.serviceWorker.register('/sw.js')
              console.log('[Push Manager] Service worker registered manually')
              // Wait for it to be ready
              await new Promise(resolve => setTimeout(resolve, 1000))
              registration = await navigator.serviceWorker.ready
            } catch (regError) {
              console.error('[Push Manager] Failed to register service worker:', regError)
              return
            }
          }

          if (!registration) {
            console.warn('[Push Manager] Service worker not ready after 5 seconds')
            return
          }

          const existingSubscription = await registration.pushManager.getSubscription()
          
          if (existingSubscription) {
            console.log('[Push Manager] ✅ Push subscription already exists')
            setIsRegistered(true)
            
            // Make sure it's registered on the server too
            try {
              const { subscriptionToJson } = await import('@/lib/push-client')
              const subscriptionData = subscriptionToJson(existingSubscription)
              
              const response = await fetch('/api/push/subscribe', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(subscriptionData),
              })
              
              if (response.ok) {
                console.log('[Push Manager] ✅ Subscription synced with server')
                const result = await response.json()
                console.log('[Push Manager] Sync result:', result)
              } else {
                const error = await response.json()
                console.error('[Push Manager] ❌ Failed to sync subscription:', error)
              }
            } catch (error) {
              console.error('[Push Manager] ❌ Error syncing subscription:', error)
            }
          } else {
            // No subscription yet, register for push
            console.log('[Push Manager] No push subscription found, registering...')
            const subscription = await registerPushSubscription()
            if (subscription) {
              console.log('[Push Manager] ✅ Push subscription registered successfully')
              setIsRegistered(true)
            } else {
              console.warn('[Push Manager] ❌ Failed to register push subscription')
            }
          }
        } catch (error) {
          console.error('[Push Manager] ❌ Error checking/registering push subscription:', error)
        }
      } else {
        console.log('[Push Manager] Notification permission not granted, waiting...')
      }
    }

    // Wait a bit for service worker to be ready, then check
    const timer = setTimeout(checkAndRegister, 1000)
    
    // Also check after a longer delay in case service worker takes time
    const timer2 = setTimeout(checkAndRegister, 3000)
    
    return () => {
      clearTimeout(timer)
      clearTimeout(timer2)
    }
  }, [])

  // Re-check when permission changes
  useEffect(() => {
    const handlePermissionChange = () => {
      const permission = getNotificationPermission()
      if (permission === 'granted' && !isRegistered) {
        setTimeout(async () => {
          const subscription = await registerPushSubscription()
          if (subscription) {
            setIsRegistered(true)
          }
        }, 1000)
      }
    }

    // Listen for storage events (when permission might change)
    window.addEventListener('storage', handlePermissionChange)
    
    // Also check periodically
    const interval = setInterval(handlePermissionChange, 10000) // Check every 10 seconds
    
    return () => {
      window.removeEventListener('storage', handlePermissionChange)
      clearInterval(interval)
    }
  }, [isRegistered])

  return null // This component doesn't render anything
}

