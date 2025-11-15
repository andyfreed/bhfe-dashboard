'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Bell, CheckCircle, XCircle } from 'lucide-react'
import { getNotificationPermission, requestNotificationPermission, showNotification } from '@/lib/notifications'

export default function NotificationTest() {
  const [permission, setPermission] = useState<'default' | 'granted' | 'denied'>('default')
  const [testing, setTesting] = useState(false)

  const checkPermission = async () => {
    const currentPermission = getNotificationPermission()
    setPermission(currentPermission)
    console.log('[NotificationTest] Current permission:', currentPermission)
    console.log('[NotificationTest] Service Worker support:', 'serviceWorker' in navigator)
    
    if ('serviceWorker' in navigator) {
      try {
        // Check for existing registration first
        const existingReg = await navigator.serviceWorker.getRegistration()
        if (existingReg) {
          console.log('[NotificationTest] Service Worker registered:', existingReg.scope)
          console.log('[NotificationTest] Service Worker state:', existingReg.active?.state)
          console.log('[NotificationTest] Service Worker script:', existingReg.active?.scriptURL)
        } else {
          console.warn('[NotificationTest] No service worker registration found')
        }
        
        // Try to get ready (with timeout)
        try {
          const registration = await Promise.race([
            navigator.serviceWorker.ready,
            new Promise<null>((resolve) => setTimeout(() => resolve(null), 2000))
          ])
          if (registration) {
            console.log('[NotificationTest] Service Worker ready:', !!registration)
            console.log('[NotificationTest] Service Worker active:', registration.active?.scriptURL)
          } else {
            console.warn('[NotificationTest] Service Worker ready timeout')
          }
        } catch (error) {
          console.error('[NotificationTest] Service Worker ready error:', error)
        }
      } catch (error) {
        console.error('[NotificationTest] Service Worker error:', error)
      }
    }
  }

  const requestPermission = async () => {
    const newPermission = await requestNotificationPermission()
    setPermission(newPermission)
  }

  const testNotification = async () => {
    setTesting(true)
    try {
      console.log('[NotificationTest] Testing notification...')
      await showNotification('Test Notification', {
        body: 'This is a test notification from BHFE Dashboard. If you see this, notifications are working!',
        tag: 'test-notification',
      })
      console.log('[NotificationTest] Notification sent successfully')
    } catch (error) {
      console.error('[NotificationTest] Failed to send notification:', error)
    } finally {
      setTesting(false)
    }
  }

  // Check permission on mount
  useEffect(() => {
    checkPermission()
  }, [])

  return (
    <div className="fixed bottom-20 right-4 bg-white rounded-xl shadow-2xl border border-slate-200 p-4 max-w-sm z-40">
      <div className="flex items-start gap-3 mb-4">
        <div className="p-2 bg-blue-100 rounded-lg">
          <Bell className="h-5 w-5 text-blue-600" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-slate-900 mb-1">Notification Test</h3>
          <p className="text-xs text-slate-600 mb-3">Test if notifications are working</p>
          
          <div className="space-y-2 mb-3">
            <div className="flex items-center gap-2 text-xs">
              <span className="font-medium text-slate-700">Permission:</span>
              {permission === 'granted' ? (
                <span className="flex items-center gap-1 text-green-600">
                  <CheckCircle className="h-3 w-3" />
                  Granted
                </span>
              ) : permission === 'denied' ? (
                <span className="flex items-center gap-1 text-red-600">
                  <XCircle className="h-3 w-3" />
                  Denied
                </span>
              ) : (
                <span className="text-yellow-600">Not Set</span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="font-medium text-slate-700">Service Worker:</span>
              <span className={('serviceWorker' in navigator) ? 'text-green-600' : 'text-red-600'}>
                {('serviceWorker' in navigator) ? 'Supported' : 'Not Supported'}
              </span>
            </div>
          </div>
          
          <div className="flex flex-col gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={checkPermission}
              className="text-xs h-8 px-3"
            >
              Check Status
            </Button>
            {permission !== 'granted' && (
              <Button
                size="sm"
                onClick={requestPermission}
                className="text-xs h-8 px-3"
              >
                Request Permission
              </Button>
            )}
            {permission === 'granted' && (
              <Button
                size="sm"
                onClick={testNotification}
                disabled={testing}
                className="text-xs h-8 px-3"
              >
                {testing ? 'Testing...' : 'Send Test Notification'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

