'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Activity,
  AlertCircle,
  BarChart3, 
  CheckCircle,
  DollarSign,
  Eye,
  Link as LinkIcon,
  MousePointerClick,
  RefreshCw,
  Settings,
  ShoppingCart,
  TrendingDown,
  TrendingUp,
  Users,
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
            // Process Analytics data - the API returns comprehensive data in GA4 format
            const gaData = analyticsData.data
            
            // Extract metrics from GA4 response
            // The response has rows with dimensions (eventName) and metrics
            let currentUsers = 0
            let previousUsers = 0
            let currentSessions = 0
            let previousSessions = 0
            let currentEventCount = 0
            let previousEventCount = 0
            let currentConversions = 0
            let previousConversions = 0
            
            // Process rows for current and previous periods
            if (gaData.rows) {
              gaData.rows.forEach((row: any) => {
                const dateRanges = row.metricValues || []
                // Current period is first, previous is second
                if (dateRanges[0]) {
                  currentUsers += parseFloat(dateRanges[0].values?.[2] || 0) // totalUsers metric
                  currentSessions += parseFloat(dateRanges[0].values?.[3] || 0) // sessions metric
                  currentEventCount += parseFloat(dateRanges[0].values?.[0] || 0) // eventCount metric
                  currentConversions += parseFloat(dateRanges[0].values?.[1] || 0) // conversions metric
                }
                if (dateRanges[1]) {
                  previousUsers += parseFloat(dateRanges[1].values?.[2] || 0)
                  previousSessions += parseFloat(dateRanges[1].values?.[3] || 0)
                  previousEventCount += parseFloat(dateRanges[1].values?.[0] || 0)
                  previousConversions += parseFloat(dateRanges[1].values?.[1] || 0)
                }
              })
            }
            
            // Store all comprehensive Analytics data for AI access
            results.analytics = {
              users: { current: currentUsers, previous: previousUsers },
              sessions: { current: currentSessions, previous: previousSessions },
              eventCount: { current: currentEventCount, previous: previousEventCount },
              conversions: { current: currentConversions, previous: previousConversions },
              // Include all comprehensive data for AI
              events: analyticsData.data, // Event breakdown
              pages: analyticsData.pages, // Top pages
              sources: analyticsData.sources, // Traffic sources
              countries: analyticsData.countries, // Countries
              devices: analyticsData.devices, // Devices
              browsers: analyticsData.browsers, // Browsers
            }
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
          <h1 className="text-3xl font-bold text-gray-900">Google Search Console</h1>
          <p className="text-gray-600 mt-1">Search performance metrics and insights</p>
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
                <CardDescription>Set up your Google Search Console Site URL</CardDescription>
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
                    Search Console Site URL
                  </label>
                  <input
                    type="url"
                    value={config.siteUrl}
                    onChange={(e) => setConfig({ ...config, siteUrl: e.target.value })}
                    placeholder="https://www.bhfe.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    The verified site URL from Google Search Console
                  </p>
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

          {metrics && metrics.searchConsole && (
            <div className="space-y-6">
              {/* Google Search Console Section */}
              {metrics.searchConsole && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Google Search Console</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <MetricsCard
                        title="Clicks"
                        current={metrics.searchConsole.current.clicks}
                        previous={metrics.searchConsole.previous.clicks}
                        format={(v) => Math.round(v).toLocaleString()}
                        icon={<MousePointerClick className="h-5 w-5" />}
                      />
                      <MetricsCard
                        title="Impressions"
                        current={metrics.searchConsole.current.impressions}
                        previous={metrics.searchConsole.previous.impressions}
                        format={(v) => Math.round(v).toLocaleString()}
                        icon={<Eye className="h-5 w-5" />}
                      />
                      <MetricsCard
                        title="CTR"
                        current={metrics.searchConsole.current.ctr}
                        previous={metrics.searchConsole.previous.ctr}
                        format={(v) => `${v.toFixed(2)}%`}
                        icon={<BarChart3 className="h-5 w-5" />}
                      />
                      <MetricsCard
                        title="Avg Position"
                        current={metrics.searchConsole.current.position}
                        previous={metrics.searchConsole.previous.position}
                        format={(v) => v.toFixed(1)}
                        icon={<TrendingUp className="h-5 w-5" />}
                        positiveIsGood={false}
                      />
                    </div>
                  </div>

                  {/* Top Keywords */}
                  {metrics.searchConsole.keywords && metrics.searchConsole.keywords.current.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Top Keywords (Queries)</CardTitle>
                        <CardDescription>Most popular search queries</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-gray-200">
                                <th className="text-left py-2 px-3 font-semibold text-gray-700">Query</th>
                                <th className="text-right py-2 px-3 font-semibold text-gray-700">Clicks</th>
                                <th className="text-right py-2 px-3 font-semibold text-gray-700">Impressions</th>
                                <th className="text-right py-2 px-3 font-semibold text-gray-700">CTR</th>
                                <th className="text-right py-2 px-3 font-semibold text-gray-700">Position</th>
                              </tr>
                            </thead>
                            <tbody>
                              {metrics.searchConsole.keywords.current.slice(0, 20).map((keyword: any, index: number) => {
                                const prevKeyword = metrics.searchConsole.keywords.previous.find((k: any) => k.query === keyword.query)
                                const clicksChange = prevKeyword ? calculatePercentChange(keyword.clicks, prevKeyword.clicks) : 0
                                const impressionsChange = prevKeyword ? calculatePercentChange(keyword.impressions, prevKeyword.impressions) : 0
                                return (
                                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                                    <td className="py-2 px-3 font-medium text-gray-900">{keyword.query}</td>
                                    <td className="py-2 px-3 text-right">
                                      <div className="flex items-center justify-end gap-2">
                                        <span>{Math.round(keyword.clicks).toLocaleString()}</span>
                                        {prevKeyword && (
                                          <span className={`text-xs ${clicksChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {formatPercentChange(clicksChange)}
                                          </span>
                                        )}
                                      </div>
                                    </td>
                                    <td className="py-2 px-3 text-right">
                                      <div className="flex items-center justify-end gap-2">
                                        <span>{Math.round(keyword.impressions).toLocaleString()}</span>
                                        {prevKeyword && (
                                          <span className={`text-xs ${impressionsChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {formatPercentChange(impressionsChange)}
                                          </span>
                                        )}
                                      </div>
                                    </td>
                                    <td className="py-2 px-3 text-right">{keyword.ctr.toFixed(2)}%</td>
                                    <td className="py-2 px-3 text-right">{keyword.position.toFixed(1)}</td>
                                  </tr>
                                )
                              })}
                            </tbody>
                          </table>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Top Pages */}
                  {metrics.searchConsole.pages && metrics.searchConsole.pages.current.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Top Pages</CardTitle>
                        <CardDescription>Pages with most search visibility</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-gray-200">
                                <th className="text-left py-2 px-3 font-semibold text-gray-700">Page</th>
                                <th className="text-right py-2 px-3 font-semibold text-gray-700">Clicks</th>
                                <th className="text-right py-2 px-3 font-semibold text-gray-700">Impressions</th>
                                <th className="text-right py-2 px-3 font-semibold text-gray-700">CTR</th>
                                <th className="text-right py-2 px-3 font-semibold text-gray-700">Position</th>
                              </tr>
                            </thead>
                            <tbody>
                              {metrics.searchConsole.pages.current.slice(0, 20).map((page: any, index: number) => {
                                const prevPage = metrics.searchConsole.pages.previous.find((p: any) => p.page === page.page)
                                const clicksChange = prevPage ? calculatePercentChange(page.clicks, prevPage.clicks) : 0
                                const impressionsChange = prevPage ? calculatePercentChange(page.impressions, prevPage.impressions) : 0
                                return (
                                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                                    <td className="py-2 px-3 font-medium text-gray-900">
                                      <a href={page.page} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 hover:underline truncate block max-w-md">
                                        {page.page}
                                      </a>
                                    </td>
                                    <td className="py-2 px-3 text-right">
                                      <div className="flex items-center justify-end gap-2">
                                        <span>{Math.round(page.clicks).toLocaleString()}</span>
                                        {prevPage && (
                                          <span className={`text-xs ${clicksChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {formatPercentChange(clicksChange)}
                                          </span>
                                        )}
                                      </div>
                                    </td>
                                    <td className="py-2 px-3 text-right">
                                      <div className="flex items-center justify-end gap-2">
                                        <span>{Math.round(page.impressions).toLocaleString()}</span>
                                        {prevPage && (
                                          <span className={`text-xs ${impressionsChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {formatPercentChange(impressionsChange)}
                                          </span>
                                        )}
                                      </div>
                                    </td>
                                    <td className="py-2 px-3 text-right">{page.ctr.toFixed(2)}%</td>
                                    <td className="py-2 px-3 text-right">{page.position.toFixed(1)}</td>
                                  </tr>
                                )
                              })}
                            </tbody>
                          </table>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Countries */}
                  {metrics.searchConsole.countries && metrics.searchConsole.countries.current.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Traffic by Country</CardTitle>
                        <CardDescription>Search traffic breakdown by country</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {metrics.searchConsole.countries.current.slice(0, 10).map((country: any, index: number) => {
                            const prevCountry = metrics.searchConsole.countries.previous.find((c: any) => c.country === country.country)
                            const clicksChange = prevCountry ? calculatePercentChange(country.clicks, prevCountry.clicks) : 0
                            return (
                              <div key={index} className="p-4 border border-gray-200 rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="font-semibold text-gray-900">{country.country}</span>
                                  {prevCountry && (
                                    <span className={`text-xs px-2 py-1 rounded ${clicksChange >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                      {formatPercentChange(clicksChange)}
                                    </span>
                                  )}
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                  <div>
                                    <span className="text-gray-600">Clicks: </span>
                                    <span className="font-medium">{Math.round(country.clicks).toLocaleString()}</span>
                                  </div>
                                  <div>
                                    <span className="text-gray-600">Impressions: </span>
                                    <span className="font-medium">{Math.round(country.impressions).toLocaleString()}</span>
                                  </div>
                                  <div>
                                    <span className="text-gray-600">CTR: </span>
                                    <span className="font-medium">{country.ctr.toFixed(2)}%</span>
                                  </div>
                                  <div>
                                    <span className="text-gray-600">Position: </span>
                                    <span className="font-medium">{country.position.toFixed(1)}</span>
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Devices */}
                  {metrics.searchConsole.devices && metrics.searchConsole.devices.current.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Traffic by Device</CardTitle>
                        <CardDescription>Search traffic breakdown by device type</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {metrics.searchConsole.devices.current.map((device: any, index: number) => {
                            const prevDevice = metrics.searchConsole.devices.previous.find((d: any) => d.device === device.device)
                            const clicksChange = prevDevice ? calculatePercentChange(device.clicks, prevDevice.clicks) : 0
                            return (
                              <div key={index} className="p-4 border border-gray-200 rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="font-semibold text-gray-900 capitalize">{device.device}</span>
                                  {prevDevice && (
                                    <span className={`text-xs px-2 py-1 rounded ${clicksChange >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                      {formatPercentChange(clicksChange)}
                                    </span>
                                  )}
                                </div>
                                <div className="space-y-1 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Clicks:</span>
                                    <span className="font-medium">{Math.round(device.clicks).toLocaleString()}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Impressions:</span>
                                    <span className="font-medium">{Math.round(device.impressions).toLocaleString()}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">CTR:</span>
                                    <span className="font-medium">{device.ctr.toFixed(2)}%</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Position:</span>
                                    <span className="font-medium">{device.position.toFixed(1)}</span>
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </div>
          )}
          
          {!metrics && isConnected && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-gray-500">
                  <p>No data available. Click "Fetch Data" to load metrics.</p>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
