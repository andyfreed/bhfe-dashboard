import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const ALLOWED_MODELS = ['gpt-4.1-mini', 'gpt-4.1']
const DEFAULT_MODEL = 'gpt-4.1-mini'
const MIN_CONFIDENCE = 0.75
const SCHEMA_VERSION = 'cpa_cpe_v1'

const CONTRACT = `
You are a CPA regulatory analyst. Interpret the pasted statute/rule text and fill the CPA CPE schema. Do NOT use keyword rules; reason like a human analyst.
- If unclear, leave fields null and set needs_human_review true.
- Capture edge cases in other_requirements.
- Respond with JSON ONLY matching this contract:
{
  "state_code": "CO",
  "state_name": "Colorado",
  "reporting_period": {
    "type": "fixed_multi_year_window",
    "length_months": 24,
    "start_rule": "January 1 of an even-numbered year",
    "end_rule": "December 31 of an odd-numbered year",
    "examples": [{"start":"2026-01-01","end":"2027-12-31"}]
  },
  "hours": {
    "total_required": 80,
    "accrual_method": "per_quarter_active",
    "accrual_rate_hours": 10,
    "accrual_rate_period": "calendar_quarter",
    "prorating_rules": "Accrues 10 hours for every full calendar quarter the certificate is active."
  },
  "deadlines": {
    "completion_deadline_rule": "December 31 of odd-numbered years",
    "completion_deadline_anchor": "end_of_reporting_period",
    "late_policy_summary": null
  },
  "category_requirements": [
    {"category":"ethics","hours":4,"notes":"Four hours ethics; two may be CR&R.","max_percent_allowed":null},
    {"category":"personal_development","hours":null,"notes":"No more than 20% of CPE can be personal development.","max_percent_allowed":20}
  ],
  "delivery_constraints": [],
  "carryover": {"allowed": null, "max_hours": null, "notes": null},
  "special": {
    "initial_license_rules": null,
    "inactive_status_rules": null,
    "reactivation_reinstatement_rules": null
  },
  "audit_and_records": {
    "audit_policy_summary": "Board may audit; documentation retained minimum 5 years from end of year completed.",
    "record_retention_years": 5
  },
  "other_requirements": [],
  "plain_english_summary": "Colorado CPAs in active status accrue 10 CPE hours per full active calendar quarter during the 2-year reporting period (Jan 1 even year–Dec 31 odd year), totaling 80 hours per full period. CPE must be completed by Dec 31 of the odd year.",
  "extraction_confidence": 0.85
}
Rules: Never guess; keep nulls when absent. Capture edge cases in other_requirements. Respond with JSON only.
`

const CONTRACT_SCHEMA = {
  name: 'cpa_cpe_contract',
  schema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      state_code: { type: 'string', pattern: '^[A-Z]{2}$' },
      state_name: { type: ['string', 'null'] },
      reporting_period: {
        anyOf: [
          {
            type: 'object',
            additionalProperties: false,
            properties: {
              type: { type: 'string' },
            },
            required: ['type'],
          },
          {
            type: 'object',
            additionalProperties: false,
            properties: {
              type: { type: 'string' },
              start_rule: { type: 'string' },
              end_rule: { type: 'string' },
            },
            required: ['type', 'start_rule', 'end_rule'],
          },
          {
            type: 'object',
            additionalProperties: false,
            properties: {
              type: { type: 'string' },
              length_months: { type: 'number' },
              start_rule: { type: 'string' },
              end_rule: { type: 'string' },
            },
            required: ['type', 'length_months', 'start_rule', 'end_rule'],
          },
        ],
      },
      hours: {
        type: 'object',
        additionalProperties: false,
        properties: {
          total_required: { type: ['number', 'null'] },
          accrual_method: { type: 'string' },
          accrual_rate_hours: { type: ['number', 'null'] },
          accrual_rate_period: { type: ['string', 'null'] },
          prorating_rules: { type: ['string', 'null'] },
        },
        required: ['accrual_method'],
      },
      deadlines: {
        type: 'object',
        additionalProperties: false,
        properties: {
          completion_deadline_rule: { type: ['string', 'null'] },
          completion_deadline_anchor: { type: ['string', 'null'] },
          late_policy_summary: { type: ['string', 'null'] },
        },
        required: [],
      },
      category_requirements: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            category: { type: 'string' },
            hours: { type: ['number', 'null'] },
            notes: { type: ['string', 'null'] },
            max_percent_allowed: { type: ['number', 'null'] },
          },
          required: ['category'],
        },
        default: [],
      },
      delivery_constraints: {
        type: 'array',
        items: { type: 'object' },
        default: [],
      },
      carryover: {
        type: 'object',
        additionalProperties: false,
        properties: {
          allowed: { type: ['boolean', 'null'] },
          max_hours: { type: ['number', 'null'] },
          notes: { type: ['string', 'null'] },
        },
        required: [],
      },
      special: {
        type: 'object',
        additionalProperties: false,
        properties: {
          initial_license_rules: { type: ['string', 'null'] },
          inactive_status_rules: { type: ['string', 'null'] },
          reactivation_reinstatement_rules: { type: ['string', 'null'] },
        },
        required: [],
      },
      audit_and_records: {
        type: 'object',
        additionalProperties: false,
        properties: {
          audit_policy_summary: { type: ['string', 'null'] },
          record_retention_years: { type: ['number', 'null'] },
        },
        required: [],
      },
      other_requirements: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            title: { type: ['string', 'null'] },
            details: { type: ['string', 'null'] },
            citation: { type: ['string', 'null'] },
          },
          required: [],
        },
        default: [],
      },
      plain_english_summary: { type: ['string', 'null'] },
      extraction_confidence: { type: ['number', 'null'] },
      needs_human_review: { type: ['boolean', 'null'] },
    },
    required: ['state_code', 'reporting_period', 'hours'],
  },
  strict: true,
} as const

