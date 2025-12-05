'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { LogOut, User, Package, X } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface ProcessingOrder {
  id: number
  order_number: string
  date_created: string
  total: string
  currency: string
  billing_name: string
  billing_email: string
  order_url: string
  view_url: string
}

export function Header() {
  const [user, setUser] = useState<any>(null)
  const [currentDate, setCurrentDate] = useState('')
  const [hasActiveSuperReminder, setHasActiveSuperReminder] = useState(false)
  const [processingOrders, setProcessingOrders] = useState<ProcessingOrder[]>([])
  const [showOrderBanner, setShowOrderBanner] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date()
      setCurrentDate(now.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }))
    }

    updateDateTime()
    const interval = setInterval(updateDateTime, 1000)

    // Get current user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
    })

    return () => clearInterval(interval)
  }, [supabase])

  useEffect(() => {
    const checkSuperReminders = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setHasActiveSuperReminder(false)
        return
      }

      const now = new Date().toISOString()
      
      const { data, error } = await supabase
        .from('reminders')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_super_reminder', true)
        .eq('is_completed', false)
        .lte('reminder_date', now)

      if (error) {
        console.error('Error checking super reminders:', error)
        return
      }

      setHasActiveSuperReminder((data && data.length > 0) || false)
    }

    // Check immediately
    checkSuperReminders()

    // Check every 10 seconds for active super reminders
    const reminderInterval = setInterval(checkSuperReminders, 10000)

    // Subscribe to real-time changes
    const channel = supabase
      .channel('super-reminders-changes')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'reminders'
        },
        () => {
          checkSuperReminders()
        }
      )
      .subscribe()

    return () => {
      clearInterval(reminderInterval)
      supabase.removeChannel(channel)
    }
  }, [supabase])

  useEffect(() => {
    const checkProcessingOrders = async () => {
      // Get WordPress URL and API key from localStorage (same as courses page)
      const wordpressUrl = localStorage.getItem('bhfe_wordpress_url')
      const apiKey = localStorage.getItem('bhfe_api_key')

      if (!wordpressUrl) {
        return // No WordPress URL configured, skip checking
      }

      try {
        const params = new URLSearchParams({
          wordpress_url: wordpressUrl,
          endpoint: 'processing-orders',
        })
        if (apiKey) {
          params.append('api_key', apiKey)
        }

        const response = await fetch(`/api/sync/courses?${params.toString()}`)
        
        if (!response.ok) {
          // Silently fail - don't show errors for order checking
          return
        }

        const data = await response.json()
        if (data.success && data.orders) {
          setProcessingOrders(data.orders)
        } else {
          setProcessingOrders([])
        }
      } catch (error) {
        // Silently fail - don't show errors for order checking
        setProcessingOrders([])
      }
    }

    // Check immediately
    checkProcessingOrders()

    // Check every 5 minutes for processing orders
    const orderInterval = setInterval(checkProcessingOrders, 5 * 60 * 1000)

    return () => {
      clearInterval(orderInterval)
    }
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <>
      {/* Processing Orders Banner */}
      {showOrderBanner && processingOrders.length > 0 && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-orange-500 text-white shadow-lg">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Package className="h-5 w-5" />
              <div>
                <p className="font-semibold">
                  {processingOrders.length} order{processingOrders.length !== 1 ? 's' : ''} need{processingOrders.length === 1 ? 's' : ''} shipping
                </p>
                <p className="text-sm text-orange-100">
                  {processingOrders.length === 1 
                    ? `Order #${processingOrders[0].order_number} from ${processingOrders[0].billing_name}`
                    : `${processingOrders.length} orders are in Processing status`
                  }
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {processingOrders.length > 0 && (
                <a
                  href={processingOrders[0].order_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-white text-orange-600 rounded-lg font-semibold hover:bg-orange-50 transition-colors text-sm"
                >
                  View Orders
                </a>
              )}
              <button
                onClick={() => setShowOrderBanner(false)}
                className="p-1 hover:bg-orange-600 rounded transition-colors"
                aria-label="Dismiss banner"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      )}
      
      <header className={`h-16 lg:h-20 border-b border-slate-200/80 bg-white/80 backdrop-blur-sm px-4 sm:px-6 lg:px-8 flex items-center justify-between shadow-sm ${processingOrders.length > 0 && showOrderBanner ? 'mt-20' : 'mt-14'} lg:mt-0 ${hasActiveSuperReminder ? 'animate-flash-red' : ''}`}>
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          <div className="flex flex-col min-w-0">
            <h2 className="text-sm sm:text-base lg:text-lg font-bold text-slate-900 truncate">{currentDate}</h2>
            <p className="text-xs text-slate-500 font-medium hidden sm:block">Welcome back!</p>
          </div>
        </div>
      <div className="flex items-center gap-2 sm:gap-4">
        {processingOrders.length > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-orange-50 border border-orange-200">
            <Package className="h-4 w-4 text-orange-600" />
            <span className="text-xs font-semibold text-orange-900 hidden sm:inline">
              {processingOrders.length} order{processingOrders.length !== 1 ? 's' : ''} to ship
            </span>
            <span className="text-xs font-semibold text-orange-900 sm:hidden">
              {processingOrders.length}
            </span>
            {!showOrderBanner && (
              <button
                onClick={() => setShowOrderBanner(true)}
                className="text-xs text-orange-600 hover:text-orange-800 underline ml-1"
                title="Show banner"
              >
                Show
              </button>
            )}
          </div>
        )}
        {user && (
          <div className="hidden sm:flex items-center gap-2 lg:gap-3 px-3 lg:px-4 py-2 rounded-lg bg-slate-50 border border-slate-200/80">
            <div className="flex items-center justify-center h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500">
              <User className="h-4 w-4 text-white" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs lg:text-sm font-semibold text-slate-900 truncate">{user.email?.split('@')[0] || 'User'}</span>
              <span className="text-xs text-slate-500 truncate hidden lg:block">{user.email || ''}</span>
            </div>
          </div>
        )}
        <Button variant="outline" size="sm" onClick={handleSignOut} className="gap-1 sm:gap-2 text-xs sm:text-sm">
          <LogOut className="h-3 w-3 sm:h-4 sm:w-4" />
          <span className="hidden sm:inline">Sign Out</span>
        </Button>
      </div>
    </header>
    </>
  )
}
