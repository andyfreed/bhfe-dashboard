import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { google } from 'googleapis'

/**
 * Fetch specific data based on query requirements
 * This endpoint allows the AI to request only the data it needs
 */
export async function POST(request: NextRequest) {
  try {
    const { 
      propertyId, 
      customerId, 
      siteUrl,
      dataTypes, // ['keywords', 'pages', 'sources', 'countries', 'devices', 'browsers', 'events']
      dateRange, // { startDate, endDate }
      filters, // { pageUrl, keyword, country, etc. }
    } = await request.json()

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
    let accessToken = tokens.access_token
    if (Date.now() >= tokens.expires_at) {
      accessToken = await refreshGoogleToken(tokens.refresh_token)
    }

    const results: any = {}
    const startDate = dateRange?.startDate || new Date(new Date().setMonth(new Date().getMonth() - 16)).toISOString().split('T')[0]
    const endDate = dateRange?.endDate || new Date().toISOString().split('T')[0]

    // Helper functions
    const formatDateForSC = (date: Date): string => {
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    }

    const formatDateForGA = (date: Date): string => {
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    }

    const start = new Date(startDate)
    const end = new Date(endDate)

    // Fetch Search Console data if requested
    if (siteUrl && dataTypes?.some((t: string) => ['keywords', 'pages', 'countries', 'devices'].includes(t))) {
      try {
        const auth = new google.auth.OAuth2()
        auth.setCredentials({ access_token: accessToken })
        const searchConsole = google.searchconsole({ version: 'v1', auth })

        if (dataTypes.includes('keywords')) {
          const response = await searchConsole.searchanalytics.query({
            siteUrl,
            requestBody: {
              startDate: formatDateForSC(start),
              endDate: formatDateForSC(end),
              dimensions: ['query'],
              rowLimit: filters?.keyword ? 100 : 500,
            },
          })
          results.keywords = response.data.rows || []
        }

        if (dataTypes.includes('pages')) {
          const response = await searchConsole.searchanalytics.query({
            siteUrl,
            requestBody: {
              startDate: formatDateForSC(start),
              endDate: formatDateForSC(end),
              dimensions: ['page'],
              rowLimit: filters?.pageUrl ? 100 : 500,
            },
          })
          results.pages = response.data.rows || []
        }

        if (dataTypes.includes('countries')) {
          const response = await searchConsole.searchanalytics.query({
            siteUrl,
            requestBody: {
              startDate: formatDateForSC(start),
              endDate: formatDateForSC(end),
              dimensions: ['country'],
              rowLimit: 100,
            },
          })
          results.countries = response.data.rows || []
        }

        if (dataTypes.includes('devices')) {
          const response = await searchConsole.searchanalytics.query({
            siteUrl,
            requestBody: {
              startDate: formatDateForSC(start),
              endDate: formatDateForSC(end),
              dimensions: ['device'],
              rowLimit: 10,
            },
          })
          results.devices = response.data.rows || []
        }
      } catch (err) {
        console.error('Error fetching Search Console data:', err)
      }
    }

    // Fetch Analytics data if requested
    if (propertyId && dataTypes?.some((t: string) => ['events', 'sources', 'analytics_pages', 'analytics_countries', 'analytics_devices', 'browsers'].includes(t))) {
      try {
        if (dataTypes.includes('events')) {
          const response = await fetch(
            `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                dateRanges: [{
                  startDate: formatDateForGA(start),
                  endDate: formatDateForGA(end),
                }],
                dimensions: [{ name: 'eventName' }],
                metrics: [
                  { name: 'eventCount' },
                  { name: 'conversions' },
                  { name: 'totalUsers' },
                  { name: 'sessions' },
                ],
                limit: 200,
              }),
            }
          )
          if (response.ok) {
            results.events = await response.json()
          }
        }

        if (dataTypes.includes('analytics_pages')) {
          // Build dimension filter if pageUrl is specified
          let dimensionFilter: any = undefined
          if (filters?.pageUrl) {
            // Remove trailing slash and ensure it starts with /
            const pagePath = filters.pageUrl.replace(/\/$/, '') || '/'
            dimensionFilter = {
              filter: {
                fieldName: 'pagePath',
                stringFilter: {
                  matchType: 'EXACT',
                  value: pagePath,
                },
              },
            }
          }

          const requestBody: any = {
            dateRanges: [{
              startDate: formatDateForGA(start),
              endDate: formatDateForGA(end),
            }],
            dimensions: [{ name: 'pagePath' }],
            metrics: [
              { name: 'screenPageViews' },
              { name: 'activeUsers' },
              { name: 'sessions' },
              { name: 'eventCount' },
            ],
            limit: filters?.pageUrl ? 100 : 1000, // Get more data for site-wide queries
          }

          if (dimensionFilter) {
            requestBody.dimensionFilter = dimensionFilter
          }

          const response = await fetch(
            `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(requestBody),
            }
          )
          if (response.ok) {
            results.analytics_pages = await response.json()
          } else {
            const error = await response.text()
            console.error('Analytics pages fetch error:', error)
          }
        }

        if (dataTypes.includes('sources')) {
          const response = await fetch(
            `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                dateRanges: [{
                  startDate: formatDateForGA(start),
                  endDate: formatDateForGA(end),
                }],
                dimensions: [{ name: 'sessionSourceMedium' }],
                metrics: [
                  { name: 'sessions' },
                  { name: 'activeUsers' },
                  { name: 'eventCount' },
                  { name: 'conversions' },
                ],
                limit: 200,
              }),
            }
          )
          if (response.ok) {
            results.sources = await response.json()
          }
        }

        if (dataTypes.includes('analytics_countries')) {
          const response = await fetch(
            `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                dateRanges: [{
                  startDate: formatDateForGA(start),
                  endDate: formatDateForGA(end),
                }],
                dimensions: [{ name: 'country' }],
                metrics: [
                  { name: 'activeUsers' },
                  { name: 'sessions' },
                  { name: 'screenPageViews' },
                ],
                limit: 100,
              }),
            }
          )
          if (response.ok) {
            results.analytics_countries = await response.json()
          }
        }

        if (dataTypes.includes('analytics_devices')) {
          const response = await fetch(
            `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                dateRanges: [{
                  startDate: formatDateForGA(start),
                  endDate: formatDateForGA(end),
                }],
                dimensions: [{ name: 'deviceCategory' }],
                metrics: [
                  { name: 'activeUsers' },
                  { name: 'sessions' },
                  { name: 'screenPageViews' },
                ],
              }),
            }
          )
          if (response.ok) {
            results.analytics_devices = await response.json()
          }
        }

        if (dataTypes.includes('browsers')) {
          const response = await fetch(
            `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                dateRanges: [{
                  startDate: formatDateForGA(start),
                  endDate: formatDateForGA(end),
                }],
                dimensions: [{ name: 'browser' }],
                metrics: [
                  { name: 'activeUsers' },
                  { name: 'sessions' },
                ],
                limit: 50,
              }),
            }
          )
          if (response.ok) {
            results.browsers = await response.json()
          }
        }
      } catch (err) {
        console.error('Error fetching Analytics data:', err)
      }
    }

    return NextResponse.json(results, { status: 200 })
  } catch (error) {
    console.error('Error fetching specific data:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch specific data' },
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

