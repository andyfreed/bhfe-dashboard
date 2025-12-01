'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Trash2, Edit, Bell, Check, Users, User } from 'lucide-react'
import { format, addDays, addWeeks, addMonths, addYears } from 'date-fns'

interface Profile {
  id: string
  name: string
  email: string
  user_color: string | null
}

interface Reminder {
  id: string
  title: string
  description: string | null
  reminder_date: string
  is_completed: boolean
  is_recurring: boolean
  recurring_pattern: string | null
  is_super_reminder: boolean
  user_id: string
}

export default function RemindersPage() {
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [profiles, setProfiles] = useState<Record<string, Profile>>({})
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showAllUsers, setShowAllUsers] = useState(false)
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    reminder_date: '',
    is_recurring: false,
    recurring_pattern: 'daily',
    is_super_reminder: false,
  })
  const supabase = createClient()

  useEffect(() => {
    loadProfiles()
    loadReminders()
    subscribeToReminders()
  }, [supabase, showAllUsers])

  const loadProfiles = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')

    if (error) {
      console.error('Error loading profiles:', error)
      return
    }

    const profilesMap: Record<string, Profile> = {}
    data?.forEach((profile) => {
      profilesMap[profile.id] = profile
    })
    setProfiles(profilesMap)
  }

  const loadReminders = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    
    setCurrentUserId(user.id)

    let query = supabase
      .from('reminders')
      .select('*')
      .order('reminder_date', { ascending: true })

    // If toggle is off, only show current user's reminders
    if (!showAllUsers) {
      query = query.eq('user_id', user.id)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error loading reminders:', error)
      return
    }

    setReminders(data || [])
    setLoading(false)
  }

  const subscribeToReminders = () => {
    const channel = supabase
      .channel('reminders-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reminders' },
        () => {
          loadReminders()
        }
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

    // Convert datetime-local value to ISO string (treat as local time)
    // datetime-local gives format "YYYY-MM-DDTHH:mm" in local timezone
    // Note: new Date("YYYY-MM-DDTHH:mm") treats it as UTC, so we need to parse it manually
    let reminderDateISO = formData.reminder_date
    if (formData.reminder_date) {
      // Parse the datetime-local string and create a Date in local timezone
      const [datePart, timePart] = formData.reminder_date.split('T')
      const [year, month, day] = datePart.split('-').map(Number)
      const [hours, minutes] = timePart.split(':').map(Number)
      
      // Create Date object in local timezone
      const localDate = new Date(year, month - 1, day, hours, minutes)
      // Convert to ISO string for database (which stores in UTC)
      reminderDateISO = localDate.toISOString()
    }

    const reminderData = {
      ...formData,
      reminder_date: reminderDateISO,
      user_id: user.id,
    }

    if (editingReminder) {
      const { error } = await supabase
        .from('reminders')
        .update(reminderData)
        .eq('id', editingReminder.id)

      if (error) {
        console.error('Error updating reminder:', error)
        return
      }
    } else {
      const { error } = await supabase
        .from('reminders')
        .insert([reminderData])

      if (error) {
        console.error('Error creating reminder:', error)
        return
      }
    }

    resetForm()
    loadReminders()
  }

  const handleToggleComplete = async (reminder: Reminder) => {
    const newIsCompleted = !reminder.is_completed
    
    const { error } = await supabase
      .from('reminders')
      .update({ is_completed: newIsCompleted })
      .eq('id', reminder.id)

    if (error) {
      console.error('Error updating reminder:', error)
      return
    }

    // If marking as completed and is recurring, create the next instance
    if (newIsCompleted && reminder.is_recurring) {
      let nextDate = new Date(reminder.reminder_date)
      const interval = 1 // Default interval, could be expanded later to support custom intervals

      switch (reminder.recurring_pattern) {
        case 'daily':
          nextDate = addDays(nextDate, interval)
          break
        case 'weekly':
          nextDate = addWeeks(nextDate, interval)
          break
        case 'monthly':
          nextDate = addMonths(nextDate, interval)
          break
        case 'yearly':
          nextDate = addYears(nextDate, interval)
          break
        default:
          nextDate = addDays(nextDate, interval)
      }

      const { error: createError } = await supabase
        .from('reminders')
        .insert([{
          title: reminder.title,
          description: reminder.description,
          reminder_date: nextDate.toISOString(),
          is_recurring: true,
          recurring_pattern: reminder.recurring_pattern,
          is_super_reminder: reminder.is_super_reminder,
          user_id: reminder.user_id,
          is_completed: false
        }])

      if (createError) {
        console.error('Error creating next recurring reminder:', createError)
      }
    }

    loadReminders()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this reminder?')) return

    const { error } = await supabase
      .from('reminders')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting reminder:', error)
      return
    }

    loadReminders()
  }

  const handleEdit = (reminder: Reminder) => {
    setEditingReminder(reminder)
    setFormData({
      title: reminder.title,
      description: reminder.description || '',
      reminder_date: format(new Date(reminder.reminder_date), "yyyy-MM-dd'T'HH:mm"),
      is_recurring: reminder.is_recurring,
      recurring_pattern: reminder.recurring_pattern || 'daily',
      is_super_reminder: reminder.is_super_reminder || false,
    })
    setShowForm(true)
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      reminder_date: '',
      is_recurring: false,
      recurring_pattern: 'daily',
      is_super_reminder: false,
    })
    setEditingReminder(null)
    setShowForm(false)
  }

  const upcomingReminders = reminders.filter((r) => !r.is_completed)
  const pastReminders = reminders.filter((r) => r.is_completed)

  if (loading) {
    return <div className="text-center py-12">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reminders</h1>
          <p className="text-gray-600 mt-1">Set and manage your reminders</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showAllUsers}
              onChange={(e) => setShowAllUsers(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <Users className="h-4 w-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Show all users</span>
          </label>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Reminder
          </Button>
        </div>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingReminder ? 'Edit Reminder' : 'New Reminder'}</CardTitle>
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reminder Date *
                </label>
                <input
                  type="datetime-local"
                  value={formData.reminder_date}
                  onChange={(e) => setFormData({ ...formData, reminder_date: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_recurring}
                    onChange={(e) => setFormData({ ...formData, is_recurring: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700">Recurring</span>
                </label>
                {formData.is_recurring && (
                  <select
                    value={formData.recurring_pattern}
                    onChange={(e) => setFormData({ ...formData, recurring_pattern: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                )}
              </div>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_super_reminder}
                    onChange={(e) => setFormData({ ...formData, is_super_reminder: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700 font-medium">Super Reminder</span>
                </label>
              </div>
              <div className="flex gap-2">
                <Button type="submit">{editingReminder ? 'Update' : 'Create'}</Button>
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
          <CardTitle>Upcoming Reminders</CardTitle>
          <CardDescription>
            {showAllUsers ? "All users' active reminders" : "Your active reminders"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {upcomingReminders.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No upcoming reminders</p>
          ) : (
            upcomingReminders.map((reminder) => {
              const isOverdue = new Date(reminder.reminder_date) < new Date()
              const reminderOwner = profiles[reminder.user_id]
              const isOwnReminder = currentUserId === reminder.user_id
              
              return (
                <div
                  key={reminder.id}
                  className={`flex items-start gap-3 p-4 border rounded-lg ${
                    isOverdue ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <button
                    onClick={() => handleToggleComplete(reminder)}
                    disabled={!isOwnReminder}
                    className={`mt-1 h-5 w-5 rounded border-2 border-gray-300 flex items-center justify-center ${
                      isOwnReminder ? 'hover:border-blue-500 cursor-pointer' : 'cursor-not-allowed opacity-50'
                    }`}
                  >
                    <Check className="h-3 w-3 text-white" />
                  </button>
                  <div className="flex-1">
                    <div className="font-medium flex items-center gap-2 flex-wrap">
                      <Bell className="h-4 w-4 text-yellow-600" />
                      {reminder.title}
                      {showAllUsers && reminderOwner && (
                        <span className="text-xs px-2 py-0.5 rounded-full flex items-center gap-1"
                          style={{ 
                            backgroundColor: `${reminderOwner.user_color || '#3b82f6'}20`,
                            color: reminderOwner.user_color || '#3b82f6'
                          }}
                        >
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: reminderOwner.user_color || '#3b82f6' }}
                          />
                          {reminderOwner.name}
                          {!isOwnReminder && <span className="text-gray-500">(Other)</span>}
                        </span>
                      )}
                      {isOverdue && (
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">
                          Overdue
                        </span>
                      )}
                    </div>
                    {reminder.description && (
                      <div className="text-sm text-gray-600 mt-1">{reminder.description}</div>
                    )}
                    <div className="text-xs text-gray-500 mt-2">
                      {format(new Date(reminder.reminder_date), 'MMM d, yyyy h:mm a')}
                      {reminder.is_recurring && (
                        <span className="ml-2 text-blue-600">
                          (Recurring: {reminder.recurring_pattern})
                        </span>
                      )}
                    </div>
                  </div>
                  {isOwnReminder && (
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(reminder)} className="text-blue-600">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDelete(reminder.id)} className="text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </CardContent>
      </Card>

      {pastReminders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Completed Reminders</CardTitle>
            <CardDescription>
              {showAllUsers ? "All users' completed reminders" : "Your completed reminders"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {pastReminders.map((reminder) => {
              const reminderOwner = profiles[reminder.user_id]
              const isOwnReminder = currentUserId === reminder.user_id
              
              return (
                <div
                  key={reminder.id}
                  className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg bg-gray-50 opacity-75"
                >
                  <div className="mt-1 h-5 w-5 rounded bg-green-500 border-green-500 flex items-center justify-center">
                    <Check className="h-3 w-3 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium line-through flex items-center gap-2 flex-wrap">
                      {reminder.title}
                      {showAllUsers && reminderOwner && (
                        <span className="text-xs px-2 py-0.5 rounded-full flex items-center gap-1"
                          style={{ 
                            backgroundColor: `${reminderOwner.user_color || '#3b82f6'}20`,
                            color: reminderOwner.user_color || '#3b82f6'
                          }}
                        >
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: reminderOwner.user_color || '#3b82f6' }}
                          />
                          {reminderOwner.name}
                          {!isOwnReminder && <span className="text-gray-500">(Other)</span>}
                        </span>
                      )}
                    </div>
                    {reminder.description && (
                      <div className="text-sm text-gray-600">{reminder.description}</div>
                    )}
                  </div>
                  {isOwnReminder && (
                    <button onClick={() => handleDelete(reminder.id)} className="text-red-600">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
              </div>
              )
            })}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

