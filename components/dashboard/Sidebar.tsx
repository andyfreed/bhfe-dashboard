'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  CheckSquare,
  Calendar,
  Bell,
  FolderKanban,
  Users,
  FileText,
  MapPin,
  MessageSquare,
  ExternalLink,
  BookOpen,
  X,
  Menu,
  ChevronDown,
  ChevronRight,
  Settings,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'To-Do Lists', href: '/dashboard/todos', icon: CheckSquare },
  { name: 'Calendar', href: '/dashboard/calendar', icon: Calendar },
  { name: 'Reminders', href: '/dashboard/reminders', icon: Bell },
  { name: 'Projects', href: '/dashboard/projects', icon: FolderKanban },
  { name: 'Contacts', href: '/dashboard/contacts', icon: Users },
  { name: 'Notes', href: '/dashboard/notes', icon: FileText },
  { name: 'Active Courses', href: '/dashboard/courses', icon: BookOpen },
  { name: 'Regulatory Info', href: '/dashboard/states', icon: MapPin, hasSubmenu: true },
  { name: 'Chat', href: '/dashboard/chat', icon: MessageSquare },
  { name: 'Operations', href: '/dashboard/operations', icon: Settings },
  { name: 'Links', href: '/dashboard/links', icon: ExternalLink },
]

