'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar as CalendarIcon, MapPin } from 'lucide-react'
import Link from 'next/link'

export default function DashboardPage() {
  const [assignedTodos, setAssignedTodos] = useState<Array<{
    id: string
    title: string
    due_date: string | null
    reminder_date: string | null
    is_super_reminder: boolean | null
    priority: 'low' | 'medium' | 'high' | null
    completed: boolean | null
  }>>([])
  const [recentCompletedTodos, setRecentCompletedTodos] = useState<Array<{
    id: string
    title: string
    updated_at: string
  }>>([])
  const [upcomingRenewals, setUpcomingRenewals] = useState<Array<{
    state_name: string
    state_code: string
    renewal_month: string
  }>>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const loadDashboard = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: todoData, error: todoError } = await supabase
        .from('todos')
        .select('id, title, due_date, reminder_date, is_super_reminder, priority, completed')
        .eq('assigned_to', user.id)
        .eq('completed', false)

      if (todoError) {
        console.error('Error loading assigned todos:', todoError)
      } else {
        setAssignedTodos(todoData || [])
      }

      const { data: completedData, error: completedError } = await supabase
        .from('todos')
        .select('id, title, updated_at')
        .eq('completed', true)
        .order('updated_at', { ascending: false })
        .limit(4)

      if (completedError) {
        console.error('Error loading completed todos:', completedError)
      } else {
        setRecentCompletedTodos(completedData || [])
      }

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

    loadDashboard()
  }, [supabase])

  const prioritizedTodos = useMemo(() => {
    const startOfToday = new Date()
    startOfToday.setHours(0, 0, 0, 0)
    const priorityRank: Record<string, number> = {
      high: 0,
      medium: 1,
      low: 2,
    }

    const getEffectiveDate = (todo: typeof assignedTodos[number]) => {
      const raw = todo.reminder_date || todo.due_date
      return raw ? new Date(raw) : null
    }

    const getRank = (todo: typeof assignedTodos[number]) => {
      const isSuper = !!todo.is_super_reminder
      const effectiveDate = getEffectiveDate(todo)
      if (!effectiveDate) return 4
      const startOfDueDate = new Date(effectiveDate)
      startOfDueDate.setHours(0, 0, 0, 0)
      const isOverdue = startOfDueDate < startOfToday
      const isToday = startOfDueDate.getTime() === startOfToday.getTime()

      if (isSuper && isOverdue) return 0
      if (isSuper && isToday) return 1
      if (!isSuper && isToday) return 2
      if (!isSuper && isOverdue) return 3
      return 4
    }

    const sorted = [...assignedTodos].sort((a, b) => {
      const rankDiff = getRank(a) - getRank(b)
      if (rankDiff !== 0) return rankDiff

      const priorityDiff = (priorityRank[a.priority || 'medium'] ?? 1) - (priorityRank[b.priority || 'medium'] ?? 1)
      if (priorityDiff !== 0) return priorityDiff

      const dateA = getEffectiveDate(a)?.getTime() ?? Number.MAX_SAFE_INTEGER
      const dateB = getEffectiveDate(b)?.getTime() ?? Number.MAX_SAFE_INTEGER
      if (dateA !== dateB) return dateA - dateB

      return a.title.localeCompare(b.title)
    })

    return sorted.slice(0, 4)
  }, [assignedTodos])

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
      <div className="relative overflow-hidden rounded-2xl lg:rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-6 sm:p-8 lg:p-10 shadow-2xl">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjE1KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 sm:gap-4 mb-3 sm:mb-4">
            <div className="p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-white/20 backdrop-blur-sm h-10 w-10 sm:h-12 sm:w-12 flex items-center justify-center overflow-hidden">
              <img src="/logo.png" alt="BHFE Logo" className="h-full w-full object-contain" />
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight drop-shadow-lg">Dashboard</h1>
          </div>
          
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="border-2 border-slate-300 shadow-xl overflow-hidden bg-gradient-to-br from-white via-slate-50 to-white">
          <CardHeader className="border-b border-slate-200 bg-gradient-to-r from-white via-slate-50 to-white">
            <CardTitle className="text-xl text-slate-900 font-bold">My Top Tasks</CardTitle>
            
          </CardHeader>
          <CardContent className="p-6 space-y-3">
            {prioritizedTodos.length === 0 ? (
              <div className="text-sm text-slate-500">No assigned tasks.</div>
            ) : (
              prioritizedTodos.map((todo) => {
                const displayDate = todo.reminder_date || todo.due_date
                const dateLabel = displayDate ? new Date(displayDate).toLocaleDateString() : 'No date'
                return (
                  <Link
                    key={todo.id}
                    href="/dashboard/todos"
                    className="flex items-start justify-between gap-4 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm transition-transform hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-900 truncate">{todo.title}</div>
                      <div className="text-xs text-slate-500">Due: {dateLabel}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      {todo.is_super_reminder && (
                        <span className="text-[10px] uppercase tracking-wide font-bold bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
                          Super
                        </span>
                      )}
                      {todo.priority && (
                        <span className="text-[10px] uppercase tracking-wide font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded-full">
                          {todo.priority}
                        </span>
                      )}
                    </div>
                  </Link>
                )
              })
            )}
          </CardContent>
        </Card>
        <Card className="border-2 border-slate-300 shadow-xl overflow-hidden bg-gradient-to-br from-white via-slate-50 to-white">
          <CardHeader className="border-b border-slate-200 bg-gradient-to-r from-white via-slate-50 to-white">
            <CardTitle className="text-xl text-slate-900 font-bold">Recently Completed (All Users)</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-3">
            {recentCompletedTodos.length === 0 ? (
              <div className="text-sm text-slate-500">No completed tasks yet.</div>
            ) : (
              recentCompletedTodos.map((todo) => (
                <div
                  key={todo.id}
                  className="flex items-start justify-between gap-4 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm"
                >
                  <div className="min-w-0">
                    <div className="font-semibold text-slate-900 truncate">{todo.title}</div>
                    <div className="text-xs text-slate-500">
                      Completed: {new Date(todo.updated_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* CPA Renewals Coming Up */}
      {upcomingRenewals.length > 0 && (
        <Card className="border-2 border-slate-300 shadow-xl overflow-hidden bg-gradient-to-br from-white to-slate-50">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
                <CalendarIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl text-white font-bold">CPA Renewals Coming Up</CardTitle>
                <CardDescription className="text-white mt-1 font-medium">States with renewals in the next 3 months</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 bg-white">
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
                    <h3 className="font-bold text-lg text-slate-900 mb-3">{column.month}</h3>
                    {column.states.length > 0 ? (
                      column.states.map((renewal, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 hover:border-blue-400 transition-colors"
                        >
                          <MapPin className="h-4 w-4 text-blue-600 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-slate-900 truncate">{renewal.state_name}</div>
                            <div className="text-xs text-slate-600">Renewal: {renewal.renewal_month}</div>
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
