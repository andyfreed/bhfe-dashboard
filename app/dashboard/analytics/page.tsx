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
  const supabase = createClient()

  useEffect(() => {
    checkConnection()
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

  const handleConnect = () => {
    window.location.href = '/api/google/auth'
  }

  const handleFetchData = async () => {
    setFetching(true)
    setError(null)

    try {
      // This will fetch from all three services
      // For now, showing placeholder structure
      setMetrics({
        ads: {
          spend: { current: 838.27, previous: 616.38 },
          clicks: { current: 361, previous: 376 },
          impressions: { current: 1684, previous: 1892 },
          avgCpc: { current: 2.32, previous: 1.64 },
          avgCtr: { current: 21.44, previous: 19.87 },
          conversions: { current: 398.65, previous: 295.26 },
          costPerConversion: { current: 2.10, previous: 2.09 },
          conversionValue: { current: 2298.36, previous: 1807.35 },
          roas: { current: 2.74, previous: 2.93 },
          conversionsBreakdown: {
            add_to_cart: { current: 166.68, previous: 120 },
            begin_checkout: { current: 2.45, previous: 2 },
            purchase: { current: 2.54, previous: 2 },
            form_submit_contact: { current: 5.91, previous: 4 },
            form_submit_login: { current: 220.08, previous: 160 },
            form_submit_new_registration: { current: 1.00, previous: 0.8 },
          },
        },
      })
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
        <Card className="border-red-300 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="h-5 w-5" />
              <span className="font-semibold">Error: {error}</span>
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

          {metrics && (
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
          )}
        </>
      )}
    </div>
  )
}
