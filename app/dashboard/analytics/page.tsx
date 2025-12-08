'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  MousePointerClick, 
  Eye, 
  Users, 
  ShoppingCart,
  CheckCircle,
  Link as LinkIcon,
  RefreshCw,
  Settings,
  AlertCircle
} from 'lucide-react'
import { formatPercentChange, calculatePercentChange } from '@/lib/utils/metrics'

interface MetricsCardProps {
  title: string
  current: number
  previous: number
  format?: (value: number) => string
  icon?: React.ReactNode
  positiveIsGood?: boolean
}

function MetricsCard({ title, current, previous, format, icon, positiveIsGood = true }: MetricsCardProps) {
  const change = calculatePercentChange(current, previous)
  const isPositive = change >= 0
  const isGood = positiveIsGood ? isPositive : !isPositive
  
  const formatValue = format || ((v: number) => v.toLocaleString())
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-gray-700">{title}</CardTitle>
          {icon && <div className="text-gray-400">{icon}</div>}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          <div className="text-2xl font-bold text-gray-900">{formatValue(current)}</div>
          <div className="flex items-center gap-2 text-sm">
            {isGood ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
            <span className={isGood ? 'text-green-600' : 'text-red-600'}>
              {formatPercentChange(change)}
            </span>
            <span className="text-gray-500">vs previous period</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function AnalyticsPage() {
  const [isConnected, setIsConnected] = useState(false)
  const [loading, setLoading] = useState(true)
  const [fetching, setFetching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: '',
  })
  const [metrics, setMetrics] = useState<any>(null)
  const [config, setConfig] = useState({
    propertyId: '',
    customerId: '',
    siteUrl: 'https://www.bhfe.com',
  })
  const [showConfig, setShowConfig] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    checkConnection()
    loadConfig()
    // Set default date range to current month
    const now = new Date()
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    setDateRange({
      startDate: formatDateInput(firstDay),
      endDate: formatDateInput(lastDay),
    })
  }, [])

  const formatDateInput = (date: Date): string => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  }

  const checkConnection = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }

    const { data } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', `google_tokens_${user.id}`)
      .single()

    setIsConnected(!!data)
    setLoading(false)
  }

  const loadConfig = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Load saved config from app_settings
    const { data: settingsData } = await supabase
      .from('app_settings')
      .select('key, value')
      .in('key', ['google_analytics_property_id', 'google_ads_customer_id', 'google_search_console_site_url'])

    if (settingsData) {
      settingsData.forEach((setting) => {
        if (setting.key === 'google_analytics_property_id') {
          setConfig(prev => ({ ...prev, propertyId: setting.value || '' }))
        } else if (setting.key === 'google_ads_customer_id') {
          setConfig(prev => ({ ...prev, customerId: setting.value || '' }))
        } else if (setting.key === 'google_search_console_site_url') {
          setConfig(prev => ({ ...prev, siteUrl: setting.value || 'https://www.bhfe.com' }))
        }
      })
    }
  }

  const saveConfig = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const settingsToSave = [
      {
        key: 'google_analytics_property_id',
        value: config.propertyId.trim(),
        description: 'Google Analytics 4 Property ID',
        updated_at: new Date().toISOString(),
      },
      {
        key: 'google_ads_customer_id',
        value: config.customerId.trim(),
        description: 'Google Ads Customer ID (10 digits)',
        updated_at: new Date().toISOString(),
      },
      {
        key: 'google_search_console_site_url',
        value: config.siteUrl.trim(),
        description: 'Google Search Console Site URL',
        updated_at: new Date().toISOString(),
      },
    ]

    await supabase
      .from('app_settings')
      .upsert(settingsToSave, {
        onConflict: 'key',
      })

    setShowConfig(false)
  }

  const handleConnect = () => {
    window.location.href = '/api/google/auth'
  }

  const handleFetchData = async () => {
    setFetching(true)
    setError(null)

    try {
      const results: any = {}

      // Fetch Google Ads data if customer ID is configured
      if (config.customerId) {
        try {
          const adsParams = new URLSearchParams({
            customer_id: config.customerId,
            start_date: dateRange.startDate,
            end_date: dateRange.endDate,
          })
          const adsResponse = await fetch(`/api/google/ads?${adsParams.toString()}`)
          if (adsResponse.ok) {
            const adsData = await adsResponse.json()
            results.ads = {
              spend: { current: adsData.current.spend, previous: adsData.previous.spend },
              clicks: { current: adsData.current.clicks, previous: adsData.previous.clicks },
              impressions: { current: adsData.current.impressions, previous: adsData.previous.impressions },
              avgCpc: { current: adsData.current.avgCpc, previous: adsData.previous.avgCpc },
              avgCtr: { current: adsData.current.avgCtr, previous: adsData.previous.avgCtr },
              conversions: { current: adsData.current.conversions, previous: adsData.previous.conversions },
              costPerConversion: { current: adsData.current.costPerConversion, previous: adsData.previous.costPerConversion },
              conversionValue: { current: adsData.current.conversionValue, previous: adsData.previous.conversionValue },
              roas: { current: adsData.current.roas, previous: adsData.previous.roas },
              conversionsBreakdown: {
                add_to_cart: { current: adsData.current.conversionsBreakdown.add_to_cart, previous: adsData.previous.conversionsBreakdown.add_to_cart },
                begin_checkout: { current: adsData.current.conversionsBreakdown.begin_checkout, previous: adsData.previous.conversionsBreakdown.begin_checkout },
                purchase: { current: adsData.current.conversionsBreakdown.purchase, previous: adsData.previous.conversionsBreakdown.purchase },
                form_submit_contact: { current: adsData.current.conversionsBreakdown.form_submit_contact, previous: adsData.previous.conversionsBreakdown.form_submit_contact },
                form_submit_login: { current: adsData.current.conversionsBreakdown.form_submit_login, previous: adsData.previous.conversionsBreakdown.form_submit_login },
                form_submit_new_registration: { current: adsData.current.conversionsBreakdown.form_submit_new_registration, previous: adsData.previous.conversionsBreakdown.form_submit_new_registration },
              },
            }
          } else {
            const errorData = await adsResponse.json().catch(() => ({ error: 'Failed to fetch Ads data' }))
            console.error('Ads API error:', errorData)
            // Show error but don't crash - continue with other data sources
            if (!error) {
              setError(`Ads API: ${errorData.error || 'Failed to fetch data'}. Other services will still load.`)
            }
          }
        } catch (err) {
          console.error('Error fetching Ads data:', err)
          if (!error) {
            setError(`Ads API error: ${err instanceof Error ? err.message : 'Failed to fetch data'}. Other services will still load.`)
          }
        }
      }

      // Fetch Google Analytics data if property ID is configured
      if (config.propertyId) {
        try {
          const analyticsParams = new URLSearchParams({
            property_id: config.propertyId,
            start_date: dateRange.startDate,
            end_date: dateRange.endDate,
          })
          const analyticsResponse = await fetch(`/api/google/analytics?${analyticsParams.toString()}`)
          if (analyticsResponse.ok) {
            const analyticsData = await analyticsResponse.json()
            // Process Analytics data to extract conversion breakdown
            // This will be used to populate the conversion breakdown if Ads doesn't have it
            results.analytics = analyticsData.data
          } else {
            const errorData = await analyticsResponse.json().catch(() => ({ error: 'Failed to fetch Analytics data' }))
            console.error('Analytics API error:', errorData)
          }
        } catch (err) {
          console.error('Error fetching Analytics data:', err)
        }
      }

      // Fetch Search Console data if site URL is configured
      if (config.siteUrl) {
        try {
          const scParams = new URLSearchParams({
            site_url: config.siteUrl,
            start_date: dateRange.startDate,
            end_date: dateRange.endDate,
          })
          const scResponse = await fetch(`/api/google/search-console?${scParams.toString()}`)
          if (scResponse.ok) {
            const scData = await scResponse.json()
            results.searchConsole = scData.data
          } else {
            const errorData = await scResponse.json().catch(() => ({ error: 'Failed to fetch Search Console data' }))
            console.error('Search Console API error:', errorData)
          }
        } catch (err) {
          console.error('Error fetching Search Console data:', err)
        }
      }

      if (Object.keys(results).length === 0) {
        setError('No data sources configured. Please configure at least one service in settings.')
        return
      }

      setMetrics(results)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data')
    } finally {
      setFetching(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Google Analytics & Ads</h1>
          <p className="text-gray-600 mt-1">Performance metrics and comparisons</p>
        </div>
        <div className="flex items-center gap-3">
          {!isConnected && (
            <Button onClick={handleConnect}>
              <LinkIcon className="h-4 w-4 mr-2" />
              Connect Google Account
            </Button>
          )}
          {isConnected && (
            <>
              <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-700">Connected</span>
              </div>
              <Button onClick={handleFetchData} disabled={fetching}>
                <RefreshCw className={`h-4 w-4 mr-2 ${fetching ? 'animate-spin' : ''}`} />
                {fetching ? 'Fetching...' : 'Fetch Data'}
              </Button>
            </>
          )}
        </div>
      </div>

      {error && (
        <Card className="border-orange-300 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-orange-700">
              <AlertCircle className="h-5 w-5" />
              <span className="font-semibold">{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {!isConnected && (
        <Card>
          <CardHeader>
            <CardTitle>Connect Your Google Account</CardTitle>
            <CardDescription>
              Connect your Google account to view Analytics, Ads, and Search Console data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleConnect} size="lg">
              <LinkIcon className="h-5 w-5 mr-2" />
              Connect Google Account
            </Button>
          </CardContent>
        </Card>
      )}

      {isConnected && (
        <>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Configuration</CardTitle>
                  <CardDescription>Set up your Google Analytics, Ads, and Search Console IDs</CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowConfig(!showConfig)}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  {showConfig ? 'Hide' : 'Show'} Config
                </Button>
              </div>
            </CardHeader>
            {showConfig && (
              <CardContent className="space-y-4 pt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Google Analytics Property ID
                  </label>
                  <input
                    type="text"
                    value={config.propertyId}
                    onChange={(e) => setConfig({ ...config, propertyId: e.target.value })}
                    placeholder="123456789"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Found in GA4 Admin &gt; Property Settings
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Google Ads Customer ID
                  </label>
                  <input
                    type="text"
                    value={config.customerId}
                    onChange={(e) => setConfig({ ...config, customerId: e.target.value })}
                    placeholder="123-456-7890"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    10-digit customer ID from Google Ads account
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Search Console Site URL
                  </label>
                  <input
                    type="url"
                    value={config.siteUrl}
                    onChange={(e) => setConfig({ ...config, siteUrl: e.target.value })}
                    placeholder="https://www.bhfe.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <Button onClick={saveConfig} className="w-full">
                  Save Configuration
                </Button>
              </CardContent>
            )}
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Date Range</CardTitle>
              <CardDescription>Select the period to compare</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={dateRange.startDate}
                    onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={dateRange.endDate}
                    onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {metrics && metrics.ads ? (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Google Ads Performance</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <MetricsCard
                    title="Spend"
                    current={metrics.ads.spend.current}
                    previous={metrics.ads.spend.previous}
                    format={(v) => `$${v.toFixed(2)}`}
                    icon={<DollarSign className="h-5 w-5" />}
                    positiveIsGood={false}
                  />
                  <MetricsCard
                    title="Clicks"
                    current={metrics.ads.clicks.current}
                    previous={metrics.ads.clicks.previous}
                    icon={<MousePointerClick className="h-5 w-5" />}
                  />
                  <MetricsCard
                    title="Impressions"
                    current={metrics.ads.impressions.current}
                    previous={metrics.ads.impressions.previous}
                    icon={<Eye className="h-5 w-5" />}
                  />
                  <MetricsCard
                    title="Avg CPC"
                    current={metrics.ads.avgCpc.current}
                    previous={metrics.ads.avgCpc.previous}
                    format={(v) => `$${v.toFixed(2)}`}
                    positiveIsGood={false}
                  />
                  <MetricsCard
                    title="Avg CTR"
                    current={metrics.ads.avgCtr.current}
                    previous={metrics.ads.avgCtr.previous}
                    format={(v) => `${v.toFixed(2)}%`}
                  />
                  <MetricsCard
                    title="Conversions"
                    current={metrics.ads.conversions.current}
                    previous={metrics.ads.conversions.previous}
                    format={(v) => v.toFixed(2)}
                    icon={<CheckCircle className="h-5 w-5" />}
                  />
                  <MetricsCard
                    title="Cost Per Conversion"
                    current={metrics.ads.costPerConversion.current}
                    previous={metrics.ads.costPerConversion.previous}
                    format={(v) => `$${v.toFixed(2)}`}
                    positiveIsGood={false}
                  />
                  <MetricsCard
                    title="ROAS"
                    current={metrics.ads.roas.current}
                    previous={metrics.ads.roas.previous}
                    format={(v) => `$${v.toFixed(2)}:1`}
                  />
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Conversion Breakdown</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(metrics.ads.conversionsBreakdown).map(([key, value]: [string, any]) => (
                    <MetricsCard
                      key={key}
                      title={key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      current={value.current}
                      previous={value.previous}
                      format={(v) => v.toFixed(2)}
                      icon={<ShoppingCart className="h-5 w-5" />}
                    />
                  ))}
                </div>
              </div>
            </div>
          ) : metrics && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-gray-500">
                  <p>No data available yet. Configure your service IDs and click "Fetch Data".</p>
                  {config.customerId && (
                    <p className="text-sm text-red-600 mt-2">
                      Note: Ads API returned an error. Check your Customer ID and developer token.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
