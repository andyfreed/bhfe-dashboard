'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckSquare, Calendar, Bell, MessageSquare, Calendar as CalendarIcon, MapPin, ArrowRight, Zap } from 'lucide-react'
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

      const now = new Date()
      const currentMonth = now.getMonth()
      const currentMonthName = now.toLocaleString('default', { month: 'long' })
      const nextMonthName = new Date(now.getFullYear(), currentMonth + 1, 1).toLocaleString('default', { month: 'long' })
      const thirdMonthName = new Date(now.getFullYear(), currentMonth + 2, 1).toLocaleString('default', { month: 'long' })

      const { data: statesData } = await supabase
        .from('state_info')
        .select('state_name, state_code, renewal_month')
        .not('renewal_month', 'is', null)
        .neq('renewal_month', '')
        .neq('renewal_month', 'Varies')

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
      color: 'yellow',
    },
    {
      title: 'Calendar Events',
      value: stats.events,
      icon: Calendar,
      href: '/dashboard/calendar',
      color: 'amber',
    },
    {
      title: 'Reminders',
      value: stats.reminders,
      icon: Bell,
      href: '/dashboard/reminders',
      color: 'yellow',
    },
    {
      title: 'Unread Messages',
      value: stats.unreadMessages,
      icon: MessageSquare,
      href: '/dashboard/chat',
      color: 'amber',
    },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
          <div className="text-gray-400 font-medium">Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl glass border-yellow-500/30 p-8 lg:p-12 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 via-transparent to-transparent" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-yellow-500/50 to-transparent" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-2xl glass-light border-yellow-500/30 h-14 w-14 flex items-center justify-center overflow-hidden">
              <img src="/logo.png" alt="BHFE Logo" className="h-full w-full object-contain" />
            </div>
            <div>
              <h1 className="text-4xl lg:text-6xl font-black text-white tracking-tight neon-yellow mb-2">
                Dashboard
              </h1>
              <p className="text-yellow-400/80 text-lg font-semibold">Welcome back! Here's your business overview.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid - Modern Dark Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((card, index) => {
          const Icon = card.icon
          return (
            <Link 
              key={card.title} 
              href={card.href} 
              style={{ animationDelay: `${index * 50}ms` }} 
              className="animate-in block group"
            >
              <Card className="glass border-yellow-500/20 hover:border-yellow-500/40 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl cursor-pointer relative overflow-hidden group">
                {/* Shimmer effect */}
                <div className="absolute inset-0 shimmer opacity-0 group-hover:opacity-30 transition-opacity duration-500" />
                
                {/* Yellow accent line */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-500 via-amber-500 to-yellow-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                <CardHeader className="flex flex-row items-center justify-between pb-4 relative z-10">
                  <CardTitle className="text-xs font-black text-gray-400 uppercase tracking-widest group-hover:text-yellow-400 transition-colors">
                    {card.title}
                  </CardTitle>
                  <div className="p-3 rounded-xl bg-gradient-to-br from-yellow-500/20 to-amber-500/20 border border-yellow-500/30 group-hover:from-yellow-500/30 group-hover:to-amber-500/30 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 glow-yellow">
                    <Icon className="h-6 w-6 text-yellow-400" />
                  </div>
                </CardHeader>
                <CardContent className="relative z-10">
                  <div className="text-6xl font-black text-yellow-400 mb-3 neon-yellow">
                    {card.value}
                  </div>
                  <div className="flex items-center gap-2 text-sm font-bold text-gray-500 group-hover:text-yellow-400 transition-colors">
                    <span>View details</span>
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardContent>
                
                {/* Corner accent */}
                <div className="absolute bottom-0 right-0 w-24 h-24 bg-gradient-to-tl from-yellow-500/10 to-transparent rounded-tl-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </Card>
            </Link>
          )
        })}
      </div>

      {/* CPA Renewals - Dark Modern Card */}
      {upcomingRenewals.length > 0 && (
        <Card className="glass border-yellow-500/30 shadow-2xl overflow-hidden">
          <CardHeader className="glass-light border-b border-yellow-500/20 p-6 relative">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-500 via-amber-500 to-yellow-500" />
            <div className="flex items-center gap-4 relative z-10">
              <div className="p-3 rounded-xl glass border-yellow-500/30">
                <CalendarIcon className="h-6 w-6 text-yellow-400" />
              </div>
              <div>
                <CardTitle className="text-2xl text-white font-black neon-yellow">CPA Renewals Coming Up</CardTitle>
                <CardDescription className="text-yellow-400/70 mt-1 font-semibold">States with renewals in the next 3 months</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 glass-light">
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
                    <h3 className="font-black text-lg text-yellow-400 mb-3 uppercase tracking-wider border-b border-yellow-500/20 pb-2">
                      {column.month}
                    </h3>
                    {column.states.length > 0 ? (
                      column.states.map((renewal, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-3 p-3 rounded-lg glass-light border border-yellow-500/20 hover:border-yellow-500/40 hover:bg-yellow-500/5 transition-all group"
                        >
                          <MapPin className="h-4 w-4 text-yellow-400 flex-shrink-0 group-hover:scale-110 transition-transform" />
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-white truncate">{renewal.state_name}</div>
                            <div className="text-xs text-gray-400">Renewal: {renewal.renewal_month}</div>
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