function stripJson(content: string) {
  const fenced = content.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fenced) return fenced[1]
  return content.trim()
}

type PartialRequirement = {
  state_code?: string
  state_name?: string | null
  reporting_period?: any
  hours?: any
  deadlines?: any
  category_requirements?: any[]
  delivery_constraints?: any[]
  carryover?: any
  special?: any
  audit_and_records?: any
  other_requirements?: any[]
  plain_english_summary?: string | null
  extraction_confidence?: number | null
  needs_human_review?: boolean
}

function validateShape(payload: PartialRequirement) {
  const errors: string[] = []

  const isString = (v: any) => typeof v === 'string'
  const isNullableString = (v: any) => v === null || typeof v === 'string'
  const isNumberOrNull = (v: any) => v === null || typeof v === 'number'
  const isBoolOrNull = (v: any) => v === null || typeof v === 'boolean'

  if (!payload.state_code || !isString(payload.state_code) || payload.state_code.length !== 2) {
    errors.push('state_code missing/invalid')
  }

  const rp = payload.reporting_period
  if (!rp || typeof rp !== 'object') {
    errors.push('reporting_period missing')
  } else {
    const variant1 = rp.type && isString(rp.type) && rp.start_rule === undefined && rp.end_rule === undefined && rp.length_months === undefined
    const variant2 = rp.type && isString(rp.type) && isString(rp.start_rule) && isString(rp.end_rule) && rp.length_months === undefined
    const variant3 = rp.type && isString(rp.type) && typeof rp.length_months === 'number' && isString(rp.start_rule) && isString(rp.end_rule)
    if (!variant1 && !variant2 && !variant3) {
      errors.push('reporting_period invalid shape')
    }
  }

  if (!payload.hours || typeof payload.hours !== 'object') {
    errors.push('hours missing')
  } else {
    if (!isString(payload.hours.accrual_method)) errors.push('hours.accrual_method missing/invalid')
    if (!isNumberOrNull(payload.hours.total_required)) errors.push('hours.total_required invalid')
    if (!isNumberOrNull(payload.hours.accrual_rate_hours)) errors.push('hours.accrual_rate_hours invalid')
    if (!isNullableString(payload.hours.accrual_rate_period)) errors.push('hours.accrual_rate_period invalid')
    if (!isNullableString(payload.hours.prorating_rules)) errors.push('hours.prorating_rules invalid')
  }

  if (payload.deadlines) {
    if (!isNullableString(payload.deadlines.completion_deadline_rule)) errors.push('deadlines.completion_deadline_rule invalid')
    if (!isNullableString(payload.deadlines.completion_deadline_anchor)) errors.push('deadlines.completion_deadline_anchor invalid')
    if (!isNullableString(payload.deadlines.late_policy_summary)) errors.push('deadlines.late_policy_summary invalid')
  }

  if (payload.category_requirements) {
    if (!Array.isArray(payload.category_requirements)) errors.push('category_requirements invalid')
    else payload.category_requirements.forEach((c, idx) => {
      if (!c || typeof c !== 'object') errors.push(`category_requirements[${idx}] invalid`)
      else {
        if (!isString(c.category)) errors.push(`category_requirements[${idx}].category missing/invalid`)
        if (!isNumberOrNull(c.hours)) errors.push(`category_requirements[${idx}].hours invalid`)
        if (!isNullableString(c.notes)) errors.push(`category_requirements[${idx}].notes invalid`)
        if (!isNumberOrNull(c.max_percent_allowed)) errors.push(`category_requirements[${idx}].max_percent_allowed invalid`)
      }
    })
  }

  if (payload.delivery_constraints && !Array.isArray(payload.delivery_constraints)) {
    errors.push('delivery_constraints invalid')
  }

  if (payload.carryover) {
    if (!isBoolOrNull(payload.carryover.allowed)) errors.push('carryover.allowed invalid')
    if (!isNumberOrNull(payload.carryover.max_hours)) errors.push('carryover.max_hours invalid')
    if (!isNullableString(payload.carryover.notes)) errors.push('carryover.notes invalid')
  }

  if (payload.special) {
    if (!isNullableString(payload.special.initial_license_rules)) errors.push('special.initial_license_rules invalid')
    if (!isNullableString(payload.special.inactive_status_rules)) errors.push('special.inactive_status_rules invalid')
    if (!isNullableString(payload.special.reactivation_reinstatement_rules)) errors.push('special.reactivation_reinstatement_rules invalid')
  }

  if (payload.audit_and_records) {
    if (!isNullableString(payload.audit_and_records.audit_policy_summary)) errors.push('audit_and_records.audit_policy_summary invalid')
    if (!isNumberOrNull(payload.audit_and_records.record_retention_years)) errors.push('audit_and_records.record_retention_years invalid')
  }

  if (payload.other_requirements) {
    if (!Array.isArray(payload.other_requirements)) errors.push('other_requirements invalid')
    else payload.other_requirements.forEach((o, idx) => {
      if (!o || typeof o !== 'object') errors.push(`other_requirements[${idx}] invalid`)
      else {
        if (!isNullableString(o.title)) errors.push(`other_requirements[${idx}].title invalid`)
        if (!isNullableString(o.details)) errors.push(`other_requirements[${idx}].details invalid`)
        if (!isNullableString(o.citation)) errors.push(`other_requirements[${idx}].citation invalid`)
      }
    })
  }

  if (!isNullableString(payload.plain_english_summary)) errors.push('plain_english_summary invalid')
  if (payload.extraction_confidence != null && typeof payload.extraction_confidence !== 'number') {
    errors.push('extraction_confidence invalid')
  }

  return errors
}

