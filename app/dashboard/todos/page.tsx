'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Trash2, Edit, Check, X, ChevronDown, User, Building } from 'lucide-react'
import { format } from 'date-fns'

interface Todo {
  id: string
  title: string
  description: string | null
  completed: boolean
  due_date: string | null
  is_recurring: boolean
  recurring_pattern: string | null
  is_company_task: boolean
  user_id: string
  created_at: string
}

export default function TodosPage() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    due_date: '',
    is_recurring: false,
    recurring_pattern: 'daily',
    is_company_task: false,
  })
  const supabase = createClient()

  useEffect(() => {
    loadTodos()
    subscribeToTodos()
  }, [supabase])

  const loadTodos = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('todos')
      .select('*')
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

    const todoData = {
      ...formData,
      user_id: user.id,
      due_date: formData.due_date || null,
    }

    if (editingTodo) {
      const { error } = await supabase
        .from('todos')
        .update(todoData)
        .eq('id', editingTodo.id)

      if (error) {
        console.error('Error updating todo:', error)
        return
      }
    } else {
      const { error } = await supabase
        .from('todos')
        .insert([todoData])

      if (error) {
        console.error('Error creating todo:', error)
        return
      }
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
      is_recurring: todo.is_recurring,
      recurring_pattern: todo.recurring_pattern || 'daily',
      is_company_task: todo.is_company_task,
    })
    setShowForm(true)
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      due_date: '',
      is_recurring: false,
      recurring_pattern: 'daily',
      is_company_task: false,
    })
    setEditingTodo(null)
    setShowForm(false)
    setShowDropdown(false)
  }

  const personalTodos = todos.filter((t) => !t.is_company_task && !t.completed)
  const companyTodos = todos.filter((t) => t.is_company_task && !t.completed)
  const completedTodos = todos.filter((t) => t.completed)

  if (loading) {
    return <div className="text-center py-12">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">To-Do Lists</h1>
          <p className="text-gray-600 mt-1">Manage your personal and company tasks</p>
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
                    onClick={() => {
                      setFormData({ ...formData, is_company_task: false })
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
                      setFormData({ ...formData, is_company_task: true })
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Personal Todos</CardTitle>
            <CardDescription>Your personal tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {personalTodos.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No personal todos yet</p>
            ) : (
              personalTodos.map((todo) => (
                <div
                  key={todo.id}
                  className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <button
                    onClick={() => handleToggleComplete(todo)}
                    className={`mt-1 h-5 w-5 rounded border-2 flex items-center justify-center ${
                      todo.completed ? 'bg-green-500 border-green-500' : 'border-gray-300'
                    }`}
                  >
                    {todo.completed && <Check className="h-3 w-3 text-white" />}
                  </button>
                  <div className="flex-1">
                    <div className="font-medium">{todo.title}</div>
                    {todo.description && (
                      <div className="text-sm text-gray-600">{todo.description}</div>
                    )}
                    {todo.due_date && (
                      <div className="text-xs text-gray-500 mt-1">
                        Due: {format(new Date(todo.due_date), 'MMM d, yyyy h:mm a')}
                      </div>
                    )}
                    {todo.is_recurring && (
                      <div className="text-xs text-blue-600 mt-1">
                        Recurring: {todo.recurring_pattern}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(todo)} className="text-blue-600">
                      <Edit className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDelete(todo.id)} className="text-red-600">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Company Todos</CardTitle>
            <CardDescription>Shared company tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {companyTodos.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No company todos yet</p>
            ) : (
              companyTodos.map((todo) => (
                <div
                  key={todo.id}
                  className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <button
                    onClick={() => handleToggleComplete(todo)}
                    className={`mt-1 h-5 w-5 rounded border-2 flex items-center justify-center ${
                      todo.completed ? 'bg-green-500 border-green-500' : 'border-gray-300'
                    }`}
                  >
                    {todo.completed && <Check className="h-3 w-3 text-white" />}
                  </button>
                  <div className="flex-1">
                    <div className="font-medium">{todo.title}</div>
                    {todo.description && (
                      <div className="text-sm text-gray-600">{todo.description}</div>
                    )}
                    {todo.due_date && (
                      <div className="text-xs text-gray-500 mt-1">
                        Due: {format(new Date(todo.due_date), 'MMM d, yyyy h:mm a')}
                      </div>
                    )}
                    {todo.is_recurring && (
                      <div className="text-xs text-blue-600 mt-1">
                        Recurring: {todo.recurring_pattern}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(todo)} className="text-blue-600">
                      <Edit className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDelete(todo.id)} className="text-red-600">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {completedTodos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Completed</CardTitle>
            <CardDescription>Finished tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {completedTodos.map((todo) => (
              <div
                key={todo.id}
                className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg bg-gray-50 opacity-75"
              >
                <div className="mt-1 h-5 w-5 rounded bg-green-500 border-green-500 flex items-center justify-center">
                  <Check className="h-3 w-3 text-white" />
                </div>
                <div className="flex-1">
                  <div className="font-medium line-through">{todo.title}</div>
                  {todo.description && (
                    <div className="text-sm text-gray-600">{todo.description}</div>
                  )}
                </div>
                <button onClick={() => handleDelete(todo.id)} className="text-red-600">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

