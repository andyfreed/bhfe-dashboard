'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Trash2, Edit, Check, X, ChevronDown, User, Building, ChevronUp, Tag, Filter, Bell } from 'lucide-react'
import { format } from 'date-fns'

interface Profile {
  id: string
  name: string
  email: string
  user_color: string | null
}

interface Todo {
  id: string
  title: string
  description: string | null
  completed: boolean
  due_date: string | null
  reminder_date: string | null
  is_recurring: boolean
  recurring_pattern: string | null
  is_company_task: boolean
  user_id: string
  assigned_to: string | null
  tags: string[] | null
  color: string | null
  sort_order: number | null
  created_at: string
}

export default function TodosPage() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [profiles, setProfiles] = useState<Record<string, Profile>>({})
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null)
  const [filters, setFilters] = useState({
    user: 'all',
    assignedTo: 'all',
    tag: 'all',
    type: 'all', // 'all', 'personal', 'company'
    search: '',
  })
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    due_date: '',
    reminder_date: '',
    is_recurring: false,
    recurring_pattern: 'daily',
    is_company_task: false,
    assigned_to: '',
    tags: '',
    color: '#3b82f6',
  })
  const supabase = createClient()

  useEffect(() => {
    loadProfiles()
    loadTodos()
    subscribeToTodos()
  }, [supabase])

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

  const loadTodos = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('todos')
      .select('*')
      .order('sort_order', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error loading todos:', error)
      return
    }

    setTodos(data || [])
    setLoading(false)
  }

  const subscribeToTodos = () => {
    const channel = supabase
      .channel('todos-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'todos' },
        () => {
          loadTodos()
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

    // Parse tags from comma-separated string
    const tagsArray = formData.tags
      .split(',')
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0)

    // Get user color - use profile color for personal tasks, form color for company tasks
    const userColor = formData.is_company_task 
      ? formData.color 
      : (profiles[user.id]?.user_color || '#3b82f6')

    // Convert datetime-local to ISO string for reminder_date
    let reminderDateISO = null
    if (formData.reminder_date) {
      const [datePart, timePart] = formData.reminder_date.split('T')
      const [year, month, day] = datePart.split('-').map(Number)
      const [hours, minutes] = timePart.split(':').map(Number)
      const localDate = new Date(year, month - 1, day, hours, minutes)
      reminderDateISO = localDate.toISOString()
    }

    const todoData = {
      title: formData.title,
      description: formData.description || null,
      user_id: user.id,
      due_date: formData.due_date ? (() => {
        const [datePart, timePart] = formData.due_date.split('T')
        const [year, month, day] = datePart.split('-').map(Number)
        const [hours, minutes] = timePart.split(':').map(Number)
        return new Date(year, month - 1, day, hours, minutes).toISOString()
      })() : null,
      reminder_date: reminderDateISO,
      assigned_to: formData.assigned_to || null,
      is_recurring: formData.is_recurring,
      recurring_pattern: formData.is_recurring ? formData.recurring_pattern : null,
      is_company_task: formData.is_company_task,
      tags: tagsArray.length > 0 ? tagsArray : null,
      color: userColor,
      sort_order: editingTodo ? editingTodo.sort_order : Date.now(),
    }

    let todoId: string | null = null

    if (editingTodo) {
      const { data, error } = await supabase
        .from('todos')
        .update(todoData)
        .eq('id', editingTodo.id)
        .select()
        .single()

      if (error) {
        console.error('Error updating todo:', error)
        return
      }
      todoId = data.id
    } else {
      const { data, error } = await supabase
        .from('todos')
        .insert([todoData])
        .select()
        .single()

      if (error) {
        console.error('Error creating todo:', error)
        return
      }
      todoId = data.id
    }

    // Create or update reminder if reminder_date is set
    if (reminderDateISO && todoId) {
      // Check if reminder already exists for this todo
      const { data: existingReminder } = await supabase
        .from('reminders')
        .select('id')
        .eq('todo_id', todoId)
        .single()

      const reminderData = {
        title: formData.title,
        description: formData.description,
        reminder_date: reminderDateISO,
        user_id: formData.assigned_to || user.id, // Assign to assigned user or creator
        todo_id: todoId,
        is_recurring: formData.is_recurring,
        recurring_pattern: formData.is_recurring ? formData.recurring_pattern : null,
      }

      if (existingReminder) {
        // Update existing reminder
        await supabase
          .from('reminders')
          .update(reminderData)
          .eq('id', existingReminder.id)
      } else {
        // Create new reminder
        await supabase
          .from('reminders')
          .insert([reminderData])
      }
    } else if (todoId && editingTodo) {
      // If reminder_date is removed, delete the associated reminder
      await supabase
        .from('reminders')
        .delete()
        .eq('todo_id', todoId)
    }

    resetForm()
    loadTodos()
  }

  const handleToggleComplete = async (todo: Todo) => {
    const { error } = await supabase
      .from('todos')
      .update({ completed: !todo.completed })
      .eq('id', todo.id)

    if (error) {
      console.error('Error updating todo:', error)
      return
    }

    loadTodos()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this todo?')) return

    const { error } = await supabase
      .from('todos')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting todo:', error)
      return
    }

    loadTodos()
  }

  const handleEdit = (todo: Todo) => {
    setEditingTodo(todo)
    setFormData({
      title: todo.title,
      description: todo.description || '',
      due_date: todo.due_date ? format(new Date(todo.due_date), "yyyy-MM-dd'T'HH:mm") : '',
      reminder_date: todo.reminder_date ? format(new Date(todo.reminder_date), "yyyy-MM-dd'T'HH:mm") : '',
      is_recurring: todo.is_recurring,
      recurring_pattern: todo.recurring_pattern || 'daily',
      is_company_task: todo.is_company_task,
      assigned_to: todo.assigned_to || '',
      tags: todo.tags?.join(', ') || '',
      color: todo.color || '#3b82f6',
    })
    setShowForm(true)
  }

  const handleMoveTodo = async (todo: Todo, direction: 'up' | 'down') => {
    const currentIndex = todos.findIndex((t) => t.id === todo.id)
    if (currentIndex === -1) return

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    if (targetIndex < 0 || targetIndex >= todos.length) return

    const targetTodo = todos[targetIndex]
    const newSortOrder = targetTodo.sort_order || Date.now()
    const currentSortOrder = todo.sort_order || Date.now()

    // Swap sort orders
    await supabase
      .from('todos')
      .update({ sort_order: newSortOrder })
      .eq('id', todo.id)

    await supabase
      .from('todos')
      .update({ sort_order: currentSortOrder })
      .eq('id', targetTodo.id)

    loadTodos()
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      due_date: '',
      reminder_date: '',
      is_recurring: false,
      recurring_pattern: 'daily',
      is_company_task: false,
      assigned_to: '',
      tags: '',
      color: '#3b82f6',
    })
    setEditingTodo(null)
    setShowForm(false)
    setShowDropdown(false)
  }

  // Filter todos based on filters
  const getFilteredTodos = (todoList: Todo[]) => {
    return todoList.filter((todo) => {
      // User filter
      if (filters.user !== 'all' && todo.user_id !== filters.user) {
        return false
      }

      // Assigned to filter
      if (filters.assignedTo !== 'all') {
        if (filters.assignedTo === 'unassigned' && todo.assigned_to) {
          return false
        }
        if (filters.assignedTo !== 'unassigned' && todo.assigned_to !== filters.assignedTo) {
          return false
        }
      }

      // Tag filter
      if (filters.tag !== 'all') {
        if (!todo.tags || !todo.tags.includes(filters.tag)) {
          return false
        }
      }

      // Type filter
      if (filters.type === 'personal' && todo.is_company_task) {
        return false
      }
      if (filters.type === 'company' && !todo.is_company_task) {
        return false
      }

      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        const matchesTitle = todo.title.toLowerCase().includes(searchLower)
        const matchesDescription = todo.description?.toLowerCase().includes(searchLower) || false
        const matchesTags = todo.tags?.some(tag => tag.toLowerCase().includes(searchLower)) || false
        if (!matchesTitle && !matchesDescription && !matchesTags) {
          return false
        }
      }

      return true
    })
  }

  const activeTodos = getFilteredTodos(todos.filter((t) => !t.completed))
  const completedTodos = getFilteredTodos(todos.filter((t) => t.completed))

  // Get all unique tags from todos
  const allTags = Array.from(
    new Set(
      todos
        .flatMap((todo) => todo.tags || [])
        .filter((tag) => tag.length > 0)
    )
  ).sort()

  const getUserColor = (userId: string, isCompanyTask: boolean, todoColor: string | null) => {
    if (isCompanyTask) {
      return todoColor || '#9333ea' // Purple for company tasks
    }
    return profiles[userId]?.user_color || todoColor || '#3b82f6'
  }

  const getUserName = (userId: string, isCompanyTask: boolean) => {
    if (isCompanyTask) return 'Company'
    return profiles[userId]?.name || 'Unknown'
  }

  const getAssignedUserName = (assignedTo: string | null) => {
    if (!assignedTo) return null
    return profiles[assignedTo]?.name || 'Unknown'
  }

  if (loading) {
    return <div className="text-center py-12">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">To-Do List</h1>
          <p className="text-gray-600 mt-1">Unified list of personal and company tasks with tags and colors</p>
        </div>
        <div className="relative">
          <Button onClick={() => setShowDropdown(!showDropdown)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Todo
            <ChevronDown className="h-4 w-4 ml-2" />
          </Button>
          {showDropdown && (
            <>
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setShowDropdown(false)}
              />
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
                <div className="py-1">
                  <button
                    onClick={async () => {
                      const { data: { user } } = await supabase.auth.getUser()
                      const userColor = user ? (profiles[user.id]?.user_color || '#3b82f6') : '#3b82f6'
                      setFormData({ 
                        ...formData, 
                        is_company_task: false,
                        color: userColor
                      })
                      setShowDropdown(false)
                      setShowForm(true)
                    }}
                    className="w-full px-4 py-3 text-left hover:bg-gray-100 flex items-center gap-3 transition-colors"
                  >
                    <User className="h-5 w-5 text-blue-600" />
                    <div>
                      <div className="font-medium text-gray-900">Personal Todo</div>
                      <div className="text-sm text-gray-500">Create a personal task</div>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      setFormData({ 
                        ...formData, 
                        is_company_task: true,
                        color: '#9333ea' // Default purple for company tasks
                      })
                      setShowDropdown(false)
                      setShowForm(true)
                    }}
                    className="w-full px-4 py-3 text-left hover:bg-gray-100 flex items-center gap-3 transition-colors border-t border-gray-200"
                  >
                    <Building className="h-5 w-5 text-purple-600" />
                    <div>
                      <div className="font-medium text-gray-900">Company Todo</div>
                      <div className="text-sm text-gray-500">Create a company task</div>
                    </div>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingTodo ? 'Edit Todo' : 'New Todo'}</CardTitle>
            <CardDescription>
              {editingTodo ? 'Update your todo item' : 'Create a new todo item'}
            </CardDescription>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Due Date
                </label>
                <input
                  type="datetime-local"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Bell className="h-4 w-4 inline mr-1" />
                    Reminder Date (creates reminder)
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.reminder_date}
                    onChange={(e) => setFormData({ ...formData, reminder_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assign To
                </label>
                <select
                  value={formData.assigned_to}
                  onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">Unassigned</option>
                  {Object.values(profiles).map((profile) => (
                    <option key={profile.id} value={profile.id}>
                      {profile.name}
                    </option>
                  ))}
                </select>
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="tag1, tag2, tag3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              {formData.is_company_task && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Color
                  </label>
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-full h-10 border border-gray-300 rounded-md cursor-pointer"
                  />
                </div>
              )}
              <div className="flex gap-2">
                <Button type="submit">{editingTodo ? 'Update' : 'Create'}</Button>
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
              <CardTitle>All Todos</CardTitle>
              <CardDescription>Personal and company tasks in one unified list</CardDescription>
            </div>
          </div>
          </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="mb-4 p-4 bg-gray-50 rounded-lg space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <Filter className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Filters</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Search</label>
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  placeholder="Search todos..."
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Created By</label>
                <select
                  value={filters.user}
                  onChange={(e) => setFilters({ ...filters, user: e.target.value })}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md"
                >
                  <option value="all">All Users</option>
                  {Object.values(profiles).map((profile) => (
                    <option key={profile.id} value={profile.id}>
                      {profile.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Assigned To</label>
                <select
                  value={filters.assignedTo}
                  onChange={(e) => setFilters({ ...filters, assignedTo: e.target.value })}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md"
                >
                  <option value="all">All</option>
                  <option value="unassigned">Unassigned</option>
                  {Object.values(profiles).map((profile) => (
                    <option key={profile.id} value={profile.id}>
                      {profile.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Tag</label>
                <select
                  value={filters.tag}
                  onChange={(e) => setFilters({ ...filters, tag: e.target.value })}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md"
                >
                  <option value="all">All Tags</option>
                  {allTags.map((tag) => (
                    <option key={tag} value={tag}>
                      {tag}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={filters.type}
                  onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md"
                >
                  <option value="all">All</option>
                  <option value="personal">Personal</option>
                  <option value="company">Company</option>
                </select>
              </div>
            </div>
          </div>
          <div className="space-y-2">
          {activeTodos.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No active todos yet</p>
          ) : (
            activeTodos.map((todo, index) => {
              const userColor = getUserColor(todo.user_id, todo.is_company_task, todo.color)
              const userName = getUserName(todo.user_id, todo.is_company_task)
              
              return (
                <div
                  key={todo.id}
                  className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  style={{ borderLeftColor: userColor, borderLeftWidth: '4px' }}
                >
                  <div className="flex flex-col gap-1 mt-1">
                  <button
                      onClick={() => handleMoveTodo(todo, 'up')}
                      disabled={index === 0}
                      className={`h-4 w-4 flex items-center justify-center ${
                        index === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <ChevronUp className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleMoveTodo(todo, 'down')}
                      disabled={index === activeTodos.length - 1}
                      className={`h-4 w-4 flex items-center justify-center ${
                        index === activeTodos.length - 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </button>
                  </div>
                  <button
                    onClick={() => handleToggleComplete(todo)}
                    className={`mt-1 h-5 w-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                      todo.completed ? 'bg-green-500 border-green-500' : 'border-gray-300'
                    }`}
                  >
                    {todo.completed && <Check className="h-3 w-3 text-white" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: userColor }}
                      />
                      <span className="text-xs font-medium text-gray-600">{userName}</span>
                      {todo.is_company_task && (
                        <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">
                          Company
                        </span>
                      )}
                    </div>
                    <div className="font-medium">{todo.title}</div>
                    {todo.description && (
                      <div className="text-sm text-gray-600 mt-1">{todo.description}</div>
                    )}
                    {todo.tags && todo.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {todo.tags.map((tag, tagIndex) => (
                          <span
                            key={tagIndex}
                            className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full"
                          >
                            <Tag className="h-3 w-3" />
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500">
                      {todo.due_date && (
                        <span>Due: {format(new Date(todo.due_date), 'MMM d, yyyy h:mm a')}</span>
                      )}
                      {todo.reminder_date && (
                        <span className="text-orange-600">Reminder: {format(new Date(todo.reminder_date), 'MMM d, yyyy h:mm a')}</span>
                    )}
                    {todo.is_recurring && (
                        <span className="text-blue-600">Recurring: {todo.recurring_pattern}</span>
                      )}
                      </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={() => handleEdit(todo)} className="text-blue-600 hover:text-blue-800">
                      <Edit className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDelete(todo.id)} className="text-red-600 hover:text-red-800">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )
            })
            )}
          </CardContent>
        </Card>

      {completedTodos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Completed</CardTitle>
            <CardDescription>Finished tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {completedTodos.map((todo) => {
              const userColor = getUserColor(todo.user_id, todo.is_company_task, todo.color)
              const userName = getUserName(todo.user_id, todo.is_company_task)
              
              return (
              <div
                key={todo.id}
                className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg bg-gray-50 opacity-75"
                  style={{ borderLeftColor: userColor, borderLeftWidth: '4px' }}
              >
                  <div className="mt-1 h-5 w-5 rounded bg-green-500 border-green-500 flex items-center justify-center flex-shrink-0">
                  <Check className="h-3 w-3 text-white" />
                </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: userColor }}
                      />
                      <span className="text-xs font-medium text-gray-600">By: {userName}</span>
                      {todo.assigned_to && (
                        <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                          → {getAssignedUserName(todo.assigned_to)}
                        </span>
                      )}
                      {todo.is_company_task && (
                        <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">
                          Company
                        </span>
                      )}
                      {todo.reminder_date && (
                        <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full flex items-center gap-1">
                          <Bell className="h-3 w-3" />
                          Reminder
                        </span>
                      )}
                    </div>
                  <div className="font-medium line-through">{todo.title}</div>
                  {todo.description && (
                      <div className="text-sm text-gray-600 mt-1">{todo.description}</div>
                    )}
                    {todo.tags && todo.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {todo.tags.map((tag, tagIndex) => (
                          <span
                            key={tagIndex}
                            className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full"
                          >
                            <Tag className="h-3 w-3" />
                            {tag}
                          </span>
                        ))}
                      </div>
                  )}
                </div>
                  <button onClick={() => handleDelete(todo.id)} className="text-red-600 hover:text-red-800 flex-shrink-0">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              )
            })}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

