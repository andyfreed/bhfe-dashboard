import { NextRequest, NextResponse } from 'next/server'
import { fetchActiveCoursesFromWordPress } from '@/lib/wordpress-sync'

/**
 * API route to sync courses from WordPress
 * 
 * GET /api/sync/courses?wordpress_url=...&api_key=...
 * GET /api/sync/courses?wordpress_url=...&api_key=...&endpoint=course-meta-keys (for meta keys)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const wordpressUrl = searchParams.get('wordpress_url')
    const apiKey = searchParams.get('api_key') || undefined
    const endpoint = searchParams.get('endpoint') // Optional: 'course-meta-keys' or 'sitemap'
    
    if (!wordpressUrl) {
      return NextResponse.json(
        { error: 'wordpress_url parameter is required' },
        { status: 400 }
      )
    }
    
    // Validate WordPress URL format
    try {
      new URL(wordpressUrl)
    } catch {
      return NextResponse.json(
        { error: 'Invalid wordpress_url format' },
        { status: 400 }
      )
    }
    
    // Handle different endpoints
    if (endpoint === 'course-meta-keys') {
      // Fetch meta keys endpoint
      const metaKeysUrl = `${wordpressUrl.replace(/\/$/, '')}/wp-json/bhfe/v1/course-meta-keys`
      const headers: HeadersInit = {}
      if (apiKey) {
        headers['X-BHFE-API-Key'] = apiKey
      }
      
      const response = await fetch(metaKeysUrl, { headers })
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }))
        throw new Error(errorData.error || `Failed to fetch meta keys: ${response.statusText}`)
      }
      
      const data = await response.json()
      return NextResponse.json(data, { status: 200 })
    }
    
    if (endpoint === 'inspect-courses') {
      // Inspect specific courses
      const courseIds = searchParams.get('ids')
      if (!courseIds) {
        return NextResponse.json(
          { error: 'ids parameter is required for inspect-courses endpoint' },
          { status: 400 }
        )
      }
      
      const inspectUrl = `${wordpressUrl.replace(/\/$/, '')}/wp-json/bhfe/v1/inspect-courses?ids=${encodeURIComponent(courseIds)}`
      const headers: HeadersInit = {}
      if (apiKey) {
        headers['X-BHFE-API-Key'] = apiKey
      }
      
      const response = await fetch(inspectUrl, { headers })
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }))
        throw new Error(errorData.error || `Failed to inspect courses: ${response.statusText}`)
      }
      
      const data = await response.json()
      return NextResponse.json(data, { status: 200 })
    }
    
    if (endpoint === 'sitemap') {
      // Fetch sitemap
      const sitemapUrl = `${wordpressUrl.replace(/\/$/, '')}/sitemap.xml`
      const response = await fetch(sitemapUrl)
      
      if (!response.ok) {
        return NextResponse.json({ urls: [] }, { status: 200 })
      }
      
      const xmlText = await response.text()
      return NextResponse.json({ xml: xmlText }, { status: 200 })
    }
    
    // Default: fetch courses
    const courses = await fetchActiveCoursesFromWordPress(wordpressUrl, apiKey)
    
    return NextResponse.json(courses, { status: 200 })
  } catch (error) {
    console.error('[Sync Courses] Error:', error)
    
    // Provide more helpful error messages
    let errorMessage = 'Failed to sync courses'
    if (error instanceof Error) {
      errorMessage = error.message
      
      // Check for common issues
      if (error.message.includes('fetch failed') || error.message.includes('ECONNREFUSED')) {
        errorMessage = 'Cannot connect to WordPress site. Please check the URL and ensure the site is accessible.'
      } else if (error.message.includes('404')) {
        errorMessage = 'WordPress endpoint not found. Make sure the BHFE Course Sync plugin is installed and activated on your WordPress site.'
      } else if (error.message.includes('401') || error.message.includes('403')) {
        errorMessage = 'Authentication failed. Please check your API key in WordPress Settings > BHFE Course Sync.'
      }
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