function needsReviewFlag(payload: PartialRequirement, body: any, parseError: boolean, validationErrors: string[]) {
  const issues = validateShape(payload)
  const allIssues = [...issues, ...validationErrors]
  const lowConfidence =
    typeof payload.extraction_confidence === 'number' ? payload.extraction_confidence < MIN_CONFIDENCE : true
  const mismatch = payload.state_code && payload.state_code !== body.state_code
  const text = body.source_text?.toLowerCase?.() || ''
  const discretionary = /case[- ]by[- ]case|board discretion|may waive|as determined by board/i.test(text)
  return parseError || allIssues.length > 0 || lowConfidence || mismatch || discretionary || payload.needs_human_review === true
}

function mapToDb(payload: PartialRequirement, body: any, needsReview: boolean) {
  const reporting = payload.reporting_period || {}
  const hours = payload.hours || {}
  const deadlines = payload.deadlines || {}
  const carryover = payload.carryover || {}
  const special = payload.special || {}
  const audit = payload.audit_and_records || {}

  const enrichedJson = { ...payload, schema_version: SCHEMA_VERSION }

  return {
    state_code: body.state_code,
    state_name: payload.state_name ?? body.state_name ?? null,
    schema_version: SCHEMA_VERSION,
    effective_date: body.effective_date || null,
    source_title: body.source_title || null,
    source_url: body.source_url || null,
    source_text: body.source_text,
    extracted_json: enrichedJson,
    extracted_at: new Date().toISOString(),
    model_name: body.model_name || DEFAULT_MODEL,
    extraction_confidence: payload.extraction_confidence ?? null,
    needs_human_review: needsReview,
    reporting_period_type: reporting.type ?? 'other',
    reporting_period_length_months: reporting.length_months ?? null,
    reporting_period_start_rule: reporting.start_rule ?? null,
    reporting_period_end_rule: reporting.end_rule ?? null,
    reporting_period_examples: reporting.examples ?? null,
    total_hours_required: hours.total_required ?? null,
    accrual_method: hours.accrual_method ?? 'other',
    accrual_rate_hours: hours.accrual_rate_hours ?? null,
    accrual_rate_period: hours.accrual_rate_period ?? null,
    prorating_rules: hours.prorating_rules ?? null,
    completion_deadline_rule: deadlines.completion_deadline_rule ?? null,
    completion_deadline_anchor: deadlines.completion_deadline_anchor ?? null,
    late_policy_summary: deadlines.late_policy_summary ?? null,
    category_requirements: payload.category_requirements ?? [],
    delivery_constraints: payload.delivery_constraints ?? [],
    carryover_allowed: carryover.allowed ?? null,
    carryover_max_hours: carryover.max_hours ?? null,
    carryover_notes: carryover.notes ?? null,
    initial_license_rules: special.initial_license_rules ?? null,
    inactive_status_rules: special.inactive_status_rules ?? null,
    reactivation_reinstatement_rules: special.reactivation_reinstatement_rules ?? null,
    audit_policy_summary: audit.audit_policy_summary ?? null,
    record_retention_years: audit.record_retention_years ?? null,
    other_requirements: payload.other_requirements ?? [],
    plain_english_summary: payload.plain_english_summary ?? null,
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const required = ['state_code', 'source_text']
    for (const key of required) {
      if (!body[key]) {
        return NextResponse.json({ error: `Missing field: ${key}` }, { status: 400 })
      }
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OPENAI_API_KEY not configured' }, { status: 500 })
    }

    const stateCode = String(body.state_code || '').toUpperCase()
    const modelName = ALLOWED_MODELS.includes(body.model_name) ? body.model_name : DEFAULT_MODEL

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const messages = [
      { role: 'system', content: CONTRACT },
      { role: 'user', content: body.source_text },
    ]

    const completion = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: modelName,
        messages,
        temperature: 0.2,
        response_format: {
          type: 'json_schema',
          json_schema: CONTRACT_SCHEMA,
        },
      }),
    })

    if (!completion.ok) {
      const error = await completion.json().catch(() => ({}))
      return NextResponse.json({ error: error.error?.message || 'LLM request failed' }, { status: 502 })
    }

    const completionJson = await completion.json()
    const content = completionJson.choices?.[0]?.message?.content || ''
    const cleaned = stripJson(content)

    let parsed: PartialRequirement = {}
    let parseError = false
    try {
      parsed = JSON.parse(cleaned)
    } catch (err) {
      parseError = true
    }

    const normalized: PartialRequirement = {
      ...parsed,
      state_code: (parsed.state_code || stateCode || '').toUpperCase(),
    }

    const validationErrors = parseError ? ['json_parse_error'] : validateShape(normalized)
    const reviewFlag = needsReviewFlag(normalized, { ...body, state_code: stateCode }, parseError, validationErrors)

    const upsertPayload = mapToDb(normalized, { ...body, state_code: stateCode, model_name: modelName }, reviewFlag)

    const { data, error } = await supabase
      .from('cpa_state_cpe_requirements')
      .upsert(
        {
          ...upsertPayload,
          updated_by: user?.id || null,
          created_by: user?.id || null,
        },
        { onConflict: 'state_code' }
      )
      .select('*')
      .single()

    if (error) {
      console.error('Error saving CPA requirement', error)
      return NextResponse.json({ error: 'Failed to save extracted data' }, { status: 500 })
    }

    return NextResponse.json({ data, raw: normalized, needs_human_review: reviewFlag }, { status: 200 })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unexpected error' },
      { status: 500 }
    )
  }
}

