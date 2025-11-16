'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckSquare, Calendar, Bell, FolderKanban, Users, FileText, MessageSquare } from 'lucide-react'
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
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Calendar Events',
      value: stats.events,
      icon: Calendar,
      href: '/dashboard/calendar',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Reminders',
      value: stats.reminders,
      icon: Bell,
      href: '/dashboard/reminders',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
    },
    {
      title: 'Projects',
      value: stats.projects,
      icon: FolderKanban,
      href: '/dashboard/projects',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Contacts',
      value: stats.contacts,
      icon: Users,
      href: '/dashboard/contacts',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
    },
    {
      title: 'Notes',
      value: stats.notes,
      icon: FileText,
      href: '/dashboard/notes',
      color: 'text-pink-600',
      bgColor: 'bg-pink-50',
    },
    {
      title: 'Unread Messages',
      value: stats.unreadMessages,
      icon: MessageSquare,
      href: '/dashboard/chat',
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome back! Here's an overview of your business.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {statsCards.map((card) => {
          const Icon = card.icon
          return (
            <Link key={card.title} href={card.href}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    {card.title}
                  </CardTitle>
                  <div className={`${card.bgColor} p-2 rounded-lg`}>
                    <Icon className={`h-5 w-5 ${card.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">{card.value}</div>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks you might want to perform</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/dashboard/todos" className="block p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="font-medium">Create New To-Do</div>
              <div className="text-sm text-gray-600">Add a task to your list</div>
            </Link>
            <Link href="/dashboard/calendar" className="block p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="font-medium">Add Calendar Event</div>
              <div className="text-sm text-gray-600">Schedule something new</div>
            </Link>
            <Link href="/dashboard/contacts" className="block p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="font-medium">Add Contact</div>
              <div className="text-sm text-gray-600">Save a new business contact</div>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your latest updates and changes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-600">
              Activity feed coming soon...
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

