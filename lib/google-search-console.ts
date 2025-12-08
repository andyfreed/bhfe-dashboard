import { google } from 'googleapis'
import { calculatePercentChange } from './utils/metrics'

/**
 * Google Search Console API integration
 */

export interface SearchConsoleMetrics {
  clicks: number
  impressions: number
  ctr: number
  position: number
}

export interface SearchConsoleKeyword {
  query: string
  clicks: number
  impressions: number
  ctr: number
  position: number
}

/**
 * Fetch Search Console data
 */
export async function fetchSearchConsoleData(
  siteUrl: string,
  startDate: string,
  endDate: string,
  accessToken: string
): Promise<{
  current: SearchConsoleMetrics
  previous: SearchConsoleMetrics
  changes: {
    clicks: number
    impressions: number
    ctr: number
    position: number
  }
  keywords: {
    current: SearchConsoleKeyword[]
    previous: SearchConsoleKeyword[]
  }
}> {
  const auth = new google.auth.OAuth2()
  auth.setCredentials({ access_token: accessToken })

  const searchConsole = google.searchconsole({ version: 'v1', auth })

  // Calculate previous period
  const currentStart = new Date(startDate)
  const currentEnd = new Date(endDate)
  const prevStart = new Date(currentStart)
  const prevEnd = new Date(currentEnd)
  prevStart.setFullYear(currentStart.getFullYear() - 1)
  prevEnd.setFullYear(currentEnd.getFullYear() - 1)

  // Fetch current period data
  const currentResponse = await searchConsole.searchanalytics.query({
    siteUrl,
    requestBody: {
      startDate: formatDateForSC(currentStart),
      endDate: formatDateForSC(currentEnd),
      dimensions: ['date'],
    },
  })

  // Fetch previous period data
  const previousResponse = await searchConsole.searchanalytics.query({
    siteUrl,
    requestBody: {
      startDate: formatDateForSC(prevStart),
      endDate: formatDateForSC(prevEnd),
      dimensions: ['date'],
    },
  })

  const current = aggregateSearchConsoleMetrics(currentResponse.data.rows || [])
  const previous = aggregateSearchConsoleMetrics(previousResponse.data.rows || [])

  // Fetch keyword/query data for current period
  const currentKeywordsResponse = await searchConsole.searchanalytics.query({
    siteUrl,
    requestBody: {
      startDate: formatDateForSC(currentStart),
      endDate: formatDateForSC(currentEnd),
      dimensions: ['query'],
      rowLimit: 100, // Get top 100 keywords
      orderBys: [
        {
          dimension: 'query',
          sortOrder: 'DESCENDING',
        },
        {
          metric: {
            metric: 'CLICKS',
          },
          sortOrder: 'DESCENDING',
        },
      ],
    },
  })

  // Fetch keyword/query data for previous period
  const previousKeywordsResponse = await searchConsole.searchanalytics.query({
    siteUrl,
    requestBody: {
      startDate: formatDateForSC(prevStart),
      endDate: formatDateForSC(prevEnd),
      dimensions: ['query'],
      rowLimit: 100, // Get top 100 keywords
      orderBys: [
        {
          dimension: 'query',
          sortOrder: 'DESCENDING',
        },
        {
          metric: {
            metric: 'CLICKS',
          },
          sortOrder: 'DESCENDING',
        },
      ],
    },
  })

  const currentKeywords = processKeywordData(currentKeywordsResponse.data.rows || [])
  const previousKeywords = processKeywordData(previousKeywordsResponse.data.rows || [])

  return {
    current,
    previous,
    changes: {
      clicks: calculatePercentChange(current.clicks, previous.clicks),
      impressions: calculatePercentChange(current.impressions, previous.impressions),
      ctr: calculatePercentChange(current.ctr, previous.ctr),
      position: calculatePercentChange(current.position, previous.position),
    },
    keywords: {
      current: currentKeywords,
      previous: previousKeywords,
    },
  }
}

function formatDateForSC(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function aggregateSearchConsoleMetrics(rows: any[]): SearchConsoleMetrics {
  let totalClicks = 0
  let totalImpressions = 0
  let totalPosition = 0
  let rowCount = 0

  rows.forEach((row: any) => {
    totalClicks += row.clicks || 0
    totalImpressions += row.impressions || 0
    totalPosition += row.position || 0
    rowCount++
  })

  return {
    clicks: totalClicks,
    impressions: totalImpressions,
    ctr: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0,
    position: rowCount > 0 ? totalPosition / rowCount : 0,
  }
}

function processKeywordData(rows: any[]): SearchConsoleKeyword[] {
  return rows.map((row: any) => ({
    query: row.keys?.[0] || '',
    clicks: row.clicks || 0,
    impressions: row.impressions || 0,
    ctr: row.impressions > 0 ? (row.clicks / row.impressions) * 100 : 0,
    position: row.position || 0,
  })).sort((a, b) => b.clicks - a.clicks) // Sort by clicks descending
}


