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
          <div className="h-5 w-5 border-2 border-fuchsia-500 border-t-transparent rounded-full animate-spin glow-pink" />
          <div className="text-cyan-400 font-medium neon-cyan">Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in scanlines">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl glass border-fuchsia-500/40 p-8 lg:p-12 shadow-2xl laser-beam">
        <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-500/10 via-cyan-500/5 to-transparent" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-fuchsia-500 via-cyan-500 to-transparent animate-pulse" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-2xl glass-light border-fuchsia-500/40 h-14 w-14 flex items-center justify-center overflow-hidden glow-pink">
              <img src="/logo.png" alt="BHFE Logo" className="h-full w-full object-contain" />
            </div>
            <div>
              <h1 className="text-4xl lg:text-6xl font-black text-white tracking-tight neon-pink mb-2 animate-neon-flicker">
                Dashboard
              </h1>
              <p className="text-cyan-400/90 text-lg font-semibold neon-cyan">Welcome back! Here's your business overview.</p>
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
              <Card className="glass border-fuchsia-500/30 hover:border-fuchsia-500/50 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl cursor-pointer relative overflow-hidden group scan-line">
                {/* Shimmer effect */}
                <div className="absolute inset-0 shimmer opacity-0 group-hover:opacity-40 transition-opacity duration-500" />
                
                {/* Neon accent line */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-fuchsia-500 via-cyan-500 to-fuchsia-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-pulse" />
                
                <CardHeader className="flex flex-row items-center justify-between pb-4 relative z-10">
                  <CardTitle className="text-xs font-black text-gray-400 uppercase tracking-widest group-hover:text-fuchsia-400 transition-colors neon-pink">
                    {card.title}
                  </CardTitle>
                  <div className="p-3 rounded-xl bg-gradient-to-br from-fuchsia-500/30 to-pink-500/20 border border-fuchsia-500/40 group-hover:from-fuchsia-500/40 group-hover:to-pink-500/30 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 glow-pink">
                    <Icon className="h-6 w-6 text-fuchsia-400 neon-pink" />
                  </div>
                </CardHeader>
                <CardContent className="relative z-10">
                  <div className="text-6xl font-black text-fuchsia-400 mb-3 neon-pink animate-pulse-glow">
                    {card.value}
                  </div>
                  <div className="flex items-center gap-2 text-sm font-bold text-gray-500 group-hover:text-cyan-400 transition-colors neon-cyan">
                    <span>View details</span>
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardContent>
                
                {/* Corner accent */}
                <div className="absolute bottom-0 right-0 w-24 h-24 bg-gradient-to-tl from-fuchsia-500/20 via-cyan-500/10 to-transparent rounded-tl-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </Card>
            </Link>
          )
        })}
      </div>

      {/* CPA Renewals - Synthwave Card */}
      {upcomingRenewals.length > 0 && (
        <Card className="glass border-fuchsia-500/40 shadow-2xl overflow-hidden laser-beam">
          <CardHeader className="glass-light border-b border-fuchsia-500/30 p-6 relative">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-fuchsia-500 via-cyan-500 to-fuchsia-500 animate-pulse" />
            <div className="flex items-center gap-4 relative z-10">
              <div className="p-3 rounded-xl glass border-fuchsia-500/40 glow-pink">
                <CalendarIcon className="h-6 w-6 text-fuchsia-400 neon-pink" />
              </div>
              <div>
                <CardTitle className="text-2xl text-white font-black neon-pink animate-neon-flicker">CPA Renewals Coming Up</CardTitle>
                <CardDescription className="text-cyan-400/80 mt-1 font-semibold neon-cyan">States with renewals in the next 3 months</CardDescription>
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
                    <h3 className="font-black text-lg text-fuchsia-400 mb-3 uppercase tracking-wider border-b border-fuchsia-500/30 pb-2 neon-pink">
                      {column.month}
                    </h3>
                    {column.states.length > 0 ? (
                      column.states.map((renewal, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-3 p-3 rounded-lg glass-light border border-fuchsia-500/30 hover:border-cyan-500/40 hover:bg-cyan-500/10 transition-all group glow-pink hover:glow-cyan"
                        >
                          <MapPin className="h-4 w-4 text-fuchsia-400 flex-shrink-0 group-hover:text-cyan-400 group-hover:scale-110 transition-transform neon-pink group-hover:neon-cyan" />
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
