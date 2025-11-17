/**
 * WordPress Course Sync Utilities
 * 
 * Fetches active courses from WordPress and syncs them to Supabase
 */

export interface WordPressCourse {
  id: number
  title: string
  slug: string
  permalink: string
  excerpt: string
  content: string
  product_id: number | null
  product_sku: string | null
  product_price: string | null
  versions: CourseVersion[]
  public_versions_count: number
  archived_versions_count: number
  updated_at: string
  created_at: string
}

export interface CourseVersion {
  version_key: string
  version_number: number | null
  is_public: boolean
  is_archived: boolean
  created_at: string | null
}

export interface WordPressCoursesResponse {
  success: boolean
  count: number
  courses: WordPressCourse[]
}

/**
 * Fetch active courses from WordPress
 */
export async function fetchActiveCoursesFromWordPress(
  wordpressUrl: string,
  apiKey?: string
): Promise<WordPressCoursesResponse> {
  const endpoint = `${wordpressUrl.replace(/\/$/, '')}/wp-json/bhfe/v1/active-courses`
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }
  
  if (apiKey) {
    headers['X-BHFE-API-Key'] = apiKey
  }
  
  const response = await fetch(endpoint, {
    method: 'GET',
    headers,
  })
  
  if (!response.ok) {
    const errorText = await response.text()
    let errorMessage = `Failed to fetch courses from WordPress: ${response.status} ${response.statusText}`
    
    // Try to parse error message if it's JSON
    try {
      const errorData = JSON.parse(errorText)
      if (errorData.message) {
        errorMessage = errorData.message
      } else if (errorData.error) {
        errorMessage = errorData.error
      }
    } catch {
      // If not JSON, use the text response
      if (errorText) {
        errorMessage += ` - ${errorText.substring(0, 200)}`
      }
    }
    
    throw new Error(errorMessage)
  }
  
  const data = await response.json()
  return data
}

/**
 * Sync courses from WordPress to local state
 * This can be called from an API route or server component
 */
export async function syncCoursesFromWordPress(
  wordpressUrl: string,
  apiKey?: string
): Promise<WordPressCourse[]> {
  const response = await fetchActiveCoursesFromWordPress(wordpressUrl, apiKey)
  
  if (!response.success) {
    throw new Error('WordPress API returned unsuccessful response')
  }
  
  return response.courses
}
