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
        <div className="text-black font-bold">Loading...</div>
      </div>
    )
  }

  return (
    <div className="space-y-4 font-sans">
      {/* Welcome Message */}
      <div className="flex items-center gap-4 mb-6">
        <img src="/logo.png" alt="BHFE Logo" className="h-12 w-12" />
        <div>
          <h1 className="text-xl font-bold">Welcome to BHFE Dashboard</h1>
          <p className="text-sm">System status: Operational</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((card) => {
          const Icon = card.icon
          return (
            <Link key={card.title} href={card.href}>
              <div className="win95-btn w-full flex flex-col items-start p-2 h-full active:translate-x-[1px] active:translate-y-[1px]">
                <div className="flex items-center gap-2 mb-2 w-full border-b border-gray-400 pb-1">
                  <Icon className="h-4 w-4" />
                  <span className="font-bold text-sm">{card.title}</span>
                </div>
                <div className="text-2xl font-bold mb-1">{card.value}</div>
                <div className="text-xs underline">Open</div>
              </div>
            </Link>
          )
        })}
      </div>

      {/* CPA Renewals Group Box */}
      {upcomingRenewals.length > 0 && (
        <fieldset className="border-2 border-white border-l-gray-500 border-t-gray-500 p-2 mt-4">
          <legend className="px-1 text-sm ml-2">CPA Renewals</legend>
          <div className="p-2 bg-white win95-inset h-64 overflow-y-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr>
                  <th className="border-b border-black px-2 py-1">State</th>
                  <th className="border-b border-black px-2 py-1">Code</th>
                  <th className="border-b border-black px-2 py-1">Month</th>
                </tr>
              </thead>
              <tbody>
                {upcomingRenewals.map((renewal, i) => (
                  <tr key={i} className="hover:bg-[#000080] hover:text-white cursor-default">
                    <td className="px-2 py-1">{renewal.state_name}</td>
                    <td className="px-2 py-1">{renewal.state_code}</td>
                    <td className="px-2 py-1">{renewal.renewal_month}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </fieldset>
      )}
    </div>
  )
}
