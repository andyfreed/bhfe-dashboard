import { BetaAnalyticsDataClient } from '@google-analytics/data'

/**
 * Initialize Google Analytics Data API client
 */
export function getAnalyticsClient(accessToken?: string) {
  // For OAuth flow, pass access token
  if (accessToken) {
    // The BetaAnalyticsDataClient doesn't directly support OAuth tokens
    // We'll need to use the REST API directly or configure it differently
    // For now, we'll use the REST API approach
    return accessToken as any // Will be handled differently in the API route
  }

  // Try service account if available
  const credentials = process.env.GOOGLE_APPLICATION_CREDENTIALS
  if (credentials) {
    return new BetaAnalyticsDataClient({
      keyFilename: credentials,
    })
  }

  throw new Error('Google Analytics credentials not configured. Need access token or service account.')
}

/**
 * Get date range for comparison reports
 */
export function getDateRanges(startDate: string, endDate: string) {
  // Parse the dates
  const start = new Date(startDate)
  const end = new Date(endDate)
  
  // Calculate previous period (same length, one year/month before)
  const yearDiff = end.getFullYear() - start.getFullYear()
  const monthDiff = end.getMonth() - start.getMonth()
  
  let prevStart = new Date(start)
  let prevEnd = new Date(end)
  
  // Subtract one year
  prevStart.setFullYear(start.getFullYear() - 1)
  prevEnd.setFullYear(end.getFullYear() - 1)
  
  return {
    current: {
      startDate: formatDateForGA(start),
      endDate: formatDateForGA(end),
    },
    previous: {
      startDate: formatDateForGA(prevStart),
      endDate: formatDateForGA(prevEnd),
    },
  }
}

function formatDateForGA(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

/**
 * Fetch Analytics data with comparison
 */
export async function fetchAnalyticsData(
  propertyId: string,
  startDate: string,
  endDate: string,
  accessToken: string
) {
  const client = getAnalyticsClient(accessToken)
  const dateRanges = getDateRanges(startDate, endDate)
  
  const [response] = await client.runReport({
    property: `properties/${propertyId}`,
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
    dimensions: [
      { name: 'eventName' },
    ],
    metrics: [
      { name: 'eventCount' },
      { name: 'conversions' },
    ],
  })

  return response
}

