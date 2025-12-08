import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Fetch Google Ads data using Google Ads API
 * Note: Requires developer token configured in environment variables
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const customerId = searchParams.get('customer_id')
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')

    if (!customerId || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Missing required parameters: customer_id, start_date, end_date' },
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
    const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN

    if (!developerToken) {
      return NextResponse.json(
        { error: 'Google Ads Developer Token not configured' },
        { status: 500 }
      )
    }

    // Refresh token if needed
    let accessToken = tokens.access_token
    if (Date.now() >= tokens.expires_at) {
      accessToken = await refreshGoogleToken(tokens.refresh_token)
    }

    // Format customer ID for Google Ads API
    // Google Ads API expects customer ID without dashes, exactly 10 digits
    const cleanCustomerId = customerId.replace(/-/g, '')
    
    // Validate customer ID format (must be exactly 10 digits)
    if (!/^\d{10}$/.test(cleanCustomerId)) {
      return NextResponse.json(
        { error: `Invalid Customer ID format. Expected 10 digits, got: ${customerId} (${cleanCustomerId.length} digits after removing dashes)` },
        { status: 400 }
      )
    }
    
    console.log('[Ads API] Using customer ID:', {
      original: customerId,
      cleaned: cleanCustomerId,
      formatted: `${cleanCustomerId.slice(0, 3)}-${cleanCustomerId.slice(3, 6)}-${cleanCustomerId.slice(6)}`,
    })

    // Calculate previous period (same length, one year before)
    const currentStart = new Date(startDate)
    const currentEnd = new Date(endDate)
    const prevStart = new Date(currentStart)
    const prevEnd = new Date(currentEnd)
    prevStart.setFullYear(currentStart.getFullYear() - 1)
    prevEnd.setFullYear(currentEnd.getFullYear() - 1)

    const formatDateForAds = (date: Date): string => {
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    }

    // Fetch current period data
    // Note: Google Ads API requires customer ID in format: customers/{customer_id}
    const query = `
      SELECT
        metrics.cost_micros,
        metrics.clicks,
        metrics.impressions,
        metrics.all_conversions,
        metrics.all_conversions_value,
        metrics.cost_per_all_conversions,
        segments.date
      FROM campaign
      WHERE segments.date >= '${formatDateForAds(currentStart)}' 
        AND segments.date <= '${formatDateForAds(currentEnd)}'
    `.trim()

    console.log('[Ads API] Fetching current period data:', {
      customerId: cleanCustomerId,
      dateRange: `${formatDateForAds(currentStart)} to ${formatDateForAds(currentEnd)}`,
      queryLength: query.length,
    })

    // Google Ads API endpoint format
    // Try different API versions - v17 is the latest stable as of Dec 2024
    // Also note: user suggested alternative customer ID: 720-967-8421
    const apiVersions = ['v17', 'v18', 'v16'] // Try v17 first (latest stable)
    
    console.log('[Ads API] Attempting request with customer ID:', cleanCustomerId)
    
    // Build endpoint URL - try v17 first
    const apiVersion = apiVersions[0]
    const endpointUrl = `https://googleads.googleapis.com/${apiVersion}/customers/${cleanCustomerId}:searchStream`
    
    // Note: Using :searchStream instead of :search - searchStream is the preferred method
    // If that doesn't work, we'll fall back to :search
    console.log('[Ads API] Request URL:', endpointUrl)
    
    let currentResponse = await fetch(endpointUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'developer-token': developerToken,
        'Content-Type': 'application/json',
        // 'login-customer-id' header is only needed for MCC accounts, may cause issues if not MCC
      },
      body: JSON.stringify({
        query,
      }),
    })

    // Fetch previous period data
    const previousQuery = `
      SELECT
        metrics.cost_micros,
        metrics.clicks,
        metrics.impressions,
        metrics.all_conversions,
        metrics.all_conversions_value,
        metrics.cost_per_all_conversions,
        segments.date
      FROM campaign
      WHERE segments.date >= '${formatDateForAds(prevStart)}' 
        AND segments.date <= '${formatDateForAds(prevEnd)}'
    `.trim()
    
    const previousResponse = await fetch(endpointUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'developer-token': developerToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: previousQuery,
      }),
    })

    if (!currentResponse.ok) {
      const errorText = await currentResponse.text()
      let errorData: any
      try {
        errorData = JSON.parse(errorText)
      } catch {
        errorData = { error: errorText || currentResponse.statusText }
      }
      
      // Extract detailed error information
      const errorMessage = errorData.error?.message || 
                          errorData.error?.status || 
                          errorData.error || 
                          errorText ||
                          'Failed to fetch Google Ads data'
      
      const errorDetails = errorData.error || errorData
      
      console.error('[Ads API] Error response:', {
        status: currentResponse.status,
        statusText: currentResponse.statusText,
        customerId: cleanCustomerId,
        error: errorDetails,
        fullResponse: errorText.substring(0, 500), // First 500 chars
      })
      
      return NextResponse.json(
        { 
          error: errorMessage, 
          details: errorDetails,
          customerId: cleanCustomerId, // Include for debugging
          status: currentResponse.status,
        },
        { status: currentResponse.status }
      )
    }

    if (!previousResponse.ok) {
      const errorText = await previousResponse.text()
      let errorData: any
      try {
        errorData = JSON.parse(errorText)
      } catch {
        errorData = { error: errorText || previousResponse.statusText }
      }
      
      const errorMessage = errorData.error?.message || errorData.error?.status || errorData.error || 'Failed to fetch Google Ads data'
      const errorDetails = errorData.error || errorData
      
      console.error('[Ads API] Error response (previous period):', {
        status: previousResponse.status,
        statusText: previousResponse.statusText,
        customerId: cleanCustomerId,
        error: errorDetails,
        fullResponse: errorText.substring(0, 500),
      })
      
      return NextResponse.json(
        { 
          error: errorMessage, 
          details: errorDetails,
          customerId: cleanCustomerId,
          status: previousResponse.status,
        },
        { status: previousResponse.status }
      )
    }

    const currentData = await currentResponse.json().catch(async () => {
      const text = await currentResponse.text()
      throw new Error(`Failed to parse current period response: ${text}`)
    })
    const previousData = await previousResponse.json().catch(async () => {
      const text = await previousResponse.text()
      throw new Error(`Failed to parse previous period response: ${text}`)
    })

    // Aggregate metrics from results
    const aggregateMetrics = (results: any[]) => {
      let totalCost = 0
      let totalClicks = 0
      let totalImpressions = 0
      let totalConversions = 0
      let totalConversionValue = 0

      if (!results || results.length === 0) {
        // Return zeros if no data
        return {
          spend: 0,
          clicks: 0,
          impressions: 0,
          avgCpc: 0,
          avgCtr: 0,
          conversions: 0,
          costPerConversion: 0,
          conversionValue: 0,
          roas: 0,
        }
      }

      results.forEach((row: any) => {
        // Google Ads API returns data in this structure
        // The response structure varies - try different possible structures
        const metrics = row.metrics || row.campaign?.metrics || {}
        totalCost += parseFloat(metrics.costMicros || metrics.cost_micros || 0) / 1000000 // Convert micros to dollars
        totalClicks += parseFloat(metrics.clicks || 0)
        totalImpressions += parseFloat(metrics.impressions || 0)
        totalConversions += parseFloat(metrics.allConversions || metrics.all_conversions || 0)
        totalConversionValue += parseFloat(metrics.allConversionsValue || metrics.all_conversions_value || 0)
      })

      const avgCpc = totalClicks > 0 ? totalCost / totalClicks : 0
      const avgCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0
      const costPerConversion = totalConversions > 0 ? totalCost / totalConversions : 0
      const roas = totalCost > 0 ? totalConversionValue / totalCost : 0

      return {
        spend: totalCost,
        clicks: totalClicks,
        impressions: totalImpressions,
        avgCpc,
        avgCtr,
        conversions: totalConversions,
        costPerConversion,
        conversionValue: totalConversionValue,
        roas,
      }
    }

    const current = aggregateMetrics(currentData.results || [])
    const previous = aggregateMetrics(previousData.results || [])

    // Fetch conversion breakdown by conversion action
    // This requires separate queries for current and previous periods
    const conversionBreakdown = { current: {} as any, previous: {} as any }

    try {
      // Fetch current period conversion breakdown
      const currentConvResponse = await fetch(endpointUrl,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'developer-token': developerToken,
            'Content-Type': 'application/json',
            'login-customer-id': cleanCustomerId,
          },
          body: JSON.stringify({
            query: `
              SELECT
                conversion_action.name,
                metrics.all_conversions
              FROM conversion_action
              WHERE segments.date >= '${formatDateForAds(currentStart)}' 
                AND segments.date <= '${formatDateForAds(currentEnd)}'
            `.trim(),
          }),
        }
      )

      if (currentConvResponse.ok) {
        const convData = await currentConvResponse.json()
        convData.results?.forEach((row: any) => {
          const actionName = row.conversionAction?.name?.toLowerCase().replace(/[^a-z0-9]/g, '_') || ''
          const conversions = parseFloat(row.metrics?.allConversions || 0)
          
          // Map common conversion action names
          if (actionName.includes('add_to_cart') || actionName.includes('addtocart')) {
            conversionBreakdown.current.add_to_cart = (conversionBreakdown.current.add_to_cart || 0) + conversions
          } else if (actionName.includes('begin_checkout') || actionName.includes('begincheckout')) {
            conversionBreakdown.current.begin_checkout = (conversionBreakdown.current.begin_checkout || 0) + conversions
          } else if (actionName.includes('purchase')) {
            conversionBreakdown.current.purchase = (conversionBreakdown.current.purchase || 0) + conversions
          } else if (actionName.includes('contact') || actionName.includes('form_submit_contact')) {
            conversionBreakdown.current.form_submit_contact = (conversionBreakdown.current.form_submit_contact || 0) + conversions
          } else if (actionName.includes('login')) {
            conversionBreakdown.current.form_submit_login = (conversionBreakdown.current.form_submit_login || 0) + conversions
          } else if (actionName.includes('registration') || actionName.includes('register')) {
            conversionBreakdown.current.form_submit_new_registration = (conversionBreakdown.current.form_submit_new_registration || 0) + conversions
          }
        })
      }

      // Fetch previous period conversion breakdown
      const prevConvResponse = await fetch(endpointUrl,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'developer-token': developerToken,
            'Content-Type': 'application/json',
            'login-customer-id': cleanCustomerId,
          },
          body: JSON.stringify({
            query: `
              SELECT
                conversion_action.name,
                metrics.all_conversions
              FROM conversion_action
              WHERE segments.date >= '${formatDateForAds(prevStart)}' 
                AND segments.date <= '${formatDateForAds(prevEnd)}'
            `.trim(),
          }),
        }
      )

      if (prevConvResponse.ok) {
        const convData = await prevConvResponse.json()
        convData.results?.forEach((row: any) => {
          const actionName = row.conversionAction?.name?.toLowerCase().replace(/[^a-z0-9]/g, '_') || ''
          const conversions = parseFloat(row.metrics?.allConversions || 0)
          
          // Map common conversion action names
          if (actionName.includes('add_to_cart') || actionName.includes('addtocart')) {
            conversionBreakdown.previous.add_to_cart = (conversionBreakdown.previous.add_to_cart || 0) + conversions
          } else if (actionName.includes('begin_checkout') || actionName.includes('begincheckout')) {
            conversionBreakdown.previous.begin_checkout = (conversionBreakdown.previous.begin_checkout || 0) + conversions
          } else if (actionName.includes('purchase')) {
            conversionBreakdown.previous.purchase = (conversionBreakdown.previous.purchase || 0) + conversions
          } else if (actionName.includes('contact') || actionName.includes('form_submit_contact')) {
            conversionBreakdown.previous.form_submit_contact = (conversionBreakdown.previous.form_submit_contact || 0) + conversions
          } else if (actionName.includes('login')) {
            conversionBreakdown.previous.form_submit_login = (conversionBreakdown.previous.form_submit_login || 0) + conversions
          } else if (actionName.includes('registration') || actionName.includes('register')) {
            conversionBreakdown.previous.form_submit_new_registration = (conversionBreakdown.previous.form_submit_new_registration || 0) + conversions
          }
        })
      }
    } catch (err) {
      console.error('Error fetching conversion breakdown:', err)
      // Continue without breakdown if it fails
    }

    // Ensure all conversion types are present with defaults
    const conversionsBreakdown = {
      add_to_cart: { current: conversionBreakdown.current.add_to_cart || 0, previous: conversionBreakdown.previous.add_to_cart || 0 },
      begin_checkout: { current: conversionBreakdown.current.begin_checkout || 0, previous: conversionBreakdown.previous.begin_checkout || 0 },
      purchase: { current: conversionBreakdown.current.purchase || 0, previous: conversionBreakdown.previous.purchase || 0 },
      form_submit_contact: { current: conversionBreakdown.current.form_submit_contact || 0, previous: conversionBreakdown.previous.form_submit_contact || 0 },
      form_submit_login: { current: conversionBreakdown.current.form_submit_login || 0, previous: conversionBreakdown.previous.form_submit_login || 0 },
      form_submit_new_registration: { current: conversionBreakdown.current.form_submit_new_registration || 0, previous: conversionBreakdown.previous.form_submit_new_registration || 0 },
    }

    // Calculate percentage changes
    const calculateChange = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0
      return ((current - previous) / previous) * 100
    }

    return NextResponse.json({
      current: {
        ...current,
        conversionsBreakdown,
      },
      previous: {
        ...previous,
        conversionsBreakdown,
      },
      changes: {
        spend: calculateChange(current.spend, previous.spend),
        clicks: calculateChange(current.clicks, previous.clicks),
        impressions: calculateChange(current.impressions, previous.impressions),
        avgCpc: calculateChange(current.avgCpc, previous.avgCpc),
        avgCtr: calculateChange(current.avgCtr, previous.avgCtr),
        conversions: calculateChange(current.conversions, previous.conversions),
        costPerConversion: calculateChange(current.costPerConversion, previous.costPerConversion),
        conversionValue: calculateChange(current.conversionValue, previous.conversionValue),
        roas: calculateChange(current.roas, previous.roas),
      },
    }, { status: 200 })
  } catch (error) {
    console.error('Error fetching Ads data:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch Ads data' },
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
