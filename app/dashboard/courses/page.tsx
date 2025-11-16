'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BookOpen, RefreshCw, ExternalLink, DollarSign, Package, Calendar } from 'lucide-react'
import { WordPressCourse } from '@/lib/wordpress-sync'
import { format } from 'date-fns'

export default function CoursesPage() {
  const [courses, setCourses] = useState<WordPressCourse[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [wordpressUrl, setWordpressUrl] = useState('')
  const [apiKey, setApiKey] = useState('')

  useEffect(() => {
    // Load saved WordPress URL and API key from localStorage
    const savedUrl = localStorage.getItem('bhfe_wordpress_url') || ''
    const savedKey = localStorage.getItem('bhfe_api_key') || ''
    setWordpressUrl(savedUrl)
    setApiKey(savedKey)
    
    if (savedUrl) {
      loadCourses(savedUrl, savedKey)
    } else {
      setLoading(false)
    }
  }, [])

  const loadCourses = async (url: string, key?: string) => {
    try {
      setLoading(true)
      setError(null)
      
      const params = new URLSearchParams({ wordpress_url: url })
      if (key) {
        params.append('api_key', key)
      }
      
      const response = await fetch(`/api/sync/courses?${params.toString()}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Failed to fetch courses: ${response.statusText}`)
      }
      
      const data = await response.json()
      setCourses(data.courses || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load courses')
      console.error('[Courses] Error loading courses:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSync = async () => {
    if (!wordpressUrl.trim()) {
      setError('Please enter a WordPress URL')
      return
    }
    
    setSyncing(true)
    setError(null)
    
    // Save to localStorage
    localStorage.setItem('bhfe_wordpress_url', wordpressUrl)
    if (apiKey) {
      localStorage.setItem('bhfe_api_key', apiKey)
    }
    
    await loadCourses(wordpressUrl, apiKey)
    setSyncing(false)
  }

  if (loading && courses.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Active Courses</h1>
          <p className="text-gray-600 mt-1">Courses synced from WordPress</p>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="flex items-center gap-3">
              <div className="h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <div className="text-slate-600 font-medium">Loading courses...</div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Active Courses</h1>
          <p className="text-gray-600 mt-1">Courses synced from WordPress</p>
      </div>

      {/* WordPress Configuration */}
      <Card className="border-2 border-slate-300">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            WordPress Sync Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label htmlFor="wordpress-url" className="block text-sm font-semibold text-gray-700 mb-2">
              WordPress Site URL
            </label>
            <input
              id="wordpress-url"
              type="url"
              value={wordpressUrl}
              onChange={(e) => setWordpressUrl(e.target.value)}
              placeholder="https://yoursite.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="api-key" className="block text-sm font-semibold text-gray-700 mb-2">
              API Key (Optional)
            </label>
            <input
              id="api-key"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Leave empty if not configured"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <Button
            onClick={handleSync}
            disabled={syncing || !wordpressUrl.trim()}
            className="w-full sm:w-auto"
          >
            {syncing ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Sync Courses
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Error Message */}
      {error && (
        <Card className="border-2 border-red-300 bg-red-50">
          <CardContent className="pt-6">
            <div className="text-red-700 font-semibold">Error: {error}</div>
          </CardContent>
        </Card>
      )}

      {/* Courses List */}
      {courses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <Card key={course.id} className="flex flex-col border-2 border-slate-300 hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-gray-900 line-clamp-2">
                  {course.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col space-y-4">
                {course.excerpt && (
                  <p className="text-sm text-gray-600 line-clamp-3">{course.excerpt}</p>
                )}
                
                <div className="space-y-2 text-sm">
                  {course.product_sku && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Package className="h-4 w-4" />
                      <span>SKU: {course.product_sku}</span>
                    </div>
                  )}
                  
                  {course.product_price && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <DollarSign className="h-4 w-4" />
                      <span>${course.product_price}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2 text-gray-600">
                    <BookOpen className="h-4 w-4" />
                    <span>
                      {course.public_versions_count} public version{course.public_versions_count !== 1 ? 's' : ''}
                    </span>
                  </div>
                  
                  {course.archived_versions_count > 0 && (
                    <div className="flex items-center gap-2 text-gray-500 text-xs">
                      <span>{course.archived_versions_count} archived</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2 text-gray-500 text-xs">
                    <Calendar className="h-4 w-4" />
                    <span>Updated {format(new Date(course.updated_at), 'MMM d, yyyy')}</span>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-gray-200">
                  <a
                    href={course.permalink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold text-sm"
                  >
                    <span>View Course</span>
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        !loading && !error && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BookOpen className="h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500 font-semibold mb-2">No courses found</p>
              <p className="text-sm text-gray-400 text-center">
                {wordpressUrl
                  ? 'Click "Sync Courses" to load active courses from WordPress'
                  : 'Enter your WordPress URL and click "Sync Courses" to get started'}
              </p>
            </CardContent>
          </Card>
        )
      )}

      {/* Course Count */}
      {courses.length > 0 && (
        <div className="text-center text-sm text-gray-600">
          Showing {courses.length} active course{courses.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  )
}