const regulatorySubmenu = [
  { name: 'CPA', href: '/dashboard/states?tab=CPA' },
  { name: 'CFP', href: '/dashboard/states?tab=CFP' },
  { name: 'EA/OTRP/ERPA', href: '/dashboard/states?tab=EA/OTRP/ERPA' },
  { name: 'CDFA', href: '/dashboard/states?tab=CDFA' },
  { name: 'IAR', href: '/dashboard/states?tab=IAR' },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isRegulatoryExpanded, setIsRegulatoryExpanded] = useState(false)
  const [coursesNotInSitemapCount, setCoursesNotInSitemapCount] = useState<number | null>(null)
  const supabase = createClient()

  useEffect(() => {
    checkUnreadMessages()
    const unsubscribe = subscribeToMessages()
    // Close mobile menu when navigating
    setIsMobileMenuOpen(false)
    
    // Load courses not in sitemap count from localStorage
    const count = localStorage.getItem('bhfe_courses_not_in_sitemap_count')
    setCoursesNotInSitemapCount(count ? parseInt(count, 10) : null)
    
    // Listen for storage changes (when courses page updates the count)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'bhfe_courses_not_in_sitemap_count') {
        setCoursesNotInSitemapCount(e.newValue ? parseInt(e.newValue, 10) : null)
      }
    }
    window.addEventListener('storage', handleStorageChange)
    
    // Also check periodically in case localStorage is updated in same window
    const interval = setInterval(() => {
      const count = localStorage.getItem('bhfe_courses_not_in_sitemap_count')
      setCoursesNotInSitemapCount(count ? parseInt(count, 10) : null)
    }, 1000)
    
    return () => {
      if (unsubscribe) unsubscribe()
      window.removeEventListener('storage', handleStorageChange)
      clearInterval(interval)
    }
  }, [pathname])

  const checkUnreadMessages = async () => {
    // Don't check if we're on the chat page
    if (pathname === '/dashboard/chat') {
      setHasUnreadMessages(false)
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('chat_messages')
      .select('id')
      .eq('receiver_id', user.id)
      .eq('is_read', false)
      .limit(1)

    if (!error && data && data.length > 0) {
      setHasUnreadMessages(true)
    } else {
      setHasUnreadMessages(false)
    }
  }

  const subscribeToMessages = () => {
    const channel = supabase
      .channel('sidebar-chat-messages')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'chat_messages' },
        () => {
          checkUnreadMessages()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded bg-neutral-800 border-2 border-black shadow-modern active:translate-y-1 active:shadow-none transition-all"
        aria-label="Toggle menu"
      >
        {isMobileMenuOpen ? (
          <X className="h-6 w-6 text-primary" />
        ) : (
          <Menu className="h-6 w-6 text-neutral-300" />
        )}
      </button>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/90 backdrop-blur-sm z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed lg:static inset-y-0 left-0 z-50 flex h-screen w-64 flex-col metallic border-r-4 border-black shadow-2xl transform transition-transform duration-300 ease-in-out",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        {/* Header with Speaker Grill */}
        <div className="h-24 flex items-center justify-center border-b-4 border-black speaker-grill relative overflow-hidden mx-2 mt-2 rounded-lg">
          <div className="absolute inset-0 bg-black/50"></div>
          <h1 className="relative z-10 text-2xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-neutral-400 tracking-widest italic drop-shadow-[0_2px_0_rgba(0,0,0,1)] rotate-[-2deg]">
            <span className="text-primary mr-1 not-italic text-3xl">BOOM</span>BOX
          </h1>
          {/* Screws */}
          <div className="absolute top-2 left-2 w-2 h-2 rounded-full bg-neutral-400 shadow-inner border border-black"></div>
          <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-neutral-400 shadow-inner border border-black"></div>
          <div className="absolute bottom-2 left-2 w-2 h-2 rounded-full bg-neutral-400 shadow-inner border border-black"></div>
          <div className="absolute bottom-2 right-2 w-2 h-2 rounded-full bg-neutral-400 shadow-inner border border-black"></div>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 space-y-3 px-4 py-6 overflow-y-auto custom-scrollbar">
          {navigation.map((item) => {
            const isActive = pathname === item.href || (item.href === '/dashboard/states' && pathname.startsWith('/dashboard/states'))
            const isChat = item.name === 'Chat'
            const showGlow = isChat && hasUnreadMessages && !isActive
            const isRegulatory = item.name === 'Regulatory Info'
            
            if (isRegulatory && item.hasSubmenu) {
              return (
                <div key={item.name} className="space-y-1">
                  <button
                    onClick={() => {
                      setIsRegulatoryExpanded(!isRegulatoryExpanded)
                      if (!isRegulatoryExpanded && !pathname.startsWith('/dashboard/states')) {
                        router.push('/dashboard/states')
                      }
                    }}
                    className={cn(
                      'push-button w-full flex items-center gap-3 rounded px-4 py-3 text-sm font-bold transition-all relative uppercase tracking-widest border-2 border-black',
                      isActive
                        ? 'bg-gradient-to-b from-neutral-700 to-neutral-900 text-primary translate-y-[2px] shadow-none border-t-black'
                        : 'text-neutral-400 hover:text-white'
                    )}
                  >
                    <item.icon className={cn(
                      "h-5 w-5",
                      isActive ? "text-primary drop-shadow-[0_0_5px_rgba(255,51,153,0.8)]" : "text-neutral-500"
                    )} />
                    <span className="flex-1 text-left">{item.name}</span>
                    {isRegulatoryExpanded ? (
                      <ChevronDown className="h-4 w-4 text-neutral-500" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-neutral-500" />
                    )}
                    {/* LED Indicator */}
                    <div className={cn(
                      "w-2 h-2 rounded-full border border-black shadow-inner ml-2 transition-all duration-300",
                      isActive ? "bg-primary box-shadow-[0_0_8px_#ff3399]" : "bg-neutral-800"
                    )}></div>
                  </button>
                  {isRegulatoryExpanded && (
                    <div className="ml-2 mt-2 space-y-1 p-2 bg-black/30 rounded border-2 border-black inset-shadow">
                      {regulatorySubmenu.map((subItem) => {
                        const subIsActive = pathname.startsWith('/dashboard/states')
                        return (
                          <Link
                            key={subItem.name}
                            href={subItem.href}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={cn(
                              'block px-3 py-2 text-xs font-mono font-bold uppercase tracking-wider transition-all border-l-2',
                              subIsActive
                                ? 'text-primary border-primary bg-black/50'
                                : 'text-neutral-500 border-neutral-700 hover:text-neutral-300 hover:border-neutral-500'
                            )}
                          >
                            {subItem.name}
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            }
            
            const isActiveCourses = item.name === 'Active Courses'
            
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={cn(
                  'push-button flex items-center gap-3 rounded px-4 py-3 text-sm font-bold transition-all relative uppercase tracking-widest border-2 border-black group',
                  isActive
                    ? 'bg-gradient-to-b from-neutral-800 to-black text-primary translate-y-[2px] shadow-none border-t-black'
                    : 'text-neutral-400 hover:text-white',
                  showGlow && 'animate-pulse'
                )}
              >
                <item.icon className={cn(
                  "h-5 w-5",
                  isActive ? "text-primary drop-shadow-[0_0_5px_rgba(255,51,153,0.8)]" : "text-neutral-500 group-hover:text-white"
                )} />
                <span className="flex-1">{item.name}</span>
                
                {isActiveCourses && coursesNotInSitemapCount !== null && coursesNotInSitemapCount > 0 && (
                  <span className={cn(
                    "px-1.5 py-0.5 text-[10px] font-mono border border-black shadow-inner bg-[#222]",
                    isActive 
                      ? "text-primary" 
                      : "text-accent"
                  )}>
                    {coursesNotInSitemapCount}
                  </span>
                )}
                
                {/* LED Indicator */}
                <div className={cn(
                  "w-3 h-3 rounded-full border-2 border-black shadow-inner ml-auto transition-all duration-300",
                  isActive ? "bg-primary shadow-[0_0_10px_#ff3399]" : "bg-[#111]"
                )}></div>
              </Link>
            )
          })}
        </nav>
        
        {/* Cassette Deck Footer */}
        <div className="p-4 border-t-4 border-black bg-[#111] m-2 rounded-lg relative">
           <div className="flex justify-center gap-4 mb-2">
             <div className="w-8 h-8 rounded-full border-2 border-neutral-700 bg-black relative knob">
               <div className="absolute top-1 left-1/2 -translate-x-1/2 w-1 h-3 bg-white rounded-full"></div>
             </div>
             <div className="w-8 h-8 rounded-full border-2 border-neutral-700 bg-black relative knob">
               <div className="absolute top-1 left-1/2 -translate-x-1/2 w-1 h-3 bg-white rounded-full"></div>
             </div>
           </div>
           <div className="text-[10px] text-neutral-600 text-center font-mono uppercase border-t border-neutral-800 pt-1">
             Stereo Sound
           </div>
        </div>
      </div>
    </>
  )
}
