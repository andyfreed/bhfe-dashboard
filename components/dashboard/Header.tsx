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
    <header className={`h-16 lg:h-20 border-b-4 border-black bg-[#222] px-4 sm:px-6 lg:px-8 flex items-center justify-between shadow-md relative mt-14 lg:mt-0`}>
      {/* Decorative screws */}
      <div className="absolute top-2 left-2 w-2 h-2 rounded-full bg-neutral-600 shadow-inner border border-black"></div>
      <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-neutral-600 shadow-inner border border-black"></div>
      
      <div className="flex items-center gap-2 sm:gap-4 min-w-0">
        <div className="flex flex-col min-w-0 p-2 lcd-screen shadow-inner bg-[#748676] border-4 border-[#111] rounded">
          <h2 className="text-sm sm:text-base lg:text-lg font-bold text-black tracking-widest uppercase truncate font-mono leading-none mb-1 opacity-80">{currentDate}</h2>
          <p className="text-[10px] text-black font-mono hidden sm:block opacity-60">STATION: BHFE-FM</p>
        </div>
      </div>
      
      {/* Volume Meter Graphic (Static) */}
      <div className="hidden md:flex items-end gap-1 h-8 mx-4">
         {[...Array(10)].map((_, i) => (
           <div key={i} className={`w-2 rounded-sm ${i < 6 ? 'bg-green-500' : i < 8 ? 'bg-yellow-500' : 'bg-red-500'} opacity-80`} style={{height: `${Math.random() * 100}%`}}></div>
         ))}
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        {user && (
          <div className="hidden sm:flex items-center gap-2 lg:gap-3 px-3 lg:px-4 py-2 rounded bg-[#111] border border-neutral-700 shadow-inner">
            <div className="flex items-center justify-center h-8 w-8 rounded-full bg-neutral-800 border border-neutral-600 shadow-md relative knob">
              <User className="h-4 w-4 text-neutral-400" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs lg:text-sm font-bold text-neutral-300 truncate font-mono">{user.email?.split('@')[0] || 'DJ User'}</span>
              <span className="text-[10px] text-primary truncate hidden lg:block font-mono">ON AIR</span>
            </div>
          </div>
        )}
        <Button variant="outline" size="sm" onClick={handleSignOut} className="gap-1 sm:gap-2 text-xs sm:text-sm border-2 border-black bg-neutral-700 text-white hover:bg-red-600 hover:border-black active:translate-y-1 shadow-[0_4px_0_#000] active:shadow-none transition-all uppercase font-black tracking-wider rounded-none">
          <LogOut className="h-3 w-3 sm:h-4 sm:w-4" />
          <span className="hidden sm:inline">EJECT</span>
        </Button>
      </div>
    </header>
  )
}

