import { useEffect, useState, useCallback } from 'react'
import { getNotificationPermission, requestNotificationPermission, showNotification } from '@/lib/notifications'

export function useNotifications() {
  const [permission, setPermission] = useState<'default' | 'granted' | 'denied'>('default')
  const [isSupported, setIsSupported] = useState(false)

  useEffect(() => {
    if ('Notification' in window) {
      setIsSupported(true)
      setPermission(getNotificationPermission())
    }
  }, [])

  const requestPermission = useCallback(async () => {
    const newPermission = await requestNotificationPermission()
    setPermission(newPermission)
    return newPermission
  }, [])

  const notify = useCallback(async (title: string, options?: NotificationOptions) => {
    if (permission === 'granted') {
      await showNotification(title, options)
    }
  }, [permission])

  return {
    permission,
    isSupported,
    requestPermission,
    notify,
  }
}

