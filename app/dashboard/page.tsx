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
      gradient: 'bg-gradient-to-br from-blue-500 via-blue-600 to-cyan-500',
      bgGradient: 'bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-50',
      borderColor: 'border-blue-400',
      iconBg: 'bg-blue-500',
      textColor: 'text-blue-700',
      valueGradient: 'bg-gradient-to-r from-blue-600 to-cyan-600',
    },
    {
      title: 'Calendar Events',
      value: stats.events,
      icon: Calendar,
      href: '/dashboard/calendar',
      gradient: 'bg-gradient-to-br from-emerald-500 via-green-600 to-teal-500',
      bgGradient: 'bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50',
      borderColor: 'border-emerald-400',
      iconBg: 'bg-emerald-500',
      textColor: 'text-emerald-700',
      valueGradient: 'bg-gradient-to-r from-emerald-600 to-teal-600',
    },
    {
      title: 'Reminders',
      value: stats.reminders,
      icon: Bell,
      href: '/dashboard/reminders',
      gradient: 'bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600',
      bgGradient: 'bg-gradient-to-br from-amber-50 via-orange-50 to-amber-50',
      borderColor: 'border-amber-400',
      iconBg: 'bg-amber-500',
      textColor: 'text-amber-700',
      valueGradient: 'bg-gradient-to-r from-amber-600 to-orange-600',
    },
    {
      title: 'Unread Messages',
      value: stats.unreadMessages,
      icon: MessageSquare,
      href: '/dashboard/chat',
      gradient: 'bg-gradient-to-br from-red-500 via-rose-600 to-red-600',
      bgGradient: 'bg-gradient-to-br from-red-50 via-rose-50 to-red-50',
      borderColor: 'border-red-400',
      iconBg: 'bg-red-500',
      textColor: 'text-red-700',
      valueGradient: 'bg-gradient-to-r from-red-600 to-rose-600',
    },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <div className="text-slate-600 font-medium">Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in">
      {/* Welcome Header with Gradient */}
      <div className="relative overflow-hidden rounded-2xl lg:rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-6 sm:p-8 lg:p-10 shadow-2xl">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjE1KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 sm:gap-4 mb-3 sm:mb-4">
            <div className="p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-white/20 backdrop-blur-sm h-10 w-10 sm:h-12 sm:w-12 flex items-center justify-center overflow-hidden">
              <img src="/logo.png" alt="BHFE Logo" className="h-full w-full object-contain" />
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight drop-shadow-lg">Dashboard</h1>
          </div>
          <p className="text-base sm:text-lg lg:text-xl text-blue-100 font-semibold drop-shadow">Welcome back! Here's an overview of your business.</p>
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
              <Card className={`hover-lift cursor-pointer border-3 ${card.borderColor} transition-all duration-300 hover:shadow-2xl relative overflow-hidden bg-white`}>
                {/* Gradient background overlay */}
                <div className={`absolute inset-0 ${card.bgGradient} opacity-40 group-hover:opacity-70 transition-opacity duration-300`} />
                
                <CardHeader className="flex flex-row items-center justify-between pb-4 relative z-10">
                  <CardTitle className="text-sm font-bold text-slate-800 uppercase tracking-wide group-hover:text-slate-900">
                    {card.title}
                  </CardTitle>
                  <div className={`${card.gradient} p-4 rounded-2xl shadow-xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                    <Icon className="h-7 w-7 text-white drop-shadow-md" />
                  </div>
                </CardHeader>
                <CardContent className="relative z-10">
                  <div className={`text-6xl font-black ${card.valueGradient} bg-clip-text text-transparent mb-3 drop-shadow-sm`}>
                    {card.value}
                  </div>
                  <div className="flex items-center gap-2 text-sm font-bold text-slate-600 group-hover:text-slate-900">
                    <span>View details</span>
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardContent>
                {/* Decorative corner accent */}
                <div className={`absolute top-0 right-0 w-20 h-20 ${card.gradient} opacity-10 rounded-bl-full`} />
              </Card>
            </Link>
          )
        })}
      </div>

      {/* CPA Renewals Coming Up */}
      {upcomingRenewals.length > 0 && (
        <Card className="border-2 border-slate-300 shadow-xl overflow-hidden bg-gradient-to-br from-white to-slate-50">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
                <CalendarIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl text-white font-bold">CPA Renewals Coming Up</CardTitle>
                <CardDescription className="text-blue-100 mt-1 font-medium">States with renewals in the next 3 months</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 bg-white">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  <div key={colIndex} className="space-y-2">
                    <h3 className="font-bold text-lg text-slate-900 mb-3">{column.month}</h3>
                    {column.states.length > 0 ? (
                      column.states.map((renewal, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 hover:border-blue-400 transition-colors"
                        >
                          <MapPin className="h-4 w-4 text-blue-600 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-slate-900 truncate">{renewal.state_name}</div>
                            <div className="text-xs text-slate-600">Renewal: {renewal.renewal_month}</div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500 italic">No renewals</p>
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
