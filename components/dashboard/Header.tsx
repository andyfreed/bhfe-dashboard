'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { LogOut, User } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function Header() {
  const [user, setUser] = useState<any>(null)
  const [currentDate, setCurrentDate] = useState('')
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

    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
    })

    return () => clearInterval(interval)
  }, [supabase])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <header className="h-16 lg:h-20 border-b border-yellow-500/20 glass px-4 sm:px-6 lg:px-8 flex items-center justify-between shadow-2xl mt-14 lg:mt-0 relative">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-yellow-500/50 to-transparent" />
      <div className="flex items-center gap-2 sm:gap-4 min-w-0 relative z-10">
        <div className="flex flex-col min-w-0">
          <h2 className="text-sm sm:text-base lg:text-lg font-black text-white truncate">{currentDate}</h2>
          <p className="text-xs text-yellow-400/70 font-semibold hidden sm:block">Welcome back!</p>
        </div>
      </div>
      <div className="flex items-center gap-2 sm:gap-4 relative z-10">
        {user && (
          <div className="hidden sm:flex items-center gap-2 lg:gap-3 px-3 lg:px-4 py-2 rounded-xl glass-light border border-yellow-500/20">
            <div className="flex items-center justify-center h-8 w-8 rounded-full bg-gradient-to-br from-yellow-500 to-amber-500 shadow-lg shadow-yellow-500/30">
              <User className="h-4 w-4 text-black" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs lg:text-sm font-bold text-white truncate">{user.email?.split('@')[0] || 'User'}</span>
              <span className="text-xs text-gray-400 truncate hidden lg:block">{user.email || ''}</span>
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
