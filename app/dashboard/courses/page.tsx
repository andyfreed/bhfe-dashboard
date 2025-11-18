'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BookOpen, RefreshCw, ExternalLink, DollarSign, Package, CheckCircle2, XCircle, FileText, Search, Database, X, Settings, ChevronDown, ChevronUp, ArrowUpDown } from 'lucide-react'
import { WordPressCourse } from '@/lib/wordpress-sync'

export default function CoursesPage() {
  const [courses, setCourses] = useState<WordPressCourse[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [wordpressUrl, setWordpressUrl] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [sitemapUrls, setSitemapUrls] = useState<Set<string>>(new Set())
  const [checkingSitemap, setCheckingSitemap] = useState(false)
  const [generatingSitemap, setGeneratingSitemap] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [metaKeys, setMetaKeys] = useState<any>(null)
  const [loadingMetaKeys, setLoadingMetaKeys] = useState(false)
  const [showMetaKeys, setShowMetaKeys] = useState(false)
  const [showConfig, setShowConfig] = useState(false)
  const [sortBy, setSortBy] = useState<'sitemap' | 'alphabetical'>('sitemap')
  const [inspectionData, setInspectionData] = useState<any>(null)
  const [inspecting, setInspecting] = useState(false)

  useEffect(() => {
    // Load saved WordPress URL and API key from localStorage
    const savedUrl = localStorage.getItem('bhfe_wordpress_url') || ''
    const savedKey = localStorage.getItem('bhfe_api_key') || ''
    setWordpressUrl(savedUrl)
    setApiKey(savedKey)
    
    if (savedUrl) {
      loadCourses(savedUrl, savedKey)
      checkSitemap(savedUrl)
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
      console.log('[Courses] API Response:', data)
      console.log('[Courses] Courses array:', data.courses)
      console.log('[Courses] Courses count:', data.courses?.length || 0)
      
      // Handle different response structures
      const coursesArray = data.courses || data.data?.courses || []
      setCourses(coursesArray)
      
      if (coursesArray.length === 0 && data.count > 0) {
        console.warn('[Courses] Response has count but no courses array. Full response:', data)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load courses')
      console.error('[Courses] Error loading courses:', err)
    } finally {
      setLoading(false)
    }
  }

  const normalizeUrl = (url: string, baseUrl?: string): string[] => {
    if (!url) return ['']
    
    const variations: string[] = []
    
    // Remove trailing slash
    let normalized = url.trim().replace(/\/$/, '')
    
    // If it's a relative URL and we have a base URL, make it absolute
    if (normalized.startsWith('/') && baseUrl) {
      const base = baseUrl.replace(/\/$/, '')
      normalized = `${base}${normalized}`
    }
    
    // Try to parse as URL
    try {
      const urlObj = new URL(normalized)
      // Add full URL without trailing slash
      variations.push(urlObj.href.replace(/\/$/, ''))
      // Add pathname without trailing slash
      variations.push(urlObj.pathname.replace(/\/$/, ''))
      // Add URL without protocol
      variations.push(urlObj.href.replace(/^https?:\/\//, '').replace(/\/$/, ''))
    } catch {
      // If URL parsing fails, just use the normalized version
      variations.push(normalized)
    }
    
    // Also add the original normalized version
    if (!variations.includes(normalized)) {
      variations.push(normalized)
    }
    
    return variations
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
    await checkSitemap(wordpressUrl)
    setSyncing(false)
  }

  const checkSitemap = async (url: string) => {
    if (!url.trim()) return
    
    try {
      setCheckingSitemap(true)
      
      // Route through Next.js API to avoid CORS issues
      // Add cache-busting timestamp to ensure we get fresh sitemap
      const params = new URLSearchParams({ 
        wordpress_url: url,
        endpoint: 'sitemap',
        _t: Date.now().toString() // Cache busting
      })
      if (apiKey) {
        params.append('api_key', apiKey)
      }
      
      const response = await fetch(`/api/sync/courses?${params.toString()}`)
      
      if (!response.ok) {
        console.warn('[Courses] Failed to fetch sitemap:', response.status, response.statusText)
        setSitemapUrls(new Set())
        return
      }
      
      const data = await response.json()
      const xmlText = data.xml
      
      if (!xmlText) {
        console.warn('[Courses] Sitemap XML is empty')
        setSitemapUrls(new Set())
        return
      }
      
      const parser = new DOMParser()
      const xmlDoc = parser.parseFromString(xmlText, 'text/xml')
      
      // Check for parsing errors
      const parserError = xmlDoc.querySelector('parsererror')
      if (parserError) {
        console.error('[Courses] XML parsing error:', parserError.textContent)
        setSitemapUrls(new Set())
        return
      }
      
      // Extract all URLs from the sitemap
      const urlElements = xmlDoc.getElementsByTagName('loc')
      const urls = new Set<string>()
      
      for (let i = 0; i < urlElements.length; i++) {
        const urlText = urlElements[i].textContent?.trim()
        if (urlText) {
          // Get all variations of this URL and add them all
          const variations = normalizeUrl(urlText, url)
          variations.forEach(variation => {
            if (variation) {
              urls.add(variation)
            }
          })
        }
      }
      
      console.log('[Courses] Loaded', urls.size, 'URL variations from sitemap')
      console.log('[Courses] Sample sitemap URLs:', Array.from(urls).slice(0, 5))
      setSitemapUrls(urls)
    } catch (err) {
      console.error('[Courses] Error checking sitemap:', err)
      setSitemapUrls(new Set())
    } finally {
      setCheckingSitemap(false)
    }
  }

  const generateSitemap = async () => {
    if (!wordpressUrl.trim()) {
      setError('Please enter a WordPress URL')
      return
    }
    
    if (courses.length === 0) {
      setError('No courses available. Please sync courses first.')
      return
    }
    
    try {
      setGeneratingSitemap(true)
      setError(null)
      
      // Generate sitemap XML from the course list
      const baseUrl = wordpressUrl.replace(/\/$/, '')
      const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${courses.map(course => `  <url>
    <loc>${course.permalink}</loc>
    <lastmod>${new Date(course.updated_at).toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`).join('\n')}
</urlset>`
      
      // Create a blob and download it
      const blob = new Blob([sitemapXml], { type: 'application/xml' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'sitemap.xml'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      // Re-check the sitemap after generation
      await checkSitemap(wordpressUrl)
    } catch (err) {
      console.error('[Courses] Error generating sitemap:', err)
      setError('Failed to generate sitemap. Please try again.')
    } finally {
      setGeneratingSitemap(false)
    }
  }

  const isInSitemap = (permalink: string): boolean => {
    if (sitemapUrls.size === 0) return false
    if (!permalink) return false
    
    // Get all variations of the permalink
    const permalinkVariations = normalizeUrl(permalink, wordpressUrl)
    
    // Check each variation against sitemap URLs
    for (const permalinkVar of permalinkVariations) {
      // Direct match
      if (sitemapUrls.has(permalinkVar)) {
        console.log('[Courses] Found match:', permalinkVar)
        return true
      }
      
      // Check if any sitemap URL matches this variation
      for (const sitemapUrl of sitemapUrls) {
        const sitemapVariations = normalizeUrl(sitemapUrl)
        
        // Check if any variation matches
        for (const sitemapVar of sitemapVariations) {
          if (permalinkVar === sitemapVar || 
              permalinkVar.endsWith(sitemapVar) || 
              sitemapVar.endsWith(permalinkVar)) {
            console.log('[Courses] Found match:', permalinkVar, '===', sitemapVar)
            return true
          }
        }
      }
    }
    
    return false
  }

  const getAdminUrl = (courseId: number): string => {
    const baseUrl = wordpressUrl.replace(/\/$/, '')
    return `${baseUrl}/wp-admin/post.php?post=${courseId}&action=edit`
  }

  const fetchMetaKeys = async () => {
    if (!wordpressUrl.trim()) {
      setError('Please enter a WordPress URL')
      return
    }
    
    try {
      setLoadingMetaKeys(true)
      setError(null)
      
      // Route through Next.js API to avoid CORS issues
      const params = new URLSearchParams({ 
        wordpress_url: wordpressUrl,
        endpoint: 'course-meta-keys'
      })
      if (apiKey) {
        params.append('api_key', apiKey)
      }
      
      const response = await fetch(`/api/sync/courses?${params.toString()}`)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }))
        throw new Error(errorData.error || `Failed to fetch meta keys: ${response.statusText}`)
      }
      
      const data = await response.json()
      setMetaKeys(data)
      setShowMetaKeys(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch meta keys')
      console.error('[Courses] Error fetching meta keys:', err)
    } finally {
      setLoadingMetaKeys(false)
    }
  }

  const inspectExcludedCourses = async () => {
    if (!wordpressUrl.trim()) {
      setError('Please enter a WordPress URL')
      return
    }
    
    // The excluded course IDs from the plugin
    const excludedIds = [48753, 50728, 50727, 48594, 48528, 49453, 48855, 35568, 48390, 50513, 50511, 50512, 48754, 48752, 48674, 50385, 48553]
    
    try {
      setInspecting(true)
      setError(null)
      
      // Route through Next.js API to avoid CORS issues
      const params = new URLSearchParams({ 
        wordpress_url: wordpressUrl,
        endpoint: 'inspect-courses',
        ids: excludedIds.join(',')
      })
      if (apiKey) {
        params.append('api_key', apiKey)
      }
      
      const response = await fetch(`/api/sync/courses?${params.toString()}`)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }))
        throw new Error(errorData.error || `Failed to inspect courses: ${response.statusText}`)
      }
      
      const data = await response.json()
      setInspectionData(data)
      console.log('[Courses] Inspection data:', data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to inspect courses')
      console.error('[Courses] Error inspecting courses:', err)
    } finally {
      setInspecting(false)
    }
  }

  const filteredCourses = courses.filter((course) => {
    if (!searchTerm.trim()) return true
    const search = searchTerm.toLowerCase()
    return (
      course.title.toLowerCase().includes(search) ||
      course.excerpt?.toLowerCase().includes(search) ||
      course.product_sku?.toLowerCase().includes(search) ||
      course.slug.toLowerCase().includes(search)
    )
  }).sort((a, b) => {
    if (sortBy === 'alphabetical') {
      // Sort alphabetically by title
      return a.title.localeCompare(b.title, undefined, { sensitivity: 'base' })
    } else {
      // Sort: courses not in sitemap first, then alphabetically within each group
      const aInSitemap = isInSitemap(a.permalink)
      const bInSitemap = isInSitemap(b.permalink)
      if (aInSitemap !== bInSitemap) {
        return aInSitemap ? 1 : -1
      }
      // If both in same sitemap status, sort alphabetically
      return a.title.localeCompare(b.title, undefined, { sensitivity: 'base' })
    }
  })

  // Calculate count of courses not in sitemap and store in localStorage
  useEffect(() => {
    if (courses.length > 0) {
      if (sitemapUrls.size > 0) {
        const notInSitemapCount = courses.filter(course => !isInSitemap(course.permalink)).length
        localStorage.setItem('bhfe_courses_not_in_sitemap_count', notInSitemapCount.toString())
        // Trigger storage event for same-window listeners
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'bhfe_courses_not_in_sitemap_count',
          newValue: notInSitemapCount.toString()
        }))
      } else {
        // If sitemap hasn't been checked yet, assume all are not in sitemap
        localStorage.setItem('bhfe_courses_not_in_sitemap_count', courses.length.toString())
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'bhfe_courses_not_in_sitemap_count',
          newValue: courses.length.toString()
        }))
      }
    } else if (courses.length === 0 && !loading) {
      // Clear the count if no courses are loaded
      localStorage.removeItem('bhfe_courses_not_in_sitemap_count')
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'bhfe_courses_not_in_sitemap_count',
        newValue: null
      }))
    }
  }, [courses, sitemapUrls, loading])

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Active Courses</h1>
          <p className="text-gray-600 mt-1">Courses synced from WordPress</p>
        </div>
        <Button
          onClick={() => setShowConfig(!showConfig)}
          variant="outline"
          className="flex items-center gap-2"
        >
          <Settings className="h-4 w-4" />
          {showConfig ? 'Hide' : 'Show'} Configuration
          {showConfig ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* WordPress Configuration */}
      {showConfig && (
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
          <div className="flex gap-2 flex-wrap">
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
            <Button
              onClick={() => checkSitemap(wordpressUrl)}
              disabled={checkingSitemap || !wordpressUrl.trim()}
              variant="outline"
              className="w-full sm:w-auto"
            >
              {checkingSitemap ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Checking...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  Check Sitemap
                </>
              )}
            </Button>
            <Button
              onClick={generateSitemap}
              disabled={generatingSitemap || !wordpressUrl.trim()}
              variant="outline"
              className="w-full sm:w-auto"
            >
              {generatingSitemap ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  Generate Sitemap
                </>
              )}
            </Button>
            <div className="flex gap-2 flex-wrap">
              <Button
                onClick={fetchMetaKeys}
                disabled={loadingMetaKeys || !wordpressUrl.trim()}
                variant="outline"
                className="w-full sm:w-auto"
              >
                {loadingMetaKeys ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <Database className="h-4 w-4 mr-2" />
                    View Meta Fields
                  </>
                )}
              </Button>
              <Button
                onClick={inspectExcludedCourses}
                disabled={inspecting || !wordpressUrl.trim()}
                variant="outline"
                className="w-full sm:w-auto"
              >
                {inspecting ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Inspecting...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4 mr-2" />
                    Inspect Excluded Courses
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      )}

      {/* Error Message */}
      {error && (
        <Card className="border-2 border-red-300 bg-red-50">
          <CardContent className="pt-6">
            <div className="text-red-700 font-semibold">Error: {error}</div>
          </CardContent>
        </Card>
      )}

      {/* Inspection Data Display */}
      {inspectionData && (
        <Card className="border-2 border-slate-300">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Excluded Courses Inspection
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setInspectionData(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Inspected {inspectionData.courses_inspected} courses
            </p>
          </CardHeader>
          <CardContent>
            {inspectionData.common_meta && Object.keys(inspectionData.common_meta).length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-2">Common Meta Fields (shared by all):</h3>
                <div className="space-y-2">
                  {Object.entries(inspectionData.common_meta).map(([key, value]: [string, any]) => (
                    <div key={key} className="p-3 border border-gray-200 rounded-lg bg-yellow-50">
                      <code className="text-sm font-mono font-semibold text-gray-900">{key}:</code>
                      <pre className="text-xs mt-1 text-gray-700 whitespace-pre-wrap break-words">
                        {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                      </pre>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <h3 className="font-semibold text-gray-900 mb-4">Individual Course Details:</h3>
            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              {inspectionData.courses?.map((course: any) => (
                <div key={course.id} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                  <div className="mb-2">
                    <span className="font-semibold text-gray-900">ID: {course.id}</span>
                    <span className="ml-4 text-sm text-gray-600">Status: {course.post_status}</span>
                  </div>
                  <div className="mb-2">
                    <span className="font-medium text-gray-700">Title: {course.title}</span>
                  </div>
                  {course.version_content && (
                    <div className="mb-2">
                      <span className="text-sm font-medium text-gray-700">Version Content:</span>
                      <pre className="text-xs mt-1 text-gray-600 whitespace-pre-wrap break-words">
                        {JSON.stringify(course.version_content, null, 2)}
                      </pre>
                    </div>
                  )}
                  <details className="mt-2">
                    <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                      All Meta Fields ({Object.keys(course.all_meta || {}).length})
                    </summary>
                    <div className="mt-2 space-y-2">
                      {Object.entries(course.all_meta || {}).map(([key, value]: [string, any]) => (
                        <div key={key} className="p-2 border border-gray-300 rounded bg-white">
                          <code className="text-xs font-mono font-semibold text-gray-900">{key}:</code>
                          <pre className="text-xs mt-1 text-gray-600 whitespace-pre-wrap break-words">
                            {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                          </pre>
                        </div>
                      ))}
                    </div>
                  </details>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Meta Keys Display */}
      {showMetaKeys && metaKeys && (
        <Card className="border-2 border-slate-300">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Available Meta Fields
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowMetaKeys(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Found {metaKeys.unique_meta_keys} unique meta keys across {metaKeys.total_courses_checked} courses
            </p>
          </CardHeader>
          <CardContent>
            {metaKeys.taxonomies && metaKeys.taxonomies.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-2">Taxonomies:</h3>
                <div className="flex flex-wrap gap-2">
                  {metaKeys.taxonomies.map((tax: string) => (
                    <span key={tax} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md text-sm font-medium">
                      {tax}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            <h3 className="font-semibold text-gray-900 mb-4">Meta Keys:</h3>
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {Object.entries(metaKeys.meta_keys || {}).map(([key, data]: [string, any]) => (
                <div key={key} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                  <div className="flex items-start justify-between mb-2">
                    <code className="text-sm font-mono font-semibold text-gray-900">{key}</code>
                    <div className="flex gap-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        data.type === 'array' || data.type === 'object'
                          ? 'bg-purple-100 text-purple-700'
                          : data.type === 'string'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {data.type}
                      </span>
                      {data.is_array && (
                        <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700">
                          Array
                        </span>
                      )}
                      {data.is_object && (
                        <span className="px-2 py-1 rounded text-xs font-medium bg-indigo-100 text-indigo-700">
                          Object
                        </span>
                      )}
                    </div>
                  </div>
                  {data.sample_value && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-500 mb-1">Sample value:</p>
                      <pre className="text-xs bg-white p-2 rounded border border-gray-200 overflow-x-auto">
                        {typeof data.sample_value === 'string' 
                          ? data.sample_value 
                          : JSON.stringify(data.sample_value, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
            {metaKeys.note && (
              <p className="mt-4 text-sm text-gray-600 italic">{metaKeys.note}</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Search and Sort */}
      {courses.length > 0 && (
        <Card className="border-2 border-slate-300">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search courses by title, SKU, or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <ArrowUpDown className="h-5 w-5 text-gray-400" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'sitemap' | 'alphabetical')}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="sitemap">Sitemap Priority</option>
                  <option value="alphabetical">Alphabetical</option>
                </select>
              </div>
            </div>
            {searchTerm && (
              <p className="mt-2 text-sm text-gray-600">
                Showing {filteredCourses.length} of {courses.length} courses
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Courses List */}
      {courses.length > 0 ? (
        filteredCourses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => (
            <Card key={course.id} className="flex flex-col border-2 border-slate-300 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-lg font-bold text-gray-900 line-clamp-2 flex-1">
                    {course.title}
                  </CardTitle>
                  <span className="text-xs text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded whitespace-nowrap">
                    ID: {course.id}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col space-y-4">
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
                  
                  {course.archived_versions_count > 0 && (
                    <div className="flex items-center gap-2 text-gray-500 text-xs">
                      <span>{course.archived_versions_count} archived</span>
                    </div>
                  )}
                  
                  {/* Sitemap Status */}
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-600">Sitemap:</span>
                    {checkingSitemap ? (
                      <span className="text-gray-400">Checking...</span>
                    ) : isInSitemap(course.permalink) ? (
                      <div className="flex items-center gap-1 text-green-600">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Included</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-red-600">
                        <XCircle className="h-4 w-4" />
                        <span>Not Included</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="pt-4 border-t border-gray-200 space-y-2">
                  <a
                    href={course.permalink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold text-sm"
                  >
                    <span>View Course</span>
                    <ExternalLink className="h-4 w-4" />
                  </a>
                  <a
                    href={getAdminUrl(course.id)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-semibold text-sm"
                  >
                    <span>View Admin</span>
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </CardContent>
            </Card>
          ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Search className="h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500 font-semibold mb-2">No courses to display</p>
              <p className="text-sm text-gray-400 text-center">
                {searchTerm 
                  ? `No courses match "${searchTerm}". Try a different search term.`
                  : 'No courses available. Please sync courses from WordPress.'}
              </p>
            </CardContent>
          </Card>
        )
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
          {searchTerm 
            ? `Showing ${filteredCourses.length} of ${courses.length} active course${courses.length !== 1 ? 's' : ''}`
            : `Showing ${courses.length} active course${courses.length !== 1 ? 's' : ''}`
          }
        </div>
      )}

      {/* No Results */}
      {courses.length > 0 && filteredCourses.length === 0 && searchTerm && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Search className="h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500 font-semibold mb-2">No courses found</p>
            <p className="text-sm text-gray-400 text-center">
              No courses match your search for "{searchTerm}"
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
