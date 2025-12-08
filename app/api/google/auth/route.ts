import { NextRequest, NextResponse } from 'next/server'

/**
 * OAuth 2.0 authentication flow for Google APIs
 * This initiates the OAuth flow to get user consent
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const redirectUri = searchParams.get('redirect_uri') || `${request.nextUrl.origin}/api/google/callback`
  
  const clientId = process.env.GOOGLE_CLIENT_ID
  const scopes = [
    'https://www.googleapis.com/auth/analytics.readonly',
    'https://www.googleapis.com/auth/adwords',
    'https://www.googleapis.com/auth/webmasters.readonly',
  ].join(' ')

  if (!clientId) {
    return NextResponse.json(
      { error: 'Google Client ID not configured' },
      { status: 500 }
    )
  }

  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
  authUrl.searchParams.set('client_id', clientId)
  authUrl.searchParams.set('redirect_uri', redirectUri)
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('scope', scopes)
  authUrl.searchParams.set('access_type', 'offline')
  authUrl.searchParams.set('prompt', 'consent')

  return NextResponse.redirect(authUrl.toString())
}

