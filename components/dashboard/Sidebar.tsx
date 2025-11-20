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
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-neutral-800 border border-white/5 shadow-lg hover:bg-neutral-700 transition-colors"
        aria-label="Toggle menu"
      >
        {isMobileMenuOpen ? (
          <X className="h-6 w-6 text-neutral-200" />
        ) : (
          <Menu className="h-6 w-6 text-neutral-200" />
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
        "fixed lg:static inset-y-0 left-0 z-50 flex h-screen w-64 flex-col bg-neutral-900 border-r border-white/5 shadow-xl transform transition-transform duration-300 ease-in-out",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        {/* Header */}
        <div className="flex h-20 items-center justify-center border-b border-white/5 px-4 bg-neutral-950/80 backdrop-blur-md">
          <h1 className="text-xl lg:text-2xl font-medium text-white tracking-tight">BHFE Dashboard</h1>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 space-y-2 px-3 py-6 overflow-y-auto bg-neutral-900">
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
                      'group w-full flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-light transition-all duration-200 relative',
                      isActive
                        ? 'bg-white/5 border border-white/10 text-neutral-200'
                        : 'text-neutral-400 border border-transparent hover:bg-white/5 hover:text-neutral-200 hover:border-white/5'
                    )}
                  >
                    <item.icon className={cn(
                      "h-5 w-5 transition-transform duration-200",
                      isActive ? "text-neutral-200" : "text-neutral-400 group-hover:text-neutral-200",
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
                        const subIsActive = pathname.startsWith('/dashboard/states')
                        return (
                          <Link
                            key={subItem.name}
                            href={subItem.href}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={cn(
                              'group flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-light transition-all duration-200',
                              subIsActive
                                ? 'bg-white/5 text-neutral-200 border border-white/10'
                                : 'text-neutral-400 hover:bg-white/5 hover:text-neutral-200'
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
                  'group flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-light transition-all duration-200 relative',
                  isActive
                    ? 'bg-white/5 border border-white/10 text-neutral-200'
                    : 'text-neutral-400 border border-transparent hover:bg-white/5 hover:text-neutral-200 hover:border-white/5',
                  showGlow && 'ring-2 ring-emerald-500/40 ring-opacity-50 animate-pulse'
                )}
                style={showGlow ? {
                  boxShadow: '0 0 20px rgba(96, 165, 250, 0.6), 0 0 40px rgba(96, 165, 250, 0.4)',
                } : {}}
              >
                <item.icon className={cn(
                  "h-5 w-5 transition-transform duration-200",
                  isActive ? "text-neutral-200" : "text-neutral-400 group-hover:text-neutral-200",
                  !isActive && "group-hover:scale-110"
                )} />
                <span className="flex-1">{item.name}</span>
                {isActiveCourses && coursesNotInSitemapCount !== null && coursesNotInSitemapCount > 0 && (
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-xs font-medium",
                    isActive 
                      ? "bg-white/10 text-neutral-200" 
                      : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  )}>
                    {coursesNotInSitemapCount}
                  </span>
                )}
                {isActive && (
                  <div className="ml-auto h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                )}
                {showGlow && (
                  <div className="absolute inset-0 rounded-lg bg-emerald-500/10 animate-ping opacity-75" />
                )}
              </Link>
            )
          })}
        </nav>
      </div>
    </>
  )
}
