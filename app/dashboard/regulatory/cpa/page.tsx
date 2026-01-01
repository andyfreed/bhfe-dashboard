'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MapPin, Play, RefreshCw } from 'lucide-react'

interface StateInfo {
  id: string
  state_code: string
  state_name: string
}

interface CpaRequirement {
  id: string
  state_code: string
  state_name: string
  effective_date: string | null
  source_title: string | null
  source_url: string | null
  source_text: string
  extracted_at: string
  model_name: string | null
  extraction_confidence: number | null
  needs_human_review: boolean
  reporting_period_type: string
  reporting_period_length_months: number | null
  reporting_period_start_rule: string | null
  reporting_period_end_rule: string | null
  reporting_period_examples: any | null
  total_hours_required: number | null
  accrual_method: string
  accrual_rate_hours: number | null
  accrual_rate_period: string | null
  prorating_rules: string | null
  completion_deadline_rule: string | null
  completion_deadline_anchor: string | null
  late_policy_summary: string | null
  category_requirements: any[]
  delivery_constraints: any[]
  carryover_allowed: boolean | null
  carryover_max_hours: number | null
  carryover_notes: string | null
  initial_license_rules: string | null
  inactive_status_rules: string | null
  reactivation_reinstatement_rules: string | null
  audit_policy_summary: string | null
  record_retention_years: number | null
  other_requirements: any[]
  plain_english_summary: string | null
}

const US_STATES = [
  { code: 'AL', name: 'Alabama' }, { code: 'AK', name: 'Alaska' }, { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' }, { code: 'CA', name: 'California' }, { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' }, { code: 'DE', name: 'Delaware' }, { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' }, { code: 'HI', name: 'Hawaii' }, { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' }, { code: 'IN', name: 'Indiana' }, { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' }, { code: 'KY', name: 'Kentucky' }, { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' }, { code: 'MD', name: 'Maryland' }, { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' }, { code: 'MN', name: 'Minnesota' }, { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' }, { code: 'MT', name: 'Montana' }, { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' }, { code: 'NH', name: 'New Hampshire' }, { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' }, { code: 'NY', name: 'New York' }, { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' }, { code: 'OH', name: 'Ohio' }, { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' }, { code: 'PA', name: 'Pennsylvania' }, { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' }, { code: 'SD', name: 'South Dakota' }, { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' }, { code: 'UT', name: 'Utah' }, { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' }, { code: 'WA', name: 'Washington' }, { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' }, { code: 'WY', name: 'Wyoming' },
]

const EMPTY_EXTRACTION: Partial<CpaRequirement> = {
  reporting_period_type: '',
  accrual_method: '',
  category_requirements: [],
  delivery_constraints: [],
  other_requirements: [],
}

const friendlyValue = (value: any) => {
  if (value === null || value === undefined || value === '') return 'Not specified'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  return value
}

const toTitleCase = (str: string) =>
  str
    .replace(/_/g, ' ')
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')

const friendlyEnum = (value: any) => {
  if (value === null || value === undefined) return 'Not specified'
  const lower = String(value).toLowerCase()
  if (['none_specified', 'none', 'unknown', ''].includes(lower)) return 'Not specified'
  return toTitleCase(lower)
}

const formatPeriod = (
  months: number | null,
  type: string | null,
  startRule: string | null,
  endRule: string | null
) => {
  let base = 'Not specified'
  if (months) {
    if (months === 12) base = '1 year'
    else if (months === 24) base = '2 years'
    else if (months === 36) base = '3 years'
    else base = `${months} months`
  }
  if (type === 'fixed_multi_year_window' && months === 24) {
    base = 'Every 2 years'
  }
  const parts = [base]
  if (startRule) parts.push(`Starts: ${startRule}`)
  if (endRule) parts.push(`Ends: ${endRule}`)
  return parts.filter(Boolean).join(' • ')
}

const shouldRender = (value: any) => {
  if (value === null || value === undefined) return false
  if (Array.isArray(value) && value.length === 0) return false
  const str = typeof value === 'string' ? value.trim().toLowerCase() : null
  if (str === '' || str === 'not specified' || ['none', 'none_specified', 'unknown'].includes(str || '')) return false
  return true
}

function Collapsible({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-gray-200 rounded-md">
      <button
        className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-left"
        onClick={() => setOpen((o) => !o)}
      >
        <span>{title}</span>
        <span className="text-xs text-gray-500">{open ? 'Hide' : 'Show'}</span>
      </button>
      {open && <div className="border-t border-gray-200 p-3 text-sm">{children}</div>}
    </div>
  )
}

