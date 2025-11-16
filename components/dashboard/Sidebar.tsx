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
  Bookmark,
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
    <div className="flex h-screen w-64 flex-col bg-white border-r border-gray-200">
      <div className="flex h-16 items-center justify-center border-b border-gray-200 px-4">
        <h1 className="text-xl font-bold text-gray-900">BHFE Dashboard</h1>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-100'
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>
      <div className="border-t border-gray-200 p-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Clock className="h-4 w-4" />
          <span className="font-mono" id="current-time"></span>
        </div>
      </div>
    </div>
  )
}

