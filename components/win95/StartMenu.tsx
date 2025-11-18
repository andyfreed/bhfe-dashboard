import { useState, useEffect } from 'react'
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
  ExternalLink,
  BookOpen,
  Settings,
  ChevronRight,
  LogOut
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

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

interface StartMenuProps {
  isOpen: boolean
  onClose: () => void
}

export function StartMenu({ isOpen, onClose }: StartMenuProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)

  if (!isOpen) return null

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="absolute bottom-10 left-0 w-64 win95-outset bg-[var(--win95-gray)] z-50 flex flex-row p-1">
      {/* Sidebar Strip */}
      <div className="w-8 bg-[#000080] text-white flex items-end justify-center relative">
        <h1 className="transform -rotate-90 whitespace-nowrap font-bold text-xl tracking-wider mb-2 origin-bottom-left absolute bottom-0 left-full px-2">
          <span className="font-normal">Windows</span> <span className="font-black">95</span>
        </h1>
      </div>

      {/* Menu Items */}
      <div className="flex-1 flex flex-col pl-1">
        {navigation.map((item) => {
          const isRegulatory = item.name === 'Regulatory Info'
          
          if (isRegulatory) {
            return (
              <div 
                key={item.name}
                className={`relative px-2 py-1 flex items-center gap-2 cursor-pointer ${hoveredItem === item.name ? 'bg-[#000080] text-white' : 'text-black'}`}
                onMouseEnter={() => setHoveredItem(item.name)}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <item.icon className="h-6 w-6" />
                <span className="flex-1 text-sm">{item.name}</span>
                <ChevronRight className="h-4 w-4 text-black" />
                
                {/* Submenu */}
                {hoveredItem === item.name && (
                  <div className="absolute left-full top-0 w-48 win95-outset bg-[var(--win95-gray)] ml-1">
                    {regulatorySubmenu.map((sub) => (
                      <Link
                        key={sub.name}
                        href={sub.href}
                        className="block px-4 py-1 text-black hover:bg-[#000080] hover:text-white text-sm"
                        onClick={onClose}
                      >
                        {sub.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )
          }

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`px-2 py-1 flex items-center gap-2 ${hoveredItem === item.name ? 'bg-[#000080] text-white' : 'text-black'}`}
              onMouseEnter={() => setHoveredItem(item.name)}
              onMouseLeave={() => setHoveredItem(null)}
              onClick={onClose}
            >
              <item.icon className="h-6 w-6" />
              <span className="text-sm">{item.name}</span>
            </Link>
          )
        })}
        
        <div className="h-[1px] bg-gray-400 my-1 shadow-[0_1px_0_white]" />
        
        <button
          onClick={handleSignOut}
          className={`px-2 py-1 flex items-center gap-2 w-full text-left ${hoveredItem === 'shutdown' ? 'bg-[#000080] text-white' : 'text-black'}`}
          onMouseEnter={() => setHoveredItem('shutdown')}
          onMouseLeave={() => setHoveredItem(null)}
        >
          <LogOut className="h-6 w-6" />
          <span className="text-sm">Shut Down...</span>
        </button>
      </div>
    </div>
  )
}
