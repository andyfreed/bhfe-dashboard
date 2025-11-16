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
      
      if (permission === 'granted') {
        try {
          // Check if we already have a push subscription
          if ('serviceWorker' in navigator && 'PushManager' in window) {
            const registration = await navigator.serviceWorker.ready
            const existingSubscription = await registration.pushManager.getSubscription()
            
            if (existingSubscription) {
              console.log('[Push Manager] Push subscription already exists')
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
                  console.log('[Push Manager] Subscription synced with server')
                  const result = await response.json()
                  console.log('[Push Manager] Sync result:', result)
                } else {
                  const error = await response.json()
                  console.error('[Push Manager] Failed to sync subscription:', error)
                }
              } catch (error) {
                console.error('[Push Manager] Error syncing subscription:', error)
              }
            } else {
              // No subscription yet, register for push
              console.log('[Push Manager] No push subscription found, registering...')
              const subscription = await registerPushSubscription()
              if (subscription) {
                console.log('[Push Manager] Push subscription registered successfully')
                setIsRegistered(true)
              }
            }
          }
        } catch (error) {
          console.error('[Push Manager] Error checking/registering push subscription:', error)
        }
      }
    }

    // Wait a bit for service worker to be ready
    const timer = setTimeout(checkAndRegister, 2000)
    
    return () => clearTimeout(timer)
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

