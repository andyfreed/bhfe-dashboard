'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
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
  Clock,
  ExternalLink,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'To-Do Lists', href: '/dashboard/todos', icon: CheckSquare },
  { name: 'Calendar', href: '/dashboard/calendar', icon: Calendar },
  { name: 'Reminders', href: '/dashboard/reminders', icon: Bell },
  { name: 'Projects', href: '/dashboard/projects', icon: FolderKanban },
  { name: 'Contacts', href: '/dashboard/contacts', icon: Users },
  { name: 'Notes', href: '/dashboard/notes', icon: FileText },
  { name: 'State Info', href: '/dashboard/states', icon: MapPin },
  { name: 'Chat', href: '/dashboard/chat', icon: MessageSquare },
  { name: 'Links', href: '/dashboard/links', icon: ExternalLink },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex h-screen w-64 flex-col bg-white border-r-2 border-slate-300 shadow-xl">
      {/* Header with Gradient */}
      <div className="flex h-20 items-center justify-center border-b-2 border-slate-300 px-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 shadow-lg">
        <h1 className="text-2xl font-extrabold text-white tracking-tight drop-shadow-lg">BHFE Dashboard</h1>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 space-y-2 px-3 py-6 overflow-y-auto bg-gradient-to-b from-slate-50 to-white">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'group flex items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-bold transition-all duration-200 shadow-sm',
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
              <span>{item.name}</span>
              {isActive && (
                <div className="ml-auto h-2 w-2 rounded-full bg-white/90 animate-pulse shadow-sm" />
              )}
            </Link>
          )
        })}
      </nav>
      
      {/* Time Display */}
      <div className="border-t-2 border-slate-300 p-4 bg-gradient-to-b from-slate-50 to-white">
        <div className="flex items-center gap-3 rounded-xl px-4 py-3 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 shadow-md">
          <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 shadow-md">
            <Clock className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Current Time</div>
            <div className="font-mono text-sm font-bold text-slate-900" id="current-time"></div>
          </div>
        </div>
      </div>
    </div>
  )
}
