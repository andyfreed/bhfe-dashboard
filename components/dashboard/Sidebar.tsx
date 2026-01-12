'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  CheckSquare,
  Calendar,
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
  User,
  SlidersHorizontal,
  BarChart3,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Chat', href: '/dashboard/chat', icon: MessageSquare },
  { name: 'To-Do Lists', href: '/dashboard/todos', icon: CheckSquare },
  { name: 'Calendar', href: '/dashboard/calendar', icon: Calendar },
  { name: 'Projects', href: '/dashboard/projects', icon: FolderKanban },
  { name: 'Notes', href: '/dashboard/notes', icon: FileText },
  { name: 'Active Courses', href: '/dashboard/courses', icon: BookOpen },
  { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
  { name: 'Regulatory', href: '/dashboard/regulatory/cpa', icon: MapPin, hasSubmenu: true },
  { name: 'Operations', href: '/dashboard/operations', icon: Settings, hasSubmenu: true },
  { name: 'Profile', href: '/dashboard/profile', icon: User },
  { name: 'Settings', href: '/dashboard/settings', icon: SlidersHorizontal },
]

const regulatorySubmenu = [
  { name: 'CPA', href: '/dashboard/regulatory/cpa' },
  { name: 'IAR', href: '/dashboard/regulatory/iar' },
  { name: 'CFP', href: '/dashboard/regulatory/cfp' },
  { name: 'EA', href: '/dashboard/regulatory/ea' },
  { name: 'OTRP', href: '/dashboard/regulatory/otrp' },
  { name: 'ERPA', href: '/dashboard/regulatory/erpa' },
  { name: 'CDFA', href: '/dashboard/regulatory/cdfa' },
]

