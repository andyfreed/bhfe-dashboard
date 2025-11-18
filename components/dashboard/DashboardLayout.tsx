import { Taskbar } from '@/components/win95/Taskbar'
import { WindowFrame } from '@/components/win95/WindowFrame'

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-[var(--win95-teal)]">
      {/* Desktop Area */}
      <div className="flex-1 p-2 pb-12 overflow-hidden relative">
        {/* Desktop Icons (Mock) */}
        <div className="absolute top-4 left-4 flex flex-col gap-6 w-20 pointer-events-none z-0 text-white">
          <div className="flex flex-col items-center gap-1 group">
            <img src="/computer.png" className="w-8 h-8 pixelated" alt="My Computer" />
            <span className="text-xs text-center bg-[#008080] group-hover:bg-[#000080] px-1">My Computer</span>
          </div>
          <div className="flex flex-col items-center gap-1 group">
            <img src="/trash.png" className="w-8 h-8 pixelated" alt="Recycle Bin" />
            <span className="text-xs text-center bg-[#008080] group-hover:bg-[#000080] px-1">Recycle Bin</span>
          </div>
        </div>

        {/* Main Window */}
        <div className="h-full w-full md:w-[90%] md:h-[90%] mx-auto md:mt-4 shadow-xl">
          <WindowFrame>{children}</WindowFrame>
        </div>
      </div>

      {/* Taskbar */}
      <Taskbar />
    </div>
  )
}
