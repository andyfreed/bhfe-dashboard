'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Trash2, Edit, Calendar as CalendarIcon } from 'lucide-react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths } from 'date-fns'

interface CalendarEvent {
  id: string
  title: string
  description: string | null
  start_date: string
  end_date: string | null
  all_day: boolean
  color: string
  user_id: string
}

interface Todo {
  id: string
  title: string
  due_date: string | null
  completed: boolean
  assigned_to: string | null
}

interface Reminder {
  id: string
  title: string
  reminder_date: string
  user_id: string
}

interface Profile {
  id: string
  name: string
  user_color: string | null
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [todos, setTodos] = useState<Todo[]>([])
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [profiles, setProfiles] = useState<Record<string, Profile>>({})
  const [unassignedColor, setUnassignedColor] = useState('#9ca3af')
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_date: '',
    end_date: '',
    all_day: false,
    color: '#3b82f6',
  })
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadData()
    subscribeToChanges()
  }, [supabase, currentDate])

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(currentDate)

    // Load profiles to get user colors
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('id, name, user_color')
    
    if (profilesData) {
      const profilesMap: Record<string, Profile> = {}
      profilesData.forEach((profile) => {
        profilesMap[profile.id] = profile
      })
      setProfiles(profilesMap)
    }

    // Load unassigned todo color from settings
    const { data: unassignedColorData } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'unassigned_todo_color')
      .single()
    
    if (unassignedColorData) {
      setUnassignedColor(unassignedColorData.value || '#9ca3af')
    }

    const [eventsResult, todosResult, remindersResult] = await Promise.all([
      supabase
        .from('calendar_events')
        .select('*')
        .gte('start_date', monthStart.toISOString())
        .lte('start_date', monthEnd.toISOString()),
      supabase
        .from('todos')
        .select('id, title, due_date, completed, assigned_to')
        .gte('due_date', monthStart.toISOString())
        .lte('due_date', monthEnd.toISOString())
        .eq('completed', false),
      supabase
        .from('reminders')
        .select('id, title, reminder_date, user_id')
        .gte('reminder_date', monthStart.toISOString())
        .lte('reminder_date', monthEnd.toISOString())
        .eq('is_completed', false),
    ])

    setEvents(eventsResult.data || [])
    setTodos(todosResult.data || [])
    setReminders(remindersResult.data || [])
    setLoading(false)
  }

  const subscribeToChanges = () => {
    const channel = supabase
      .channel('calendar-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'calendar_events' },
        () => loadData()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'todos' },
        () => loadData()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reminders' },
        () => loadData()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        () => loadData()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Convert date strings to ISO timestamps (midnight UTC)
    const startDate = formData.start_date ? new Date(formData.start_date + 'T00:00:00Z').toISOString() : null
    const endDate = (formData.end_date || formData.start_date) ? new Date((formData.end_date || formData.start_date) + 'T00:00:00Z').toISOString() : null

    const eventData = {
      ...formData,
      user_id: user.id,
      start_date: startDate,
      end_date: endDate,
    }

    if (editingEvent) {
      const { error } = await supabase
        .from('calendar_events')
        .update(eventData)
        .eq('id', editingEvent.id)

      if (error) {
        console.error('Error updating event:', error)
        return
      }
    } else {
      const { error } = await supabase
        .from('calendar_events')
        .insert([eventData])

      if (error) {
        console.error('Error creating event:', error)
        return
      }
    }

    resetForm()
    loadData()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return

    const { error } = await supabase
      .from('calendar_events')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting event:', error)
      return
    }

    loadData()
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      start_date: '',
      end_date: '',
      all_day: false,
      color: '#3b82f6',
    })
    setEditingEvent(null)
    setShowForm(false)
    setSelectedDate(null)
  }

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })

  const getEventsForDate = (date: Date) => {
    const eventsForDate = events.filter((event) =>
      isSameDay(new Date(event.start_date), date)
    )
    const todosForDate = todos.filter(
      (todo) => todo.due_date && isSameDay(new Date(todo.due_date), date)
    )
    const remindersForDate = reminders.filter(
      (reminder) => reminder.reminder_date && isSameDay(new Date(reminder.reminder_date), date)
    )

    return { events: eventsForDate, todos: todosForDate, reminders: remindersForDate }
  }

  const getUserColor = (userId: string): string => {
    const profile = profiles[userId]
    return profile?.user_color || '#3b82f6'
  }

  const getTodoColor = (todo: Todo): string => {
    if (todo.assigned_to) {
      return getUserColor(todo.assigned_to)
    }
    // For unassigned todos, use the color from settings
    return unassignedColor
  }

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const firstDayOfWeek = monthStart.getDay()
  const paddingDays = Array.from({ length: firstDayOfWeek }, (_, i) => i)

  if (loading) {
    return <div className="text-center py-12">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Calendar</h1>
          <p className="text-gray-600 mt-1">View and manage your events and tasks</p>
        </div>
        <Button onClick={() => {
          const defaultDate = selectedDate || new Date()
          setFormData({
            ...formData,
            start_date: format(defaultDate, "yyyy-MM-dd"),
          })
          setShowForm(true)
        }}>
          <Plus className="h-4 w-4 mr-2" />
          Add Event
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingEvent ? 'Edit Event' : 'New Event'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.all_day}
                    onChange={(e) => setFormData({ ...formData, all_day: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700">All Day</span>
                </label>
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700">Color:</label>
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="h-8 w-16 rounded border border-gray-300"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit">{editingEvent ? 'Update' : 'Create'}</Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{format(currentDate, 'MMMM yyyy')}</CardTitle>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setCurrentDate(subMonths(currentDate, 1))}>
                Previous
              </Button>
              <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
                Today
              </Button>
              <Button variant="outline" size="sm" onClick={() => setCurrentDate(addMonths(currentDate, 1))}>
                Next
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1">
            {dayNames.map((day) => (
              <div key={day} className="p-2 text-center text-sm font-medium text-gray-700">
                {day}
              </div>
            ))}
            {paddingDays.map((_, index) => (
              <div key={`pad-${index}`} className="p-2"></div>
            ))}
            {daysInMonth.map((day) => {
              const { events: dayEvents, todos: dayTodos, reminders: dayReminders } = getEventsForDate(day)
              const isToday = isSameDay(day, new Date())
              const isSelected = selectedDate && isSameDay(day, selectedDate)
              const totalItems = dayEvents.length + dayTodos.length + dayReminders.length

              return (
                <button
                  key={day.toISOString()}
                  onClick={() => {
                    setSelectedDate(day)
                    const defaultDate = format(day, "yyyy-MM-dd")
                    setFormData({ ...formData, start_date: defaultDate })
                  }}
                  className={`p-2 min-h-[80px] border border-gray-200 rounded hover:bg-gray-50 text-left ${
                    isToday ? 'bg-blue-50 border-blue-300' : ''
                  } ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
                >
                  <div className={`text-sm font-medium mb-1 ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
                    {format(day, 'd')}
                  </div>
                  <div className="space-y-1">
                    {dayEvents.slice(0, 3).map((event) => (
                      <div
                        key={event.id}
                        className="text-xs px-1 py-0.5 rounded truncate"
                        style={{ backgroundColor: event.color, color: 'white' }}
                      >
                        {event.title}
                      </div>
                    ))}
                    {dayTodos.slice(0, Math.max(0, 3 - dayEvents.length)).map((todo) => {
                      const todoColor = getTodoColor(todo)
                      return (
                        <div
                          key={todo.id}
                          className="text-xs px-1 py-0.5 rounded truncate"
                          style={{ backgroundColor: todoColor, color: 'white' }}
                        >
                          {todo.title}
                        </div>
                      )
                    })}
                    {dayReminders.slice(0, Math.max(0, 3 - dayEvents.length - dayTodos.length)).map((reminder) => {
                      const reminderColor = getUserColor(reminder.user_id)
                      return (
                        <div
                          key={reminder.id}
                          className="text-xs px-1 py-0.5 rounded truncate"
                          style={{ backgroundColor: reminderColor, color: 'white' }}
                          title={`Reminder: ${reminder.title}`}
                        >
                          🔔 {reminder.title}
                        </div>
                      )
                    })}
                    {totalItems > 3 && (
                      <div className="text-xs text-gray-500">
                        +{totalItems - 3} more
                      </div>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {selectedDate && (
        <Card>
          <CardHeader>
            <CardTitle>{format(selectedDate, 'EEEE, MMMM d, yyyy')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {getEventsForDate(selectedDate).events.length > 0 && (
              <div>
                <h3 className="font-medium mb-2">Events</h3>
                <div className="space-y-2">
                  {getEventsForDate(selectedDate).events.map((event) => (
                    <div
                      key={event.id}
                      className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                    >
                      <div>
                        <div className="font-medium">{event.title}</div>
                        {event.description && (
                          <div className="text-sm text-gray-600">{event.description}</div>
                        )}
                        <div className="text-xs text-gray-500 mt-1">
                          {format(new Date(event.start_date), 'MMM d, yyyy')}
                          {event.end_date && ` - ${format(new Date(event.end_date), 'MMM d, yyyy')}`}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setEditingEvent(event)
                            setFormData({
                              title: event.title,
                              description: event.description || '',
                              start_date: format(new Date(event.start_date), "yyyy-MM-dd"),
                              end_date: event.end_date ? format(new Date(event.end_date), "yyyy-MM-dd") : '',
                              all_day: event.all_day,
                              color: event.color,
                            })
                            setShowForm(true)
                          }}
                          className="text-blue-600"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDelete(event.id)} className="text-red-600">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {getEventsForDate(selectedDate).todos.length > 0 && (
              <div>
                <h3 className="font-medium mb-2">Tasks</h3>
                <div className="space-y-2">
                  {getEventsForDate(selectedDate).todos.map((todo) => (
                    <div
                      key={todo.id}
                      className="p-3 border rounded-lg border-blue-200 bg-blue-50"
                    >
                      <div className="font-medium">{todo.title}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        Due: {format(new Date(todo.due_date!), 'h:mm a')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {getEventsForDate(selectedDate).reminders.length > 0 && (
              <div>
                <h3 className="font-medium mb-2">Reminders</h3>
                <div className="space-y-2">
                  {getEventsForDate(selectedDate).reminders.map((reminder) => {
                    const reminderColor = getUserColor(reminder.user_id)
                    const profile = profiles[reminder.user_id]
                    return (
                      <div
                        key={reminder.id}
                        className="p-3 border rounded-lg"
                        style={{ borderColor: reminderColor, backgroundColor: `${reminderColor}10` }}
                      >
                        <div className="font-medium flex items-center gap-2">
                          <span style={{ color: reminderColor }}>🔔</span>
                          {reminder.title}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {profile?.name && `By: ${profile.name}`}
                          {' • '}
                          {format(new Date(reminder.reminder_date), 'h:mm a')}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
            {getEventsForDate(selectedDate).events.length === 0 &&
              getEventsForDate(selectedDate).todos.length === 0 &&
              getEventsForDate(selectedDate).reminders.length === 0 && (
                <p className="text-gray-500 text-center py-4">No events, tasks, or reminders for this day</p>
              )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