const operationsSubmenu = [
  { name: 'Operations', href: '/dashboard/operations' },
  { name: 'Contacts', href: '/dashboard/contacts' },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [unreadMessageCount, setUnreadMessageCount] = useState(0)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isRegulatoryExpanded, setIsRegulatoryExpanded] = useState(false)
  const [isOperationsExpanded, setIsOperationsExpanded] = useState(false)
  const [coursesNotInSitemapCount, setCoursesNotInSitemapCount] = useState<number | null>(null)
  const supabase = createClient()

  useEffect(() => {
    checkUnreadMessages()
    const unsubscribe = subscribeToMessages()
    // Close mobile menu when navigating
    setIsMobileMenuOpen(false)
    
    // Auto-expand submenus based on current path
    if (pathname.startsWith('/dashboard/regulatory')) {
      setIsRegulatoryExpanded(true)
    }
    if (pathname.startsWith('/dashboard/operations') || pathname === '/dashboard/contacts' || pathname === '/dashboard/links') {
      setIsOperationsExpanded(true)
    }
    
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
      setUnreadMessageCount(0)
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error, count } = await supabase
      .from('chat_messages')
      .select('id', { count: 'exact' })
      .eq('receiver_id', user.id)
      .eq('is_read', false)

    if (!error && count !== null) {
      setUnreadMessageCount(count)
    } else {
      setUnreadMessageCount(0)
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
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white border-2 border-slate-300 shadow-lg hover:bg-slate-100 transition-colors"
        aria-label="Toggle menu"
      >
        {isMobileMenuOpen ? (
          <X className="h-6 w-6 text-slate-700" />
        ) : (
          <Menu className="h-6 w-6 text-slate-700" />
        )}
      </button>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed lg:static inset-y-0 left-0 z-50 flex h-screen w-64 flex-col bg-white border-r-2 border-slate-300 shadow-xl transform transition-transform duration-300 ease-in-out",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        {/* Header with Gradient */}
        <div className="flex h-20 items-center justify-center border-b-2 border-slate-300 px-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 shadow-lg">
          <h1 className="text-xl lg:text-2xl font-extrabold text-white tracking-tight drop-shadow-lg">BHFE Dashboard</h1>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 space-y-2 px-3 py-6 overflow-y-auto bg-gradient-to-b from-slate-50 to-white">
          {navigation.map((item) => {
            const isActive = pathname === item.href || 
              (item.href === '/dashboard/regulatory/cpa' && pathname.startsWith('/dashboard/regulatory')) ||
              (item.href === '/dashboard/operations' && (pathname.startsWith('/dashboard/operations') || pathname === '/dashboard/contacts' || pathname === '/dashboard/links'))
            const isChat = item.name === 'Chat'
            const showGlow = isChat && unreadMessageCount > 0 && !isActive
            const isRegulatory = item.name === 'Regulatory'
            const isOperations = item.name === 'Operations'
            
            if (isRegulatory && item.hasSubmenu) {
              return (
                <div key={item.name}>
                  <button
                    onClick={() => {
                      setIsRegulatoryExpanded(!isRegulatoryExpanded)
                      if (!isRegulatoryExpanded && !pathname.startsWith('/dashboard/regulatory')) {
                        router.push('/dashboard/regulatory/cpa')
                      }
                    }}
                    className={cn(
                      'group w-full flex items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-bold transition-all duration-200 shadow-sm relative',
                      isActive
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/40 scale-[1.02]'
                        : 'text-slate-700 bg-white border-2 border-slate-200 hover:bg-slate-100 hover:text-slate-900 hover:scale-[1.01] hover:shadow-md'
                    )}
                  >
                    <item.icon className={cn(
                      "h-5 w-5 transition-transform duration-200",
                      isActive ? "text-white drop-shadow-md" : "text-slate-500 group-hover:text-slate-700",
                      !isActive && "group-hover:scale-110"
                    )} />
                    <span className="flex-1 text-left">{item.name}</span>
                    {isRegulatoryExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>
                  {isRegulatoryExpanded && (
                    <div className="ml-4 mt-2 space-y-1">
                      {regulatorySubmenu.map((subItem) => {
                        const subIsActive = pathname === subItem.href
                        return (
                          <Link
                            key={subItem.name}
                            href={subItem.href}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={cn(
                              'group flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200',
                              subIsActive
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
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
            
            if (isOperations && item.hasSubmenu) {
              return (
                <div key={item.name}>
                  <button
                    onClick={() => {
                      setIsOperationsExpanded(!isOperationsExpanded)
                      if (!isOperationsExpanded && !pathname.startsWith('/dashboard/operations') && pathname !== '/dashboard/contacts' && pathname !== '/dashboard/links') {
                        router.push('/dashboard/operations')
                      }
                    }}
                    className={cn(
                      'group w-full flex items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-bold transition-all duration-200 shadow-sm relative',
                      isActive
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/40 scale-[1.02]'
                        : 'text-slate-700 bg-white border-2 border-slate-200 hover:bg-slate-100 hover:text-slate-900 hover:scale-[1.01] hover:shadow-md'
                    )}
                  >
                    <item.icon className={cn(
                      "h-5 w-5 transition-transform duration-200",
                      isActive ? "text-white drop-shadow-md" : "text-slate-500 group-hover:text-slate-700",
                      !isActive && "group-hover:scale-110"
                    )} />
                    <span className="flex-1 text-left">{item.name}</span>
                    {isOperationsExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>
                  {isOperationsExpanded && (
                    <div className="ml-4 mt-2 space-y-1">
                      {operationsSubmenu.map((subItem) => {
                        const subIsActive = pathname === subItem.href
                        return (
                          <Link
                            key={subItem.name}
                            href={subItem.href}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={cn(
                              'group flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200',
                              subIsActive
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
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
                  'group flex items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-bold transition-all duration-200 shadow-sm relative',
                  isActive
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/40 scale-[1.02]'
                    : 'text-slate-700 bg-white border-2 border-slate-200 hover:bg-slate-100 hover:text-slate-900 hover:scale-[1.01] hover:shadow-md',
                  showGlow && 'shadow-lg shadow-blue-400/60 ring-2 ring-blue-400/40 ring-opacity-50 animate-pulse'
                )}
                style={showGlow ? {
                  boxShadow: '0 0 20px rgba(96, 165, 250, 0.6), 0 0 40px rgba(96, 165, 250, 0.4)',
                } : {}}
              >
                <item.icon className={cn(
                  "h-5 w-5 transition-transform duration-200",
                  isActive ? "text-white drop-shadow-md" : "text-slate-500 group-hover:text-slate-700",
                  !isActive && "group-hover:scale-110"
                )} />
                <span className="flex-1">{item.name}</span>
                {isActiveCourses && coursesNotInSitemapCount !== null && coursesNotInSitemapCount > 0 && (
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-xs font-bold",
                    isActive 
                      ? "bg-white/20 text-white" 
                      : "bg-red-500 text-white"
                  )}>
                    {coursesNotInSitemapCount}
                  </span>
                )}
                {isChat && unreadMessageCount > 0 && (
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-xs font-bold",
                    isActive 
                      ? "bg-white/20 text-white" 
                      : "bg-red-500 text-white"
                  )}>
                    {unreadMessageCount}
                  </span>
                )}
                {isActive && (
                  <div className="ml-auto h-2 w-2 rounded-full bg-white/90 animate-pulse shadow-sm" />
                )}
                {showGlow && (
                  <div className="absolute inset-0 rounded-xl bg-blue-400/10 animate-ping opacity-75" />
                )}
              </Link>
            )
          })}
        </nav>
      </div>
    </>
  )
}
