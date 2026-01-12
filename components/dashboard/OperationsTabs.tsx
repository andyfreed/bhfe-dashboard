'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const tabs = [
  { name: 'Operations', href: '/dashboard/operations' },
  { name: 'Contacts', href: '/dashboard/contacts' },
  { name: 'Links', href: '/dashboard/links' },
]

export function OperationsTabs() {
  const pathname = usePathname()

  return (
    <div className="flex gap-2 flex-wrap">
      {tabs.map((tab) => {
        const isActive = pathname === tab.href
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              'px-4 py-2 rounded-lg font-medium transition-colors',
              isActive
                ? 'bg-blue-600 text-white'
                : 'bg-white text-slate-700 border-2 border-slate-200 hover:bg-slate-50'
            )}
          >
            {tab.name}
          </Link>
        )
      })}
    </div>
  )
}
