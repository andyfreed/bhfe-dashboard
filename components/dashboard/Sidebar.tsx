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
  const supabase = createClient()

  useEffect(() => {
    checkUnreadMessages()
    const unsubscribe = subscribeToMessages()
    setIsMobileMenuOpen(false)
    
    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [pathname])

  const checkUnreadMessages = async () => {
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
        className="lg:hidden fixed top-4 left-4 z-50 p-3 rounded-xl glass border-yellow-500/30 shadow-lg hover:border-yellow-500/50 transition-all"
        aria-label="Toggle menu"
      >
        {isMobileMenuOpen ? (
          <X className="h-6 w-6 text-yellow-400" />
        ) : (
          <Menu className="h-6 w-6 text-yellow-400" />
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
        "fixed lg:static inset-y-0 left-0 z-50 flex h-screen w-72 flex-col shiny-black border-r border-yellow-500/20 transform transition-transform duration-300 ease-in-out",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        {/* Header */}
        <div className="flex h-24 items-center justify-between px-6 border-b border-yellow-500/20 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/5 via-transparent to-transparent" />
          <div className="flex items-center gap-3 relative z-10">
            <div className="h-10 w-10 rounded-xl glass-light border-yellow-500/30 flex items-center justify-center overflow-hidden">
              <img src="/logo.png" alt="BHFE Logo" className="h-full w-full object-contain" />
            </div>
            <div>
              <h1 className="text-lg font-black text-white tracking-tight">BHFE</h1>
              <p className="text-xs text-yellow-400/60 font-semibold uppercase tracking-wider">Dashboard</p>
            </div>
          </div>
          <div className="h-1 w-12 bg-gradient-to-r from-yellow-500 to-transparent rounded-full" />
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
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
                        router.push('/dashboard/states')
                      }
                    }}
                    className={cn(
                      'group w-full flex items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-bold transition-all duration-300 relative',
                      isActive
                        ? 'bg-gradient-to-r from-yellow-500/20 to-amber-500/20 text-yellow-400 border border-yellow-500/40 glow-yellow'
                        : 'text-gray-400 glass-light border border-transparent hover:border-yellow-500/20 hover:text-yellow-400 hover:bg-yellow-500/5'
                    )}
                  >
                    <item.icon className={cn(
                      "h-5 w-5 transition-all duration-300",
                      isActive ? "text-yellow-400" : "text-gray-500 group-hover:text-yellow-400",
                      !isActive && "group-hover:scale-110"
                    )} />
                    <span className="flex-1 text-left">{item.name}</span>
                    {isRegulatoryExpanded ? (
                      <ChevronDown className="h-4 w-4 text-yellow-400/60" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-gray-500" />
                    )}
                    {isActive && (
                      <div className="absolute right-2 h-2 w-2 rounded-full bg-yellow-400 animate-pulse shadow-lg shadow-yellow-400/50" />
                    )}
                  </button>
                  {isRegulatoryExpanded && (
                    <div className="ml-4 mt-1 space-y-1 border-l border-yellow-500/20 pl-4">
                      {regulatorySubmenu.map((subItem) => {
                        const subIsActive = pathname.startsWith('/dashboard/states')
                        return (
                          <Link
                            key={subItem.name}
                            href={subItem.href}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={cn(
                              'group flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200',
                              subIsActive
                                ? 'text-yellow-400 bg-yellow-500/10 border-l-2 border-yellow-500'
                                : 'text-gray-500 hover:text-yellow-400 hover:bg-yellow-500/5'
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
            
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={cn(
                  'group flex items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-bold transition-all duration-300 relative',
                  isActive
                    ? 'bg-gradient-to-r from-yellow-500/20 to-amber-500/20 text-yellow-400 border border-yellow-500/40 glow-yellow'
                    : 'text-gray-400 glass-light border border-transparent hover:border-yellow-500/20 hover:text-yellow-400 hover:bg-yellow-500/5',
                  showGlow && 'animate-pulse-glow border-yellow-500/60'
                )}
              >
                <item.icon className={cn(
                  "h-5 w-5 transition-all duration-300",
                  isActive ? "text-yellow-400" : "text-gray-500 group-hover:text-yellow-400",
                  !isActive && "group-hover:scale-110"
                )} />
                <span>{item.name}</span>
                {isActive && (
                  <div className="ml-auto h-2 w-2 rounded-full bg-yellow-400 animate-pulse shadow-lg shadow-yellow-400/50" />
                )}
                {showGlow && (
                  <div className="absolute inset-0 rounded-xl bg-yellow-500/10 animate-ping opacity-75" />
                )}
              </Link>
            )
          })}
        </nav>

        {/* Bottom accent */}
        <div className="h-px bg-gradient-to-r from-transparent via-yellow-500/50 to-transparent mx-4" />
      </div>
    </>
  )
}
