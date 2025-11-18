'use client'

import { useState, useEffect } from 'react'
import { StartMenu } from './StartMenu'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function Taskbar() {
  const [isStartOpen, setIsStartOpen] = useState(false)
  const [time, setTime] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const pathname = usePathname()
  const supabase = createClient()

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      setTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
    }
    updateTime()
    const interval = setInterval(updateTime, 1000)
    
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.email) setUserEmail(user.email.split('@')[0])
    }
    getUser()

    return () => clearInterval(interval)
  }, [supabase])

  // Get current page name for the taskbar button
  const getPageName = () => {
    if (pathname === '/dashboard') return 'Dashboard'
    const parts = pathname.split('/')
    return parts[parts.length - 1].charAt(0).toUpperCase() + parts[parts.length - 1].slice(1)
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 h-10 bg-[var(--win95-gray)] win95-outset flex items-center px-1 py-1 z-50 select-none border-t-2 border-white">
      <div className="relative">
        <button
          onClick={() => setIsStartOpen(!isStartOpen)}
          className={`win95-btn font-bold px-2 py-1 flex items-center gap-1 ${isStartOpen ? 'win95-pressed' : 'win95-outset'}`}
        >
          <img src="/logo.png" alt="Win" className="h-4 w-4" />
          Start
        </button>
        <StartMenu isOpen={isStartOpen} onClose={() => setIsStartOpen(false)} />
      </div>

      {/* Taskbar Divider */}
      <div className="w-[2px] h-6 mx-1 bg-gray-400 shadow-[1px_0_0_white]" />

      {/* Active Window Tab */}
      <div className="flex-1 flex gap-1 px-1 overflow-hidden">
        <div className="win95-pressed flex items-center gap-2 px-2 py-1 w-40 font-bold text-sm bg-[var(--win95-gray)]">
          <img src="/icon-192x192.png" className="h-4 w-4" />
          <span className="truncate">{getPageName()}</span>
        </div>
      </div>

      {/* System Tray */}
      <div className="win95-inset bg-[var(--win95-gray)] px-2 py-1 flex items-center gap-2 text-sm ml-auto min-w-[80px] justify-end">
        <span className="text-xs hidden sm:inline">{userEmail}</span>
        <img src="/icon-192x192.png" className="h-4 w-4" />
        <span>{time}</span>
      </div>
    </div>
  )
}
