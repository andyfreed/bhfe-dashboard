'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Bell, X } from 'lucide-react'
import { getNotificationPermission, requestNotificationPermission } from '@/lib/notifications'

export default function NotificationPrompt() {
  const [showPrompt, setShowPrompt] = useState(false)
  const [permission, setPermission] = useState<'default' | 'granted' | 'denied'>('default')

  useEffect(() => {
    // Only show prompt if notifications are supported and not already granted/denied
    if ('Notification' in window) {
      const currentPermission = getNotificationPermission()
      setPermission(currentPermission)
      
      // Show prompt if permission is default and we haven't shown it recently
      if (currentPermission === 'default') {
        const lastPrompt = localStorage.getItem('notification-prompt-dismissed')
        const lastPromptTime = lastPrompt ? parseInt(lastPrompt, 10) : 0
        const oneDay = 24 * 60 * 60 * 1000
        
        // Only show if dismissed more than 1 day ago or never shown
        if (Date.now() - lastPromptTime > oneDay) {
          // Small delay to not show immediately on page load
          const timer = setTimeout(() => {
            setShowPrompt(true)
          }, 3000)
          
          return () => clearTimeout(timer)
        }
      }
    }
  }, [])

  const handleEnableNotifications = async () => {
    const newPermission = await requestNotificationPermission()
    setPermission(newPermission)
    
    if (newPermission === 'granted') {
      setShowPrompt(false)
      // Optionally show a test notification
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready
        await registration.showNotification('Notifications enabled!', {
          body: 'You will now receive notifications from BHFE Dashboard.',
          icon: '/icon-192x192.png',
          badge: '/icon-192x192.png',
        })
      }
    } else if (newPermission === 'denied') {
      setShowPrompt(false)
      localStorage.setItem('notification-prompt-dismissed', Date.now().toString())
    }
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    localStorage.setItem('notification-prompt-dismissed', Date.now().toString())
  }

  if (!showPrompt || permission !== 'default') {
    return null
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-md z-50 animate-in slide-in-from-bottom-5 duration-300">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 p-4 flex items-start gap-3">
        <div className="flex-shrink-0 p-2 bg-blue-100 rounded-lg">
          <Bell className="h-5 w-5 text-blue-600" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-slate-900 mb-1">
            Enable Notifications
          </h3>
          <p className="text-xs text-slate-600 mb-3">
            Get notified about important updates, new messages, and reminders.
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleEnableNotifications}
              className="text-xs h-8 px-3"
            >
              Enable
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleDismiss}
              className="text-xs h-8 px-3"
            >
              Dismiss
            </Button>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 text-slate-400 hover:text-slate-600"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

