import { NextRequest, NextResponse } from 'next/server'
import { fetchActiveCoursesFromWordPress } from '@/lib/wordpress-sync'

/**
 * API route to sync courses from WordPress
 * 
 * GET /api/sync/courses?wordpress_url=...&api_key=...
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const wordpressUrl = searchParams.get('wordpress_url')
    const apiKey = searchParams.get('api_key') || undefined
    
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
