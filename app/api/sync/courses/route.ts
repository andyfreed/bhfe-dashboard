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
    return NextResponse.json(
      { 
        error: 'Failed to sync courses',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
