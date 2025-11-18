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
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded bg-zinc-900 border border-zinc-700 shadow-lg hover:bg-zinc-800 hover:border-red-500 transition-colors"
        aria-label="Toggle menu"
      >
        {isMobileMenuOpen ? (
          <X className="h-6 w-6 text-red-500" />
        ) : (
          <Menu className="h-6 w-6 text-zinc-200" />
        )}
      </button>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/80 backdrop-blur-sm z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed lg:static inset-y-0 left-0 z-50 flex h-screen w-64 flex-col bg-black border-r border-zinc-800 shadow-2xl shadow-black transform transition-transform duration-300 ease-in-out",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        {/* Header with Gradient */}
        <div className="flex h-20 items-center justify-center border-b border-zinc-800 px-4 bg-gradient-to-b from-zinc-900 to-black relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
          <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-red-600 to-transparent opacity-70"></div>
          <h1 className="text-xl lg:text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-400 tracking-tighter italic relative z-10 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
            <span className="text-red-600 mr-1 not-italic">ZZ</span>DASH
          </h1>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 space-y-2 px-3 py-6 overflow-y-auto bg-black custom-scrollbar">
          {navigation.map((item) => {
            const isActive = pathname === item.href || (item.href === '/dashboard/states' && pathname.startsWith('/dashboard/states'))
            const isChat = item.name === 'Chat'
            const showGlow = isChat && hasUnreadMessages && !isActive
            const isRegulatory = item.name === 'Regulatory Info'
            
            if (isRegulatory && item.hasSubmenu) {
              return (
                <div key={item.name}>
                  <button
                    onClick={() => {
                      setIsRegulatoryExpanded(!isRegulatoryExpanded)
                      if (!isRegulatoryExpanded && !pathname.startsWith('/dashboard/states')) {
                        // Navigate to states page when expanding
                        router.push('/dashboard/states')
                      }
                    }}
                    className={cn(
                      'group w-full flex items-center gap-3 rounded px-4 py-3.5 text-sm font-bold transition-all duration-200 shadow-sm relative uppercase tracking-wider border',
                      isActive
                        ? 'bg-gradient-to-r from-red-700 to-red-900 text-white border-red-600 shadow-red-900/20'
                        : 'text-zinc-400 bg-zinc-900/50 border-transparent hover:bg-zinc-800 hover:text-white hover:border-zinc-700'
                    )}
                  >
                    <item.icon className={cn(
                      "h-5 w-5 transition-transform duration-200",
                      isActive ? "text-white drop-shadow-md" : "text-zinc-500 group-hover:text-red-500",
                      !isActive && "group-hover:scale-110"
                    )} />
                    <span className="flex-1 text-left">{item.name}</span>
                    {isRegulatoryExpanded ? (
                      <ChevronDown className="h-4 w-4 text-zinc-500" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-zinc-500" />
                    )}
                  </button>
                  {isRegulatoryExpanded && (
                    <div className="ml-4 mt-2 space-y-1 border-l border-zinc-800 pl-2">
                      {regulatorySubmenu.map((subItem) => {
                        const subIsActive = pathname.startsWith('/dashboard/states')
                        return (
                          <Link
                            key={subItem.name}
                            href={subItem.href}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={cn(
                              'group flex items-center gap-3 rounded px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-all duration-200',
                              subIsActive
                                ? 'text-red-500 bg-red-900/10 border-l-2 border-red-500'
                                : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50'
                            )}
                          >
                            <span>{subItem.name}</span>
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            }
            
            // Special handling for Active Courses to show count
            const isActiveCourses = item.name === 'Active Courses'
            
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={cn(
                  'group flex items-center gap-3 rounded px-4 py-3.5 text-sm font-bold transition-all duration-200 shadow-sm relative uppercase tracking-wider border',
                  isActive
                    ? 'bg-gradient-to-r from-red-700 to-red-900 text-white border-red-600 shadow-lg shadow-red-900/30'
                    : 'text-zinc-400 bg-zinc-900/50 border-transparent hover:bg-zinc-800 hover:text-white hover:border-zinc-700',
                  showGlow && 'shadow-lg shadow-yellow-500/20 ring-1 ring-yellow-500/40 animate-pulse border-yellow-500/30'
                )}
              >
                <item.icon className={cn(
                  "h-5 w-5 transition-transform duration-200",
                  isActive ? "text-white drop-shadow-md" : "text-zinc-500 group-hover:text-red-500",
                  !isActive && "group-hover:scale-110"
                )} />
                <span className="flex-1">{item.name}</span>
                {isActiveCourses && coursesNotInSitemapCount !== null && coursesNotInSitemapCount > 0 && (
                  <span className={cn(
                    "px-2 py-0.5 rounded text-xs font-black border",
                    isActive 
                      ? "bg-black/30 text-white border-white/20" 
                      : "bg-yellow-500 text-black border-yellow-400"
                  )}>
                    {coursesNotInSitemapCount}
                  </span>
                )}
                {isActive && (
                  <div className="ml-auto h-2 w-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                )}
              </Link>
            )
          })}
        </nav>
        
        {/* Footer/User area (optional, if sidebar has footer) */}
        <div className="p-4 border-t border-zinc-800 bg-black">
           <div className="text-xs text-zinc-600 text-center font-mono">BHFE v0.1.0</div>
        </div>
      </div>
    </>
  )
}
