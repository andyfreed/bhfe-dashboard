'use client'

import { usePathname } from 'next/navigation'
import { Minus, Square, X } from 'lucide-react'

export function WindowFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  const getTitle = () => {
    if (pathname === '/dashboard') return 'BHFE Dashboard'
    const parts = pathname.split('/')
    const pageName = parts[parts.length - 1]
    return `BHFE Dashboard - ${pageName.charAt(0).toUpperCase() + pageName.slice(1)}`
  }

  return (
    <div className="win95-window p-1 h-full flex flex-col bg-[var(--win95-gray)]">
      {/* Title Bar */}
      <div className="win95-title-bar mb-1 select-none">
        <div className="flex items-center gap-1">
          <img src="/icon-192x192.png" className="h-4 w-4 bg-white p-[1px]" />
          <span className="text-sm">{getTitle()}</span>
        </div>
        <div className="flex gap-1">
          <button className="win95-btn p-0 w-4 h-4 flex items-center justify-center bg-[var(--win95-gray)]">
            <Minus className="h-3 w-3 stroke-[3]" />
          </button>
          <button className="win95-btn p-0 w-4 h-4 flex items-center justify-center bg-[var(--win95-gray)]">
            <Square className="h-3 w-3 stroke-[3]" />
          </button>
          <button className="win95-btn p-0 w-4 h-4 flex items-center justify-center bg-[var(--win95-gray)] ml-1">
            <X className="h-3 w-3 stroke-[3]" />
          </button>
        </div>
      </div>

      {/* Menu Bar (Mock) */}
      <div className="flex gap-2 px-2 py-1 text-sm mb-1 border-b border-white shadow-[0_1px_0_#808080]">
        <span className="underline cursor-pointer">F</span>ile
        <span className="underline cursor-pointer">E</span>dit
        <span className="underline cursor-pointer">V</span>iew
        <span className="underline cursor-pointer">H</span>elp
      </div>

      {/* Main Content Area */}
      <div className="win95-inset flex-1 overflow-auto p-4 bg-white text-black relative">
        {children}
      </div>
      
      {/* Status Bar */}
      <div className="win95-inset mt-1 px-2 py-0.5 text-sm text-gray-600 flex gap-4">
        <span className="flex-1">Ready</span>
        <span className="win95-inset px-2 w-20">NUM</span>
      </div>
    </div>
  )
}
