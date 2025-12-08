import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getDateRanges } from '@/lib/google-analytics'

/**
 * Fetch Google Analytics data
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const propertyId = searchParams.get('property_id')
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')

    if (!propertyId || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Missing required parameters: property_id, start_date, end_date' },
        { status: 400 }
      )
    }

    // Get user's stored tokens
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Get stored tokens
    const { data: tokenData } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', `google_tokens_${user.id}`)
      .single()

    if (!tokenData) {
      return NextResponse.json(
        { error: 'Google not authenticated. Please connect your Google account.' },
        { status: 401 }
      )
    }

    const tokens = JSON.parse(tokenData.value)

    // Refresh token if needed
    let accessToken = tokens.access_token
    if (Date.now() >= tokens.expires_at) {
      // Token expired, refresh it
      accessToken = await refreshGoogleToken(tokens.refresh_token)
    }

    // Fetch Analytics data using REST API (since OAuth tokens need special handling)
    const dateRanges = getDateRanges(startDate, endDate)
    
    // Use the REST API directly with OAuth token
    const response = await fetch(
      `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dateRanges: [
            {
              startDate: dateRanges.current.startDate,
              endDate: dateRanges.current.endDate,
              name: 'current',
            },
            {
              startDate: dateRanges.previous.startDate,
              endDate: dateRanges.previous.endDate,
              name: 'previous',
            },
          ],
          dimensions: [{ name: 'eventName' }],
          metrics: [
            { name: 'eventCount' },
            { name: 'conversions' },
            { name: 'totalUsers' },
            { name: 'sessions' },
          ],
          orderBys: [
            {
              metric: {
                metricName: 'eventCount',
              },
              desc: true,
            },
          ],
        }),
      }
    )

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || 'Failed to fetch Analytics data')
    }

    const data = await response.json()
    return NextResponse.json({ data }, { status: 200 })
  } catch (error) {
    console.error('Error fetching Analytics data:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch Analytics data' },
      { status: 500 }
    )
  }
}

async function refreshGoogleToken(refreshToken: string): Promise<string> {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    throw new Error('Google credentials not configured')
  }

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'refresh_token',
    }),
  })

  const tokens = await response.json()
  if (tokens.error) {
    throw new Error(`Token refresh failed: ${tokens.error}`)
  }

  return tokens.access_token
}