export default function StatesPage() {
  const [states, setStates] = useState<StateInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedState, setSelectedState] = useState<StateInfo | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [requirement, setRequirement] = useState<CpaRequirement | null>(null)
  const [sourceText, setSourceText] = useState('')
  const [sourceTitle, setSourceTitle] = useState('')
  const [sourceUrl, setSourceUrl] = useState('')
  const [effectiveDate, setEffectiveDate] = useState('')
  const [running, setRunning] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    const loadStates = async () => {
      const { data, error } = await supabase
        .from('state_info')
        .select('id, state_code, state_name')
        .order('state_name', { ascending: true })

      if (error) {
        console.error('Error loading states:', error)
        return
      }

      setStates(data || [])
      setLoading(false)
    }

    loadStates()
    initializeStates()
  }, [supabase])

  const initializeStates = async () => {
    const { data: existingStates } = await supabase
      .from('state_info')
      .select('state_code')

    const existingCodes = new Set(existingStates?.map((s) => s.state_code) || [])
    const missingStates = US_STATES.filter((state) => !existingCodes.has(state.code))

    if (missingStates.length > 0) {
      const statesToInsert = missingStates.map((state) => ({
        state_code: state.code,
        state_name: state.name,
      }))

      await supabase.from('state_info').insert(statesToInsert)
      const { data: refreshed } = await supabase
        .from('state_info')
        .select('id, state_code, state_name')
        .order('state_name', { ascending: true })
      setStates(refreshed || [])
    }
  }

  const filteredStates = states.filter((state) =>
    state.state_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    state.state_code.toLowerCase().includes(searchTerm.toLowerCase())
  )

  useEffect(() => {
    const loadRequirement = async () => {
      if (!selectedState) {
        setRequirement(null)
        return
      }

      const { data, error } = await supabase
        .from('cpa_state_cpe_requirements')
        .select('*')
        .eq('state_code', selectedState.state_code)
        .maybeSingle()

      if (error) {
        console.error('Error loading requirement', error)
        setRequirement(null)
        return
      }

      setRequirement(data as CpaRequirement | null)
    }

    loadRequirement()
  }, [selectedState, supabase])

  const handleExtract = async () => {
    if (!selectedState) {
      setStatus('Select a state first.')
      return
    }
    if (!sourceText.trim()) {
      setStatus('Paste the full regulatory text before running extraction.')
      return
    }

    setRunning(true)
    setStatus('Running LLM extraction...')

    try {
      const response = await fetch('/api/regulatory/cpa/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          state_code: selectedState.state_code,
          state_name: selectedState.state_name,
          source_text: sourceText,
          source_title: sourceTitle || null,
          source_url: sourceUrl || null,
          effective_date: effectiveDate || null,
        }),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.error || 'LLM extraction failed')
      }

      const payload = await response.json()
      setRequirement(payload.data as CpaRequirement)
      setStatus('Extraction complete and saved.')
    } catch (error) {
      console.error(error)
      setStatus(error instanceof Error ? error.message : 'Unexpected error')
    } finally {
      setRunning(false)
    }
  }

  const renderRequirement = () => {
    if (!requirement) {
      return (
        <div className="text-sm text-gray-600">
          No extracted data yet. Paste the rule text and run the AI extractor.
        </div>
      )
    }

    const ethicsHours =
      requirement.category_requirements?.find((c) => (c?.category || '').toLowerCase() === 'ethics')?.hours ?? null

    const stats = [
      { label: 'Total Hours', value: requirement.total_hours_required },
      { label: 'Ethics Hours', value: ethicsHours },
      { label: 'Carryover Allowed', value: requirement.carryover_allowed },
    ]

    const reportingPeriod = formatPeriod(
      requirement.reporting_period_length_months,
      requirement.reporting_period_type,
      requirement.reporting_period_start_rule,
      requirement.reporting_period_end_rule
    )

    const accrualMethod = friendlyEnum(requirement.accrual_method)

    const keyDetails = [
      { label: 'Reporting period', value: reportingPeriod, always: true },
      { label: 'Accrual method', value: accrualMethod },
      { label: 'Accrual rate hours', value: requirement.accrual_rate_hours },
      { label: 'Accrual rate period', value: requirement.accrual_rate_period },
      { label: 'Prorating rules', value: requirement.prorating_rules },
      {
        label: 'Deadline / Late policy',
        value:
          !requirement.completion_deadline_rule && !requirement.late_policy_summary
            ? null
            : [
                requirement.completion_deadline_rule
                  ? `Deadline: ${requirement.completion_deadline_rule}${
                      requirement.completion_deadline_anchor ? ` (${requirement.completion_deadline_anchor})` : ''
                    }`
                  : null,
                requirement.late_policy_summary ? `Late policy: ${requirement.late_policy_summary}` : null,
              ]
                .filter(Boolean)
                .join(' • '),
      },
      { label: 'Record retention (years)', value: requirement.record_retention_years },
      { label: 'Audit policy', value: requirement.audit_policy_summary },
      {
        label: 'Carryover',
        value:
          requirement.carryover_allowed === false
            ? 'Not allowed'
            : requirement.carryover_allowed === true
              ? `Allowed${requirement.carryover_max_hours ? ` (up to ${requirement.carryover_max_hours} hours)` : ''}`
              : 'Not specified',
        always: true,
      },
      {
        label: 'Carryover notes',
        value: requirement.carryover_allowed ? requirement.carryover_notes : null,
      },
      { label: 'Initial license rules', value: requirement.initial_license_rules },
      { label: 'Inactive status rules', value: requirement.inactive_status_rules },
      { label: 'Reactivation / Reinstatement', value: requirement.reactivation_reinstatement_rules },
    ]

    const sourceLabel =
      requirement.source_url || requirement.source_title
        ? (
          <div className="text-sm text-gray-700">
            {requirement.source_url ? (
              <a href={requirement.source_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                {requirement.source_title || requirement.source_url}
              </a>
            ) : (
              requirement.source_title
            )}
          </div>
        )
        : <span className="text-sm text-gray-500">Not provided</span>

    const citations = requirement.other_requirements || []
    const hasCitations = citations.length > 0

    const takeaways = [
      `You need ${friendlyValue(requirement.total_hours_required)} hours every ${friendlyValue(reportingPeriod)}.`,
      ethicsHours !== null && ethicsHours !== undefined
        ? `Includes ${friendlyValue(ethicsHours)} ethics hours.`
        : null,
      requirement.carryover_allowed === true
        ? 'Carryover is allowed.'
        : requirement.carryover_allowed === false
          ? 'Carryover is not allowed.'
          : 'Carryover is not specified.',
    ].filter(Boolean)

    return (
      <div className="space-y-6">
        <div className="flex flex-wrap gap-3 text-gray-700 text-sm">
          <span className="px-2 py-1 bg-gray-100 rounded-md">Model: {requirement.model_name || 'unknown'}</span>
          <span className="px-2 py-1 bg-gray-100 rounded-md">
            Extracted: {new Date(requirement.extracted_at).toLocaleString()}
          </span>
          {requirement.needs_human_review && (
            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-md">Needs human review</span>
          )}
        </div>

        <div className="space-y-2">
          <h4 className="font-semibold text-lg text-gray-900">Plain English Summary</h4>
          <p className="text-gray-800 whitespace-pre-wrap text-sm">
            {requirement.plain_english_summary || 'Not specified'}
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-100 text-blue-900 text-sm rounded-md px-3 py-2 space-y-1">
          {takeaways.map((t, idx) => (
            <div key={idx}>{t}</div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {stats.map((stat) => (
            <Card key={stat.label} className="border border-gray-200">
              <CardContent className="py-4">
                <p className="text-xs uppercase tracking-wide text-gray-500">{stat.label}</p>
                <p className="text-xl font-semibold text-gray-900 mt-1">{friendlyValue(stat.value)}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="space-y-2">
          <h4 className="font-semibold text-gray-900">Key details</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            {keyDetails
              .filter((item) => item.always || shouldRender(item.value))
              .map((item) => (
                <div key={item.label} className="flex justify-between border border-gray-200 rounded-md px-3 py-2">
                  <span className="text-gray-600">{item.label}</span>
                  <span className="text-gray-900 text-right ml-2">
                    {Array.isArray(item.value)
                      ? item.value.join(' ')
                      : friendlyValue(item.value)}
                  </span>
                </div>
              ))}
          </div>
        </div>

        {requirement.category_requirements?.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold text-gray-900">Category requirements</h4>
            <div className="overflow-auto border border-gray-200 rounded-md">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-3 py-2 text-gray-700">Category</th>
                    <th className="text-left px-3 py-2 text-gray-700">Hours</th>
                    <th className="text-left px-3 py-2 text-gray-700">Notes</th>
                    <th className="text-left px-3 py-2 text-gray-700">Max %</th>
                  </tr>
                </thead>
                <tbody>
                  {requirement.category_requirements.map((c, idx) => (
                    <tr key={idx} className="border-t border-gray-100">
                      <td className="px-3 py-2">{friendlyValue(c.category ? toTitleCase(c.category) : null)}</td>
                      <td className="px-3 py-2">{friendlyValue(c.hours)}</td>
                      <td className="px-3 py-2">{c.notes === null || c.notes === undefined ? '—' : c.notes}</td>
                      <td className="px-3 py-2">
                        {c.max_percent_allowed === null || c.max_percent_allowed === undefined ? '—' : c.max_percent_allowed}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {requirement.delivery_constraints?.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold text-gray-900">Delivery constraints</h4>
            <div className="overflow-auto border border-gray-200 rounded-md">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-3 py-2 text-gray-700">Type</th>
                    <th className="text-left px-3 py-2 text-gray-700">Limit %</th>
                    <th className="text-left px-3 py-2 text-gray-700">Limit Hours</th>
                    <th className="text-left px-3 py-2 text-gray-700">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {requirement.delivery_constraints.map((d, idx) => (
                    <tr key={idx} className="border-t border-gray-100">
                      <td className="px-3 py-2">{friendlyValue(d.type)}</td>
                      <td className="px-3 py-2">{friendlyValue(d.limit_percent)}</td>
                      <td className="px-3 py-2">{friendlyValue(d.limit_hours)}</td>
                      <td className="px-3 py-2">{friendlyValue(d.notes)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-gray-900">Evidence & Citations</h4>
            {requirement.source_url ? (
              <a
                href={requirement.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline"
              >
                View source
              </a>
            ) : (
              <span className="text-xs text-gray-500">Source link not provided</span>
            )}
          </div>
          {!hasCitations && (
            <div className="text-sm text-yellow-800 bg-yellow-50 border border-yellow-200 rounded-md px-3 py-2">
              No citations provided. This will require human review.
            </div>
          )}
          {hasCitations && (
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-800">
              {citations.map((c, idx) => (
                <li key={idx}>
                  <div>
                    <span className="font-medium">{friendlyValue(c.title)}:</span>{' '}
                    {friendlyValue(c.details)}
                  </div>
                  {c.citation ? (
                    <div className="text-xs text-gray-600 mt-0.5">Citation: {c.citation}</div>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="space-y-1">
          <h4 className="font-semibold text-gray-900">Source</h4>
          {sourceLabel}
        </div>

        <Collapsible title="Raw JSON (advanced)">
          <pre className="bg-gray-900 text-gray-50 text-xs rounded-md p-3 overflow-auto">
{JSON.stringify(requirement, null, 2)}
          </pre>
        </Collapsible>

        <Collapsible title="Source Text (advanced)">
          <pre className="bg-gray-50 text-gray-800 text-xs rounded-md p-3 overflow-auto whitespace-pre-wrap">
{requirement.source_text}
          </pre>
        </Collapsible>
      </div>
    )
  }

  if (loading) {
    return <div className="text-center py-12">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">CPA Regulatory Information</h1>
        <p className="text-gray-600 mt-1">
          LLM-first extraction of CPA state CPE requirements (paste rule text, get structured JSON).
        </p>
      </div>

      <div>
        <input
          type="text"
          placeholder="Search states..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-md"
        />
      </div>

      {filteredStates.length > 0 && (
        <div className="mb-4">
          <select
            value={selectedState?.id || ''}
            onChange={(e) => {
              const state = states.find((s) => s.id === e.target.value)
              if (state) setSelectedState(state)
            }}
            className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-md"
          >
            <option value="">Select a state...</option>
            {filteredStates.map((state) => (
              <option key={state.id} value={state.id}>
                {state.state_code} - {state.state_name}
              </option>
            ))}
          </select>
        </div>
      )}

      {selectedState ? (
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-blue-600" />
                  {selectedState.state_name} ({selectedState.state_code})
                </CardTitle>
                <CardDescription>
                  Paste the statute/rule text, run AI extraction, and review the structured output.
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => setRequirement(null)}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Clear
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Source Title (optional)
                </label>
                <input
                  type="text"
                  value={sourceTitle}
                  onChange={(e) => setSourceTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="e.g., 3 CCR 705-1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Source URL (optional)
                </label>
                <input
                  type="url"
                  value={sourceUrl}
                  onChange={(e) => setSourceUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Effective Date (optional)
                </label>
                <input
                  type="date"
                  value={effectiveDate}
                  onChange={(e) => setEffectiveDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Paste full statute / rule text (no preprocessing)
              </label>
              <textarea
                value={sourceText}
                onChange={(e) => setSourceText(e.target.value)}
                rows={10}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Paste the exact rule text here. The LLM will interpret it."
              />
            </div>

            <div className="flex flex-wrap gap-3 items-center">
              <Button onClick={handleExtract} disabled={running}>
                <Play className="h-4 w-4 mr-2" />
                {running ? 'Running...' : 'Run AI Extraction'}
              </Button>
              {status && <span className="text-sm text-gray-700">{status}</span>}
            </div>

            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">Extracted Requirement</h3>
              {renderRequirement()}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Search and select a state to view regulatory information</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
