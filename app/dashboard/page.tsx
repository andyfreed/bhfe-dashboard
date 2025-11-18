'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckSquare, Calendar, Bell, MessageSquare, Calendar as CalendarIcon, MapPin, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default function DashboardPage() {
  const [stats, setStats] = useState({
    todos: 0,
    events: 0,
    reminders: 0,
    projects: 0,
    unreadMessages: 0,
  })
  const [upcomingRenewals, setUpcomingRenewals] = useState<Array<{
    state_name: string
    state_code: string
    renewal_month: string
  }>>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const loadStats = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get all stats (excluding projects)
      const [todos, events, reminders, messages] = await Promise.all([
        supabase.from('todos').select('id', { count: 'exact', head: true }),
        supabase.from('calendar_events').select('id', { count: 'exact', head: true }),
        supabase.from('reminders').select('id', { count: 'exact', head: true }),
        supabase.from('chat_messages').select('id', { count: 'exact', head: true })
          .eq('receiver_id', user.id)
          .eq('is_read', false),
      ])

      setStats({
        todos: todos.count || 0,
        events: events.count || 0,
        reminders: reminders.count || 0,
        projects: 0,
        unreadMessages: messages.count || 0,
      })

      // Get upcoming CPA renewals (current month, next month, 3rd month)
      const now = new Date()
      const currentMonth = now.getMonth() // 0-11
      const currentMonthName = now.toLocaleString('default', { month: 'long' })
      const nextMonthName = new Date(now.getFullYear(), currentMonth + 1, 1).toLocaleString('default', { month: 'long' })
      const thirdMonthName = new Date(now.getFullYear(), currentMonth + 2, 1).toLocaleString('default', { month: 'long' })

      const { data: statesData } = await supabase
        .from('state_info')
        .select('state_name, state_code, renewal_month')
        .not('renewal_month', 'is', null)
        .neq('renewal_month', '')
        .neq('renewal_month', 'Varies') // Exclude "Varies"

      if (statesData) {
        const renewals = statesData
          .filter(state => 
            state.renewal_month && 
            (state.renewal_month === currentMonthName || 
             state.renewal_month === nextMonthName || 
             state.renewal_month === thirdMonthName)
          )
          .map(state => ({
            state_name: state.state_name,
            state_code: state.state_code,
            renewal_month: state.renewal_month || '',
          }))
        
        setUpcomingRenewals(renewals)
      }
      setLoading(false)
    }

    loadStats()
  }, [supabase])

  const statsCards = [
    {
      title: 'To-Do Items',
      value: stats.todos,
      icon: CheckSquare,
      href: '/dashboard/todos',
      gradient: 'bg-gradient-to-br from-red-600 to-red-900',
      bgGradient: 'bg-zinc-900',
      borderColor: 'border-red-800',
      iconBg: 'bg-red-700',
      textColor: 'text-red-500',
      valueGradient: 'text-zinc-100',
    },
    {
      title: 'Calendar Events',
      value: stats.events,
      icon: Calendar,
      href: '/dashboard/calendar',
      gradient: 'bg-gradient-to-br from-zinc-600 to-zinc-800',
      bgGradient: 'bg-zinc-900',
      borderColor: 'border-zinc-600',
      iconBg: 'bg-zinc-700',
      textColor: 'text-zinc-400',
      valueGradient: 'text-zinc-100',
    },
    {
      title: 'Reminders',
      value: stats.reminders,
      icon: Bell,
      href: '/dashboard/reminders',
      gradient: 'bg-gradient-to-br from-yellow-600 to-yellow-800',
      bgGradient: 'bg-zinc-900',
      borderColor: 'border-yellow-700',
      iconBg: 'bg-yellow-700',
      textColor: 'text-yellow-500',
      valueGradient: 'text-zinc-100',
    },
    {
      title: 'Unread Messages',
      value: stats.unreadMessages,
      icon: MessageSquare,
      href: '/dashboard/chat',
      gradient: 'bg-gradient-to-br from-red-500 to-red-700',
      bgGradient: 'bg-zinc-900',
      borderColor: 'border-red-600',
      iconBg: 'bg-red-600',
      textColor: 'text-red-500',
      valueGradient: 'text-zinc-100',
    },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
          <div className="text-zinc-400 font-medium">Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in">
      {/* Welcome Header with Gradient */}
      <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-zinc-900 to-black border border-zinc-800 p-6 sm:p-8 lg:p-10 shadow-2xl shadow-black/50">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-gradient-to-tl from-red-900/20 to-transparent opacity-50 rounded-full blur-3xl"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 sm:gap-4 mb-3 sm:mb-4">
            <div className="p-2 sm:p-3 rounded bg-black/40 border border-zinc-700 h-10 w-10 sm:h-12 sm:w-12 flex items-center justify-center overflow-hidden shadow-inner">
              <img src="/logo.png" alt="BHFE Logo" className="h-full w-full object-contain opacity-80 grayscale hover:grayscale-0 transition-all" />
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-400 tracking-tighter italic drop-shadow-sm uppercase">
              Dashboard
            </h1>
          </div>
          <p className="text-base sm:text-lg lg:text-xl text-zinc-400 font-medium tracking-wide border-l-4 border-red-600 pl-4">
            Welcome back, Boss. Everything's running smooth.
          </p>
        </div>
      </div>

      {/* Stats Grid with Vibrant Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {statsCards.map((card, index) => {
          const Icon = card.icon
          return (
            <Link 
              key={card.title} 
              href={card.href} 
              style={{ animationDelay: `${index * 50}ms` }} 
              className="animate-in block group"
            >
              <Card className={`hover-lift cursor-pointer border-2 ${card.borderColor} transition-all duration-300 hover:shadow-red-900/20 hover:border-opacity-100 relative overflow-hidden bg-black/80`}>
                
                <CardHeader className="flex flex-row items-center justify-between pb-4 relative z-10 border-b border-zinc-800/50">
                  <CardTitle className={`text-sm font-bold ${card.textColor} uppercase tracking-widest`}>
                    {card.title}
                  </CardTitle>
                  <div className={`${card.gradient} p-3 rounded shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 border border-white/10`}>
                    <Icon className="h-6 w-6 text-white drop-shadow-md" />
                  </div>
                </CardHeader>
                <CardContent className="relative z-10 pt-6">
                  <div className={`text-5xl font-black ${card.valueGradient} mb-3 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]`}>
                    {card.value}
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold text-zinc-500 uppercase tracking-wider group-hover:text-zinc-300 transition-colors">
                    <span>View details</span>
                    <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      {/* CPA Renewals Coming Up */}
      {upcomingRenewals.length > 0 && (
        <Card className="border border-zinc-800 shadow-2xl overflow-hidden bg-black/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-zinc-900 to-black border-b border-zinc-800 p-6 relative overflow-hidden">
             <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
             <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-600" />
            <div className="flex items-center gap-4 relative z-10">
              <div className="p-3 rounded bg-zinc-800 border border-zinc-700 shadow-inner">
                <CalendarIcon className="h-6 w-6 text-red-500" />
              </div>
              <div>
                <CardTitle className="text-2xl text-white font-black uppercase tracking-wide italic">CPA Renewals</CardTitle>
                <CardDescription className="text-zinc-400 mt-1 font-medium tracking-wide">States with renewals in the next 3 months</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 bg-black/40">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {(() => {
                const now = new Date()
                const currentMonth = now.getMonth()
                const currentMonthName = now.toLocaleString('default', { month: 'long' })
                const nextMonthName = new Date(now.getFullYear(), currentMonth + 1, 1).toLocaleString('default', { month: 'long' })
                const thirdMonthName = new Date(now.getFullYear(), currentMonth + 2, 1).toLocaleString('default', { month: 'long' })
                
                const currentMonthStates = upcomingRenewals.filter(r => r.renewal_month === currentMonthName)
                const nextMonthStates = upcomingRenewals.filter(r => r.renewal_month === nextMonthName)
                const thirdMonthStates = upcomingRenewals.filter(r => r.renewal_month === thirdMonthName)
                
                return [
                  { month: currentMonthName, states: currentMonthStates },
                  { month: nextMonthName, states: nextMonthStates },
                  { month: thirdMonthName, states: thirdMonthStates },
                ].map((column, colIndex) => (
                  <div key={colIndex} className="space-y-3">
                    <h3 className="font-bold text-lg text-red-500 mb-3 uppercase tracking-widest border-b border-zinc-800 pb-2">{column.month}</h3>
                    {column.states.length > 0 ? (
                      column.states.map((renewal, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-3 p-3 rounded bg-zinc-900/50 border border-zinc-800 hover:border-red-500/50 hover:bg-zinc-900 transition-all group"
                        >
                          <MapPin className="h-4 w-4 text-zinc-600 group-hover:text-red-500 transition-colors flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-zinc-200 truncate group-hover:text-white">{renewal.state_name}</div>
                            <div className="text-xs text-zinc-500 group-hover:text-zinc-400">Renewal: {renewal.renewal_month}</div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-zinc-700 italic pl-2 border-l-2 border-zinc-800">No renewals</p>
                    )}
                  </div>
                ))
              })()}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
