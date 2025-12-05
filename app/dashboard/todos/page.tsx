'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Trash2, Edit, Check, X, ChevronDown, User, Building, ChevronUp, Tag, Filter, Bell } from 'lucide-react'
import { format } from 'date-fns'
import { RECURRING_PATTERNS, getRecurringPatternLabel, type RecurringPattern } from '@/lib/recurring-dates'

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
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null)
  const [filters, setFilters] = useState({
    assignedTo: 'all',
    tag: 'all',
    search: '',
  })
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    due_date: '',
    reminder_date: '',
    is_recurring: false,
    recurring_pattern: 'daily',
    assigned_to: '',
    tags: [] as string[],
  })
  const [tagInput, setTagInput] = useState('')
  const [showTagSuggestions, setShowTagSuggestions] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [showCompletionGif, setShowCompletionGif] = useState(false)
  const [showUnassignedConfirm, setShowUnassignedConfirm] = useState(false)
  const [pendingSubmit, setPendingSubmit] = useState<(() => void) | null>(null)
  const [unassignedColor, setUnassignedColor] = useState('#9ca3af')
  const supabase = createClient()

  useEffect(() => {
    loadCurrentUser()
    loadProfiles()
    loadTodos()
    const unsubscribeTodos = subscribeToTodos()
    loadUnassignedColor()
    const unsubscribeSettings = subscribeToSettings()
    
    return () => {
      if (unsubscribeTodos) unsubscribeTodos()
      if (unsubscribeSettings) unsubscribeSettings()
    }
  }, [supabase])

  const loadCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      setCurrentUserId(user.id)
    }
  }

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

  const loadUnassignedColor = async () => {
    const { data, error } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'unassigned_todo_color')
      .single()

    if (!error && data) {
      setUnassignedColor(data.value || '#9ca3af')
    }
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

  const subscribeToSettings = () => {
    const channel = supabase
      .channel('settings-changes')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'app_settings',
          filter: 'key=eq.unassigned_todo_color'
        },
        () => {
          loadUnassignedColor()
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

    // Check if todo is unassigned and show confirmation
    if (!formData.assigned_to) {
      setShowUnassignedConfirm(true)
      setPendingSubmit(() => () => {
        performSubmit(user.id)
      })
      return
    }

    performSubmit(user.id)
  }

  const performSubmit = async (userId: string) => {
    setShowUnassignedConfirm(false)
    setPendingSubmit(null)

    // Tags are already an array
    const tagsArray = formData.tags.filter((tag) => tag.trim().length > 0)

    // Convert datetime-local to ISO string for reminder_date
    let reminderDateISO = null
    if (formData.reminder_date) {
      const [datePart, timePart] = formData.reminder_date.split('T')
      const [year, month, day] = datePart.split('-').map(Number)
      const [hours, minutes] = timePart.split(':').map(Number)
      const localDate = new Date(year, month - 1, day, hours, minutes)
      reminderDateISO = localDate.toISOString()
    }

    // Convert due_date to ISO string
    let dueDateISO = null
    if (formData.due_date) {
      const [datePart, timePart] = formData.due_date.split('T')
      const [year, month, day] = datePart.split('-').map(Number)
      const [hours, minutes] = timePart.split(':').map(Number)
      dueDateISO = new Date(year, month - 1, day, hours, minutes).toISOString()
    }

    // Calculate sort_order - use existing value if editing, otherwise get max + 1
    let sortOrder = editingTodo ? editingTodo.sort_order : null
    if (!sortOrder) {
      const { data: maxTodo } = await supabase
        .from('todos')
        .select('sort_order')
        .order('sort_order', { ascending: false })
        .limit(1)
        .single()
      
      sortOrder = maxTodo?.sort_order ? maxTodo.sort_order + 1 : 1
    }

    const todoData = {
      title: formData.title,
      description: formData.description || null,
      user_id: userId,
      due_date: dueDateISO,
      reminder_date: reminderDateISO,
      assigned_to: formData.assigned_to || null,
      is_recurring: formData.is_recurring,
      recurring_pattern: formData.is_recurring ? formData.recurring_pattern : null,
      is_company_task: true, // Always true - all todos are company todos
      tags: tagsArray.length > 0 ? tagsArray : null,
      color: null, // Don't store color - always use assigned user's color
      sort_order: sortOrder,
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
      const { data: existingReminder, error: checkError } = await supabase
        .from('reminders')
        .select('id')
        .eq('todo_id', todoId)
        .maybeSingle()

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "not found" which is OK
        console.error('Error checking for existing reminder:', checkError)
      }

      // Set reminder user_id to assigned user, or creator if unassigned
      // The RLS policy will allow this if the user created the todo or is assigned to it
      const reminderUserId = formData.assigned_to || userId
      const reminderData = {
        title: formData.title,
        description: formData.description || null,
        reminder_date: reminderDateISO,
        user_id: reminderUserId, // This will be the assigned user or creator
        todo_id: todoId,
        is_recurring: formData.is_recurring,
        recurring_pattern: formData.is_recurring ? formData.recurring_pattern : null,
      }

      if (existingReminder) {
        // Update existing reminder
        const { error: updateError } = await supabase
          .from('reminders')
          .update(reminderData)
          .eq('id', existingReminder.id)

        if (updateError) {
          console.error('Error updating reminder:', updateError)
        } else {
          console.log('Reminder updated successfully')
        }
      } else {
        // Create new reminder
        const { data: newReminder, error: insertError } = await supabase
          .from('reminders')
          .insert([reminderData])
          .select()
          .single()

        if (insertError) {
          console.error('Error creating reminder:', insertError)
        } else {
          console.log('Reminder created successfully:', newReminder)
        }
      }
    } else if (todoId && editingTodo && !reminderDateISO) {
      // If reminder_date is removed, delete the associated reminder
      const { error: deleteError } = await supabase
        .from('reminders')
        .delete()
        .eq('todo_id', todoId)

      if (deleteError) {
        console.error('Error deleting reminder:', deleteError)
      }
    }

    resetForm()
    loadTodos()
  }

  const handleToggleComplete = async (todo: Todo) => {
    const wasIncomplete = !todo.completed
    
    const { error } = await supabase
      .from('todos')
      .update({ completed: !todo.completed })
      .eq('id', todo.id)

    if (error) {
      console.error('Error updating todo:', error)
      return
    }

    // Show GIF if task was just completed (going from incomplete to complete)
    if (wasIncomplete) {
      setShowCompletionGif(true)
      // Hide the GIF after animation completes
      setTimeout(() => {
        setShowCompletionGif(false)
      }, 5000) // 5 seconds
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
      assigned_to: todo.assigned_to || '',
      tags: todo.tags || [],
    })
    setTagInput('')
    setShowTagSuggestions(false)
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
      assigned_to: '',
      tags: [],
    })
    setEditingTodo(null)
    setShowForm(false)
    setTagInput('')
    setShowTagSuggestions(false)
  }

  // Filter todos based on filters
  const getFilteredTodos = (todoList: Todo[]) => {
    return todoList.filter((todo) => {
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

  // Filter tags based on input for autocomplete
  const filteredTags = tagInput.trim()
    ? allTags.filter(tag => 
        tag.toLowerCase().includes(tagInput.toLowerCase()) &&
        !formData.tags.includes(tag)
      )
    : allTags.filter(tag => !formData.tags.includes(tag))

  const handleAddTag = (tag: string) => {
    const trimmedTag = tag.trim()
    if (trimmedTag && !formData.tags.includes(trimmedTag)) {
      setFormData({ ...formData, tags: [...formData.tags, trimmedTag] })
      setTagInput('')
      setShowTagSuggestions(false)
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData({ ...formData, tags: formData.tags.filter(tag => tag !== tagToRemove) })
  }

  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault()
      handleAddTag(tagInput)
    } else if (e.key === 'Backspace' && !tagInput && formData.tags.length > 0) {
      // Remove last tag if input is empty and backspace is pressed
      handleRemoveTag(formData.tags[formData.tags.length - 1])
    }
  }

  const getUserColor = (userId: string, assignedTo: string | null) => {
    // If assigned, use assigned user's color
    if (assignedTo) {
      return profiles[assignedTo]?.user_color || '#3b82f6'
    }
    // If unassigned, use the unassigned color from settings
    return unassignedColor
  }

  const getUserName = (userId: string) => {
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
    <>
      {/* Completion GIF Overlay */}
      {showCompletionGif && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center"
          onClick={() => setShowCompletionGif(false)}
          style={{ 
            pointerEvents: 'auto',
            backgroundColor: 'rgba(0, 0, 0, 0.5)'
          }}
        >
          <div className="relative bg-white rounded-lg p-6 shadow-2xl border-2 border-gray-300">
            <div className="text-center mb-3">
              <p className="text-lg font-semibold text-gray-900">Who completed a todo?</p>
            </div>
            <div className="flex justify-center">
              <img 
                src="/task-complete.gif" 
                alt="Task completed!" 
                className="rounded"
                style={{ 
                  width: '165px',
                  height: '231px',
                  animation: 'none'
                }}
              />
            </div>
          </div>
        </div>
      )}
      
    <div className="space-y-6">
      {/* Unassigned Todo Confirmation Dialog */}
      {showUnassignedConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
          onClick={() => {
            setShowUnassignedConfirm(false)
            setPendingSubmit(null)
          }}
        >
          <div
            className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Unassigned Todo
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to leave this todo unassigned?
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowUnassignedConfirm(false)
                  setPendingSubmit(null)
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (pendingSubmit) {
                    pendingSubmit()
                  }
                }}
              >
                Yes, Continue
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">To-Do List</h1>
          <p className="text-gray-600 mt-1">Unified list of tasks with tags and colors</p>
        </div>
        <Button onClick={() => {
          setTagInput('')
          setShowTagSuggestions(false)
          setShowForm(true)
        }}>
          <Plus className="h-4 w-4 mr-2" />
          Add Todo
        </Button>
      </div>

      {showForm && !editingTodo && (
        <Card>
          <CardHeader>
            <CardTitle>New Todo</CardTitle>
            <CardDescription>
              Create a new todo item
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
                <p className="text-xs text-gray-500 mt-1">
                  {formData.assigned_to ? `Task will be assigned to ${profiles[formData.assigned_to]?.name || 'selected user'}` : 'Task will be unassigned'}
                </p>
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
                    {RECURRING_PATTERNS.map((pattern) => (
                      <option key={pattern.value} value={pattern.value}>
                        {pattern.label}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tags
                </label>
                <div className="relative">
                  {/* Selected tags */}
                  <div className="flex flex-wrap gap-2 p-2 border border-gray-300 rounded-md min-h-[42px] bg-white">
                    {formData.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                      >
                        <Tag className="h-3 w-3" />
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="ml-1 hover:text-blue-900"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => {
                        setTagInput(e.target.value)
                        setShowTagSuggestions(true)
                      }}
                      onFocus={() => setShowTagSuggestions(true)}
                      onKeyDown={handleTagInputKeyDown}
                      placeholder={formData.tags.length === 0 ? "Type to search or create tags..." : ""}
                      className="flex-1 min-w-[150px] outline-none border-none bg-transparent text-sm"
                    />
                  </div>
                  {/* Suggestions dropdown */}
                  {showTagSuggestions && (filteredTags.length > 0 || tagInput.trim()) && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setShowTagSuggestions(false)}
                      />
                      <div className="absolute z-20 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
                        {filteredTags.slice(0, 10).map((tag) => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => handleAddTag(tag)}
                            className="w-full px-3 py-2 text-left hover:bg-blue-50 text-sm flex items-center gap-2"
                          >
                            <Tag className="h-3 w-3 text-gray-400" />
                            {tag}
                          </button>
                        ))}
                        {tagInput.trim() && !allTags.includes(tagInput.trim()) && !formData.tags.includes(tagInput.trim()) && (
                          <button
                            type="button"
                            onClick={() => handleAddTag(tagInput)}
                            className="w-full px-3 py-2 text-left hover:bg-green-50 text-sm flex items-center gap-2 border-t border-gray-200 text-green-700 font-medium"
                          >
                            <Plus className="h-3 w-3" />
                            Create "{tagInput.trim()}"
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit">Create</Button>
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
              <CardDescription>All tasks in one unified list</CardDescription>
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
            </div>
          </div>
          <div className="space-y-2">
          {activeTodos.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No active todos yet</p>
          ) : (
            activeTodos.map((todo, index) => {
              const userColor = getUserColor(todo.user_id, todo.assigned_to)
              const userName = getUserName(todo.user_id)
              const isEditing = editingTodo?.id === todo.id
              
              return (
                <div key={todo.id} className="space-y-2">
                  <div
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
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: userColor }}
                      />
                      <span className="text-xs font-medium text-gray-600">
                        {todo.assigned_to ? getAssignedUserName(todo.assigned_to) : `Unassigned (Created by ${userName})`}
                      </span>
                      {currentUserId && todo.assigned_to === currentUserId && todo.user_id !== currentUserId && (
                        <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                          Assigned by {getUserName(todo.user_id)}
                        </span>
                      )}
                      {todo.reminder_date && (
                        <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full flex items-center gap-1">
                          <Bell className="h-3 w-3" />
                          Reminder
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
                        <span className="text-blue-600">Recurring: {getRecurringPatternLabel(todo.recurring_pattern)}</span>
                      )}
                    </div>
                  </div>
                  {!isEditing && (
                    <div className="flex gap-2 flex-shrink-0">
                      <button onClick={() => handleEdit(todo)} className="text-blue-600 hover:text-blue-800">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDelete(todo.id)} className="text-red-600 hover:text-red-800">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
                  {isEditing && (
                    <Card className="border-2 border-blue-300">
                      <CardHeader>
                        <CardTitle>Edit Todo</CardTitle>
                        <CardDescription>
                          Update your todo item
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
                            <p className="text-xs text-gray-500 mt-1">
                              {formData.assigned_to ? `Task will be assigned to ${profiles[formData.assigned_to]?.name || 'selected user'}` : 'Task will be unassigned'}
                            </p>
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
                                {RECURRING_PATTERNS.map((pattern) => (
                                  <option key={pattern.value} value={pattern.value}>
                                    {pattern.label}
                                  </option>
                                ))}
                              </select>
                            )}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Tags
                            </label>
                            <div className="relative">
                              {/* Selected tags */}
                              <div className="flex flex-wrap gap-2 p-2 border border-gray-300 rounded-md min-h-[42px] bg-white">
                                {formData.tags.map((tag) => (
                                  <span
                                    key={tag}
                                    className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                                  >
                                    <Tag className="h-3 w-3" />
                                    {tag}
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveTag(tag)}
                                      className="ml-1 hover:text-blue-900"
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  </span>
                                ))}
                                <input
                                  type="text"
                                  value={tagInput}
                                  onChange={(e) => {
                                    setTagInput(e.target.value)
                                    setShowTagSuggestions(true)
                                  }}
                                  onFocus={() => setShowTagSuggestions(true)}
                                  onKeyDown={handleTagInputKeyDown}
                                  placeholder={formData.tags.length === 0 ? "Type to search or create tags..." : ""}
                                  className="flex-1 min-w-[150px] outline-none border-none bg-transparent text-sm"
                                />
                              </div>
                              {/* Suggestions dropdown */}
                              {showTagSuggestions && (filteredTags.length > 0 || tagInput.trim()) && (
                                <>
                                  <div
                                    className="fixed inset-0 z-10"
                                    onClick={() => setShowTagSuggestions(false)}
                                  />
                                  <div className="absolute z-20 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
                                    {filteredTags.slice(0, 10).map((tag) => (
                                      <button
                                        key={tag}
                                        type="button"
                                        onClick={() => handleAddTag(tag)}
                                        className="w-full px-3 py-2 text-left hover:bg-blue-50 text-sm flex items-center gap-2"
                                      >
                                        <Tag className="h-3 w-3 text-gray-400" />
                                        {tag}
                                      </button>
                                    ))}
                                    {tagInput.trim() && !allTags.includes(tagInput.trim()) && !formData.tags.includes(tagInput.trim()) && (
                                      <button
                                        type="button"
                                        onClick={() => handleAddTag(tagInput)}
                                        className="w-full px-3 py-2 text-left hover:bg-green-50 text-sm flex items-center gap-2 border-t border-gray-200 text-green-700 font-medium"
                                      >
                                        <Plus className="h-3 w-3" />
                                        Create "{tagInput.trim()}"
                                      </button>
                                    )}
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button type="submit">Update</Button>
                            <Button type="button" variant="outline" onClick={resetForm}>
                              Cancel
                            </Button>
                          </div>
                        </form>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )
            })
          )}
          </div>
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
              const userColor = getUserColor(todo.user_id, todo.assigned_to)
              const userName = getUserName(todo.user_id)
              
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
                      <span className="text-xs font-medium text-gray-600">
                        {todo.assigned_to ? getAssignedUserName(todo.assigned_to) : `Unassigned (Created by ${userName})`}
                      </span>
                      {currentUserId && todo.assigned_to === currentUserId && todo.user_id !== currentUserId && (
                        <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                          Assigned by {getUserName(todo.user_id)}
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
    </>
  )
}
