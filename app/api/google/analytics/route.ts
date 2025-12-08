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

    const eventData = await response.json()

    // Fetch comprehensive Analytics data with multiple dimensions
    // Fetch pages data
    const pagesResponse = await fetch(
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
          dimensions: [{ name: 'pagePath' }],
          metrics: [
            { name: 'screenPageViews' },
            { name: 'activeUsers' },
            { name: 'sessions' },
            { name: 'eventCount' },
          ],
          limit: 100,
          orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
        }),
      }
    )

    const pagesData = pagesResponse.ok ? await pagesResponse.json() : null

    // Fetch traffic sources
    const sourcesResponse = await fetch(
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
          dimensions: [{ name: 'sessionSourceMedium' }],
          metrics: [
            { name: 'sessions' },
            { name: 'activeUsers' },
            { name: 'eventCount' },
            { name: 'conversions' },
          ],
          limit: 50,
          orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
        }),
      }
    )

    const sourcesData = sourcesResponse.ok ? await sourcesResponse.json() : null

    // Fetch countries
    const countriesResponse = await fetch(
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
          dimensions: [{ name: 'country' }],
          metrics: [
            { name: 'activeUsers' },
            { name: 'sessions' },
            { name: 'screenPageViews' },
          ],
          limit: 50,
          orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
        }),
      }
    )

    const countriesData = countriesResponse.ok ? await countriesResponse.json() : null

    // Fetch devices
    const devicesResponse = await fetch(
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
          dimensions: [{ name: 'deviceCategory' }],
          metrics: [
            { name: 'activeUsers' },
            { name: 'sessions' },
            { name: 'screenPageViews' },
          ],
          orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
        }),
      }
    )

    const devicesData = devicesResponse.ok ? await devicesResponse.json() : null

    // Fetch browsers
    const browsersResponse = await fetch(
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
          dimensions: [{ name: 'browser' }],
          metrics: [
            { name: 'activeUsers' },
            { name: 'sessions' },
          ],
          limit: 20,
          orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
        }),
      }
    )

    const browsersData = browsersResponse.ok ? await browsersResponse.json() : null

    return NextResponse.json({ 
      data: eventData,
      pages: pagesData,
      sources: sourcesData,
      countries: countriesData,
      devices: devicesData,
      browsers: browsersData,
    }, { status: 200 })
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

