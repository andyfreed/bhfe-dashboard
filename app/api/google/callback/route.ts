import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * OAuth callback handler - exchanges code for tokens
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  if (error) {
    return NextResponse.redirect(
      `${request.nextUrl.origin}/dashboard/analytics?error=${encodeURIComponent(error)}`
    )
  }

  if (!code) {
    return NextResponse.redirect(
      `${request.nextUrl.origin}/dashboard/analytics?error=no_code`
    )
  }

  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  const redirectUri = `${request.nextUrl.origin}/api/google/callback`

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(
      `${request.nextUrl.origin}/dashboard/analytics?error=config`
    )
  }

  // Exchange code for tokens
  try {
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    })

    const tokens = await tokenResponse.json()

    if (tokens.error) {
      return NextResponse.redirect(
        `${request.nextUrl.origin}/dashboard/analytics?error=${encodeURIComponent(tokens.error)}`
      )
    }

    // Store tokens in database (associated with user)
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.redirect(
        `${request.nextUrl.origin}/dashboard/analytics?error=not_authenticated`
      )
    }

    // Store tokens in app_settings or a new google_tokens table
    // For now, we'll store in app_settings as JSON
    await supabase
      .from('app_settings')
      .upsert({
        key: `google_tokens_${user.id}`,
        value: JSON.stringify({
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expires_at: Date.now() + (tokens.expires_in * 1000),
        }),
        description: 'Google API OAuth tokens',
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'key',
      })

    return NextResponse.redirect(
      `${request.nextUrl.origin}/dashboard/analytics?success=true`
    )
  } catch (error) {
    console.error('Error exchanging OAuth code:', error)
    return NextResponse.redirect(
      `${request.nextUrl.origin}/dashboard/analytics?error=exchange_failed`
    )
  }
}

