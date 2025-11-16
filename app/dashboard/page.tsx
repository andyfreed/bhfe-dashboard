'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckSquare, Calendar, Bell, FolderKanban, Users, FileText, MessageSquare, Sparkles, TrendingUp, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default function DashboardPage() {
  const [stats, setStats] = useState({
    todos: 0,
    events: 0,
    reminders: 0,
    projects: 0,
    contacts: 0,
    notes: 0,
    unreadMessages: 0,
  })
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const loadStats = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get all stats
      const [todos, events, reminders, projects, contacts, notes, messages] = await Promise.all([
        supabase.from('todos').select('id', { count: 'exact', head: true }),
        supabase.from('calendar_events').select('id', { count: 'exact', head: true }),
        supabase.from('reminders').select('id', { count: 'exact', head: true }),
        supabase.from('projects').select('id', { count: 'exact', head: true }),
        supabase.from('contacts').select('id', { count: 'exact', head: true }),
        supabase.from('notes').select('id', { count: 'exact', head: true }),
        supabase.from('chat_messages').select('id', { count: 'exact', head: true })
          .eq('receiver_id', user.id)
          .eq('is_read', false),
      ])

      setStats({
        todos: todos.count || 0,
        events: events.count || 0,
        reminders: reminders.count || 0,
        projects: projects.count || 0,
        contacts: contacts.count || 0,
        notes: notes.count || 0,
        unreadMessages: messages.count || 0,
      })
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
      title: 'Projects',
      value: stats.projects,
      icon: FolderKanban,
      href: '/dashboard/projects',
      gradient: 'bg-gradient-to-br from-purple-500 via-indigo-600 to-pink-500',
      bgGradient: 'bg-gradient-to-br from-purple-50 via-pink-50 to-purple-50',
      borderColor: 'border-purple-400',
      iconBg: 'bg-purple-500',
      textColor: 'text-purple-700',
      valueGradient: 'bg-gradient-to-r from-purple-600 to-pink-600',
    },
    {
      title: 'Contacts',
      value: stats.contacts,
      icon: Users,
      href: '/dashboard/contacts',
      gradient: 'bg-gradient-to-br from-indigo-500 via-blue-600 to-indigo-600',
      bgGradient: 'bg-gradient-to-br from-indigo-50 via-blue-50 to-indigo-50',
      borderColor: 'border-indigo-400',
      iconBg: 'bg-indigo-500',
      textColor: 'text-indigo-700',
      valueGradient: 'bg-gradient-to-r from-indigo-600 to-blue-600',
    },
    {
      title: 'Notes',
      value: stats.notes,
      icon: FileText,
      href: '/dashboard/notes',
      gradient: 'bg-gradient-to-br from-rose-500 via-pink-600 to-rose-600',
      bgGradient: 'bg-gradient-to-br from-rose-50 via-pink-50 to-rose-50',
      borderColor: 'border-rose-400',
      iconBg: 'bg-rose-500',
      textColor: 'text-rose-700',
      valueGradient: 'bg-gradient-to-r from-rose-600 to-pink-600',
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
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-10 shadow-2xl">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjE1KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30" />
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-2xl bg-white/20 backdrop-blur-sm">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-5xl font-extrabold text-white tracking-tight drop-shadow-lg">Dashboard</h1>
          </div>
          <p className="text-xl text-blue-100 font-semibold drop-shadow">Welcome back! Here's an overview of your business.</p>
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

      {/* Quick Actions & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-2 border-slate-300 shadow-xl overflow-hidden bg-gradient-to-br from-white to-slate-50">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl text-white font-bold">Quick Actions</CardTitle>
                <CardDescription className="text-blue-100 mt-1 font-medium">Common tasks you might want to perform</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-3 bg-white">
            <Link href="/dashboard/todos" className="flex items-center gap-4 p-5 rounded-2xl bg-gradient-to-r from-blue-50 to-cyan-50 hover:from-blue-100 hover:to-cyan-100 transition-all duration-200 border-2 border-blue-300 hover:border-blue-500 hover:shadow-lg group">
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-md group-hover:scale-110 transition-transform">
                <CheckSquare className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <div className="font-bold text-lg text-slate-900 group-hover:text-blue-700">Create New To-Do</div>
                <div className="text-sm text-slate-600 mt-1">Add a task to your list</div>
              </div>
              <ArrowRight className="h-5 w-5 text-blue-600 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href="/dashboard/calendar" className="flex items-center gap-4 p-5 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 transition-all duration-200 border-2 border-emerald-300 hover:border-emerald-500 hover:shadow-lg group">
              <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-md group-hover:scale-110 transition-transform">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <div className="font-bold text-lg text-slate-900 group-hover:text-emerald-700">Add Calendar Event</div>
                <div className="text-sm text-slate-600 mt-1">Schedule something new</div>
              </div>
              <ArrowRight className="h-5 w-5 text-emerald-600 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href="/dashboard/contacts" className="flex items-center gap-4 p-5 rounded-2xl bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 transition-all duration-200 border-2 border-purple-300 hover:border-purple-500 hover:shadow-lg group">
              <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-md group-hover:scale-110 transition-transform">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <div className="font-bold text-lg text-slate-900 group-hover:text-purple-700">Add Contact</div>
                <div className="text-sm text-slate-600 mt-1">Save a new business contact</div>
              </div>
              <ArrowRight className="h-5 w-5 text-purple-600 group-hover:translate-x-1 transition-transform" />
            </Link>
          </CardContent>
        </Card>

        <Card className="border-2 border-slate-300 shadow-xl overflow-hidden bg-gradient-to-br from-white to-slate-50">
          <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
                <MessageSquare className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl text-white font-bold">Recent Activity</CardTitle>
                <CardDescription className="text-indigo-100 mt-1 font-medium">Your latest updates and changes</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8 bg-white">
            <div className="flex flex-col items-center justify-center text-center py-12">
              <div className="relative mb-6">
                <div className="h-20 w-20 rounded-full bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 flex items-center justify-center shadow-lg">
                  <MessageSquare className="h-10 w-10 text-indigo-500" />
                </div>
                <div className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 border-3 border-white shadow-lg animate-pulse" />
              </div>
              <p className="text-lg font-bold text-slate-700 mb-2">Activity feed coming soon...</p>
              <p className="text-sm text-slate-500">Track your recent actions here</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
