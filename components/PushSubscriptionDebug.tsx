'use client'

// Debug component to show push subscription status in the UI
// This helps diagnose push notification issues without needing console access

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react'
import { getNotificationPermission } from '@/lib/notifications'
import { registerPushSubscription } from '@/lib/push-client'

export default function PushSubscriptionDebug() {
  const [subscriptionStatus, setSubscriptionStatus] = useState<{
    hasSubscription: boolean | null
    endpoint: string | null
    serverSynced: boolean | null
    error: string | null
  }>({
    hasSubscription: null,
    endpoint: null,
    serverSynced: null,
    error: null,
  })
  const [loading, setLoading] = useState(false)

  const checkSubscription = async () => {
    setLoading(true)
    setSubscriptionStatus({
      hasSubscription: null,
      endpoint: null,
      serverSynced: null,
      error: null,
    })

    try {
      const permission = getNotificationPermission()
      
      if (permission !== 'granted') {
        setSubscriptionStatus({
          hasSubscription: false,
          endpoint: null,
          serverSynced: null,
          error: 'Notification permission not granted',
        })
        setLoading(false)
        return
      }

      if ('serviceWorker' in navigator && 'PushManager' in window) {
        // Try to get existing service worker registration with a timeout,
        // so we don't hang forever if there is no service worker.
        const existingRegistration = await navigator.serviceWorker.getRegistration()
        if (!existingRegistration) {
          setSubscriptionStatus({
            hasSubscription: false,
            endpoint: null,
            serverSynced: null,
            error: 'No service worker registration found (open the app from home screen and try again)',
          })
          setLoading(false)
          return
        }

        // Use the existing registration directly instead of waiting on .ready
        const registration = existingRegistration
        const subscription = await registration.pushManager.getSubscription()

        if (subscription) {
          // Check if synced with server
          const { subscriptionToJson } = await import('@/lib/push-client')
          const subscriptionData = subscriptionToJson(subscription)
          
          try {
            const response = await fetch('/api/push/subscribe', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(subscriptionData),
            })

            setSubscriptionStatus({
              hasSubscription: true,
              endpoint: subscription.endpoint,
              serverSynced: response.ok,
              error: response.ok ? null : 'Failed to sync with server',
            })
          } catch (error: any) {
            setSubscriptionStatus({
              hasSubscription: true,
              endpoint: subscription.endpoint,
              serverSynced: false,
              error: error.message || 'Error syncing with server',
            })
          }
        } else {
          setSubscriptionStatus({
            hasSubscription: false,
            endpoint: null,
            serverSynced: null,
            error: 'No push subscription found',
          })
        }
      } else {
        setSubscriptionStatus({
          hasSubscription: false,
          endpoint: null,
          serverSynced: null,
          error: 'Push notifications not supported',
        })
      }
    } catch (error: any) {
      setSubscriptionStatus({
        hasSubscription: null,
        endpoint: null,
        serverSynced: null,
        error: error.message || 'Error checking subscription',
      })
    } finally {
      setLoading(false)
    }
  }

  const registerSubscription = async () => {
    setLoading(true)
    try {
      const subscription = await registerPushSubscription()
      if (subscription) {
        await checkSubscription() // Re-check after registration
      } else {
        setSubscriptionStatus({
          hasSubscription: false,
          endpoint: null,
          serverSynced: null,
          error: 'Failed to register push subscription',
        })
      }
    } catch (error: any) {
      setSubscriptionStatus({
        hasSubscription: null,
        endpoint: null,
        serverSynced: null,
        error: error.message || 'Error registering subscription',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Check on mount
    checkSubscription()
  }, [])

  const permission = getNotificationPermission()

  return (
    <Card className="mb-4 border-blue-200 bg-blue-50/50">
      <CardHeader>
        <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          Push Subscription Debug
        </CardTitle>
        <CardDescription className="text-xs text-slate-600">
          Check push notification subscription status
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-medium text-slate-700">Permission:</span>
            <span className={permission === 'granted' ? 'text-green-600' : permission === 'denied' ? 'text-red-600' : 'text-yellow-600'}>
              {permission === 'granted' ? (
                <span className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Granted
                </span>
              ) : permission === 'denied' ? (
                <span className="flex items-center gap-1">
                  <XCircle className="h-3 w-3" />
                  Denied
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Not Set
                </span>
              )}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="font-medium text-slate-700">Push Subscription:</span>
            {subscriptionStatus.hasSubscription === null ? (
              <span className="text-slate-500">Checking...</span>
            ) : subscriptionStatus.hasSubscription ? (
              <span className="flex items-center gap-1 text-green-600">
                <CheckCircle className="h-3 w-3" />
                Active
              </span>
            ) : (
              <span className="flex items-center gap-1 text-red-600">
                <XCircle className="h-3 w-3" />
                Not Found
              </span>
            )}
          </div>

          {subscriptionStatus.hasSubscription && (
            <div className="flex items-center justify-between">
              <span className="font-medium text-slate-700">Server Sync:</span>
              {subscriptionStatus.serverSynced === null ? (
                <span className="text-slate-500">Checking...</span>
              ) : subscriptionStatus.serverSynced ? (
                <span className="flex items-center gap-1 text-green-600">
                  <CheckCircle className="h-3 w-3" />
                  Synced
                </span>
              ) : (
                <span className="flex items-center gap-1 text-red-600">
                  <XCircle className="h-3 w-3" />
                  Not Synced
                </span>
              )}
            </div>
          )}

          {subscriptionStatus.endpoint && (
            <div className="pt-2 border-t border-slate-200">
              <div className="text-xs text-slate-600">
                <span className="font-medium">Endpoint:</span>
                <div className="mt-1 p-2 bg-slate-100 rounded text-xs font-mono break-all">
                  {subscriptionStatus.endpoint.substring(0, 80)}...
                </div>
              </div>
            </div>
          )}

          {subscriptionStatus.error && (
            <div className="pt-2 border-t border-slate-200">
              <div className="text-xs text-red-600">
                <span className="font-medium">Error:</span> {subscriptionStatus.error}
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            size="sm"
            variant="outline"
            onClick={checkSubscription}
            disabled={loading}
            className="text-xs h-8 px-3"
          >
            <RefreshCw className={`h-3 w-3 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Check Status
          </Button>
          {!subscriptionStatus.hasSubscription && permission === 'granted' && (
            <Button
              size="sm"
              onClick={registerSubscription}
              disabled={loading}
              className="text-xs h-8 px-3"
            >
              Register Push
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

