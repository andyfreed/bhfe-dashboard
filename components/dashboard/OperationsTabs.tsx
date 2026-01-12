'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'

const tabs = [
  { name: 'All', href: '/dashboard/operations', category: 'All' },
  { name: 'Hosting and Domains', href: '/dashboard/operations?category=Hosting%20and%20Domains', category: 'Hosting and Domains' },
  { name: 'WordPress Plugins', href: '/dashboard/operations?category=WordPress%20Plugins', category: 'WordPress Plugins' },
  { name: 'Phones', href: '/dashboard/operations?category=Phones', category: 'Phones' },
  { name: 'AI Services', href: '/dashboard/operations?category=AI%20Services', category: 'AI Services' },
  { name: 'Contacts', href: '/dashboard/contacts' },
  { name: 'Other', href: '/dashboard/operations?category=Other', category: 'Other' },
]

export function OperationsTabs() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const selectedCategory = searchParams.get('category') || 'All'

  return (
    <div className="flex gap-2 flex-wrap">
      {tabs.map((tab) => {
        const isActive = tab.category
          ? pathname === '/dashboard/operations' && selectedCategory === tab.category
          : pathname === tab.href
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
