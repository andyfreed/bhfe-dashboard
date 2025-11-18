'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { LogOut, User } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function Header() {
  const [user, setUser] = useState<any>(null)
  const [currentDate, setCurrentDate] = useState('')
  const [hasActiveSuperReminder, setHasActiveSuperReminder] = useState(false)
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

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <header className={`h-16 lg:h-20 border-b border-slate-200/80 bg-white/80 backdrop-blur-sm px-4 sm:px-6 lg:px-8 flex items-center justify-between shadow-sm mt-14 lg:mt-0 ${hasActiveSuperReminder ? 'animate-flash-red' : ''}`}>
      <div className="flex items-center gap-2 sm:gap-4 min-w-0">
        <div className="flex flex-col min-w-0">
          <h2 className="text-sm sm:text-base lg:text-lg font-bold text-slate-900 truncate">{currentDate}</h2>
          <p className="text-xs text-slate-500 font-medium hidden sm:block">Welcome back!</p>
        </div>
      </div>
      <div className="flex items-center gap-2 sm:gap-4">
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
  )
}
