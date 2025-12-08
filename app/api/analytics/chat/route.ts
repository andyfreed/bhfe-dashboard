import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * OpenAI chat endpoint for analytics questions
 * Receives metrics data and user questions, returns AI-generated answers
 */
export async function POST(request: NextRequest) {
  try {
    const { messages, metrics } = await request.json()

    // Get OpenAI API key from environment
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    // Authenticate user
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Build system prompt with metrics context
    const systemPrompt = `You are an analytics assistant helping users understand their Google Analytics, Google Ads, and Google Search Console data.

Current metrics data:
${JSON.stringify(metrics, null, 2)}

Your role:
- Answer questions about the analytics data provided, including specific keywords from Search Console
- Explain trends, changes, and insights
- Compare metrics across different time periods
- Provide actionable recommendations based on the data
- Be concise but thorough
- If data is missing for a specific metric, acknowledge it and explain what would be needed

COMPREHENSIVE DATA ACCESS:

Google Search Console Data (metrics.searchConsole):
- keywords.current / keywords.previous: Top 100 search queries/keywords with clicks, impressions, CTR, position
- pages.current / pages.previous: Top 100 pages with clicks, impressions, CTR, position
- countries.current / countries.previous: Top 50 countries with clicks, impressions, CTR, position
- devices.current / devices.previous: Device breakdown (desktop/mobile/tablet) with clicks, impressions, CTR, position

Google Analytics Data (metrics.analytics):
- data: Event data with eventName dimension, including eventCount, conversions, totalUsers, sessions
- pages: Top 100 pages (pagePath dimension) with screenPageViews, activeUsers, sessions, eventCount for current/previous periods
- sources: Traffic sources (sessionSourceMedium dimension) with sessions, activeUsers, eventCount, conversions for current/previous periods
- countries: Top 50 countries with activeUsers, sessions, screenPageViews for current/previous periods
- devices: Device categories (deviceCategory dimension) with activeUsers, sessions, screenPageViews for current/previous periods
- browsers: Top 20 browsers with activeUsers, sessions for current/previous periods

You can answer questions about:
- Top performing keywords, pages, countries, devices
- Traffic sources and where visitors come from
- User behavior by device type or browser
- Geographic distribution of traffic
- Page performance and most viewed content
- Search query performance and trends
- Any combination of these dimensions

When comparing periods, note that "current" refers to the selected date range, and "previous" refers to the same period one year earlier, unless otherwise specified.

Format your responses clearly with bullet points or numbered lists when appropriate.`

    // Prepare messages for OpenAI
    const openAIMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.map((msg: any) => ({
        role: msg.role,
        content: msg.content,
      })),
    ]

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Using gpt-4o-mini for cost efficiency
        messages: openAIMessages,
        temperature: 0.7,
        max_tokens: 1000,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
      console.error('OpenAI API error:', errorData)
      return NextResponse.json(
        { error: errorData.error?.message || 'Failed to get AI response' },
        { status: response.status }
      )
    }

    const data = await response.json()
    const aiMessage = data.choices[0]?.message?.content || 'Sorry, I could not generate a response.'

    return NextResponse.json(
      { message: aiMessage },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in analytics chat:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process chat request' },
      { status: 500 }
    )
  }
}

