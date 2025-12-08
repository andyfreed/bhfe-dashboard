import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { google } from 'googleapis'
// Helper function to format date for GA4 API
function formatDateForGA(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

/**
 * Fetch ALL comprehensive data from Analytics and Search Console
 * This endpoint fetches maximum available historical data regardless of date range
 */
export async function POST(request: NextRequest) {
  try {
    const { propertyId, customerId, siteUrl } = await request.json()

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

    // Fetch ALL Search Console data (max 16 months of historical data)
    if (siteUrl) {
      try {
        const now = new Date()
        const maxStartDate = new Date(now.getFullYear(), now.getMonth() - 16, 1) // Search Console max is 16 months
        
        const auth = new google.auth.OAuth2()
        auth.setCredentials({ access_token: accessToken })
        const searchConsole = google.searchconsole({ version: 'v1', auth })

        const formatDateForSC = (date: Date): string => {
          return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
        }

        // Fetch top keywords (reduced to stay within token limits)
        const allKeywordsResponse = await searchConsole.searchanalytics.query({
          siteUrl,
          requestBody: {
            startDate: formatDateForSC(maxStartDate),
            endDate: formatDateForSC(now),
            dimensions: ['query'],
            rowLimit: 500, // Top 500 keywords
          },
        })

        // Fetch top pages
        const allPagesResponse = await searchConsole.searchanalytics.query({
          siteUrl,
          requestBody: {
            startDate: formatDateForSC(maxStartDate),
            endDate: formatDateForSC(now),
            dimensions: ['page'],
            rowLimit: 500, // Top 500 pages
          },
        })

        // Fetch top countries
        const allCountriesResponse = await searchConsole.searchanalytics.query({
          siteUrl,
          requestBody: {
            startDate: formatDateForSC(maxStartDate),
            endDate: formatDateForSC(now),
            dimensions: ['country'],
            rowLimit: 100, // Top 100 countries
          },
        })

        // Fetch ALL devices
        const allDevicesResponse = await searchConsole.searchanalytics.query({
          siteUrl,
          requestBody: {
            startDate: formatDateForSC(maxStartDate),
            endDate: formatDateForSC(now),
            dimensions: ['device'],
            rowLimit: 10,
          },
        })

        // Fetch date breakdown for trends
        const dateTrendResponse = await searchConsole.searchanalytics.query({
          siteUrl,
          requestBody: {
            startDate: formatDateForSC(maxStartDate),
            endDate: formatDateForSC(now),
            dimensions: ['date'],
          },
        })

        results.searchConsole = {
          keywords: allKeywordsResponse.data.rows || [],
          pages: allPagesResponse.data.rows || [],
          countries: allCountriesResponse.data.rows || [],
          devices: allDevicesResponse.data.rows || [],
          dateTrend: dateTrendResponse.data.rows || [],
          dateRange: {
            start: formatDateForSC(maxStartDate),
            end: formatDateForSC(now),
          },
        }
      } catch (err) {
        console.error('Error fetching comprehensive Search Console data:', err)
      }
    }

    // Fetch ALL Analytics data (as much as available)
    if (propertyId) {
      try {
        const now = new Date()
        const maxStartDate = new Date(now.getFullYear() - 2, 0, 1) // 2 years of data

        // Fetch ALL events
        const allEventsResponse = await fetch(
          `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              dateRanges: [{
                startDate: formatDateForGA(maxStartDate),
                endDate: formatDateForGA(now),
              }],
              dimensions: [{ name: 'eventName' }],
              metrics: [
                { name: 'eventCount' },
                { name: 'conversions' },
                { name: 'totalUsers' },
                { name: 'sessions' },
              ],
              limit: 500,
            }),
          }
        )

        // Fetch ALL pages
        const allPagesResponse = await fetch(
          `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              dateRanges: [{
                startDate: formatDateForGA(maxStartDate),
                endDate: formatDateForGA(now),
              }],
              dimensions: [{ name: 'pagePath' }],
              metrics: [
                { name: 'screenPageViews' },
                { name: 'activeUsers' },
                { name: 'sessions' },
                { name: 'eventCount' },
              ],
              limit: 500,
            }),
          }
        )

        // Fetch ALL traffic sources
        const allSourcesResponse = await fetch(
          `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              dateRanges: [{
                startDate: formatDateForGA(maxStartDate),
                endDate: formatDateForGA(now),
              }],
              dimensions: [{ name: 'sessionSourceMedium' }],
              metrics: [
                { name: 'sessions' },
                { name: 'activeUsers' },
                { name: 'eventCount' },
                { name: 'conversions' },
              ],
              limit: 500,
            }),
          }
        )

        // Fetch ALL countries
        const allCountriesResponse = await fetch(
          `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              dateRanges: [{
                startDate: formatDateForGA(maxStartDate),
                endDate: formatDateForGA(now),
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

        // Fetch ALL devices
        const allDevicesResponse = await fetch(
          `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              dateRanges: [{
                startDate: formatDateForGA(maxStartDate),
                endDate: formatDateForGA(now),
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

        // Fetch ALL browsers
        const allBrowsersResponse = await fetch(
          `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              dateRanges: [{
                startDate: formatDateForGA(maxStartDate),
                endDate: formatDateForGA(now),
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

        // Fetch date trend
        const dateTrendResponse = await fetch(
          `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              dateRanges: [{
                startDate: formatDateForGA(maxStartDate),
                endDate: formatDateForGA(now),
              }],
              dimensions: [{ name: 'date' }],
              metrics: [
                { name: 'activeUsers' },
                { name: 'sessions' },
                { name: 'screenPageViews' },
                { name: 'eventCount' },
              ],
            }),
          }
        )

        results.analytics = {
          events: allEventsResponse.ok ? await allEventsResponse.json() : null,
          pages: allPagesResponse.ok ? await allPagesResponse.json() : null,
          sources: allSourcesResponse.ok ? await allSourcesResponse.json() : null,
          countries: allCountriesResponse.ok ? await allCountriesResponse.json() : null,
          devices: allDevicesResponse.ok ? await allDevicesResponse.json() : null,
          browsers: allBrowsersResponse.ok ? await allBrowsersResponse.json() : null,
          dateTrend: dateTrendResponse.ok ? await dateTrendResponse.json() : null,
          dateRange: {
            start: formatDateForGA(maxStartDate),
            end: formatDateForGA(now),
          },
        }
      } catch (err) {
        console.error('Error fetching comprehensive Analytics data:', err)
      }
    }

    return NextResponse.json(results, { status: 200 })
  } catch (error) {
    console.error('Error fetching comprehensive data:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch comprehensive data' },
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

