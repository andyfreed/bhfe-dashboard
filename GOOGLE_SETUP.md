# Google Analytics, Ads & Search Console Setup

This guide explains how to set up Google APIs for the analytics dashboard.

## Prerequisites

1. Google Cloud Project created (✅ Done: `bhfe-dashboard-link`)
2. APIs enabled:
   - Google Analytics Data API (GA4)
   - Google Ads API
   - Google Search Console API

## Environment Variables

Add these to your `.env.local` file (and Vercel):

```env
# Google OAuth Credentials (get from Google Cloud Console)
GOOGLE_CLIENT_ID=your-client-id-here
GOOGLE_CLIENT_SECRET=your-client-secret-here

# Google Ads Developer Token (required for Ads API)
# Get from: https://ads.google.com/aw/apicenter
GOOGLE_ADS_DEVELOPER_TOKEN=your-developer-token-here

# Optional: If using service account instead of OAuth
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json
```

## OAuth Setup

1. **Configure OAuth Consent Screen:**
   - Go to: https://console.cloud.google.com/apis/credentials/consent?project=bhfe-dashboard-link
   - Configure the consent screen (User Type: Internal or External)
   - Add scopes:
     - `https://www.googleapis.com/auth/analytics.readonly`
     - `https://www.googleapis.com/auth/adwords`
     - `https://www.googleapis.com/auth/webmasters.readonly`

2. **Add Authorized Redirect URIs:**
   - In OAuth 2.0 Client settings, add:
     - `http://localhost:3000/api/google/callback` (for local dev)
     - `https://your-production-domain.com/api/google/callback` (for production)

## Google Ads API Additional Setup

The Google Ads API requires additional setup:
1. **Developer Token**: 
   - Get from: https://ads.google.com/aw/apicenter
   - Add to environment variables as `GOOGLE_ADS_DEVELOPER_TOKEN`
2. **Customer ID**: Your 10-digit Google Ads account ID (format: XXX-XXX-XXXX or just 10 digits)
   - Configure in the Analytics dashboard settings
3. **Test Account**: Recommended for development to avoid affecting live campaigns

## Usage

1. Navigate to `/dashboard/analytics`
2. Click "Connect Google Account"
3. Authorize the requested permissions
4. Once connected, you can fetch data from Analytics, Ads, and Search Console

## Data Storage

- OAuth tokens are stored in `app_settings` table with key `google_tokens_{user_id}`
- Tokens are automatically refreshed when expired
- Each user can connect their own Google account

