'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MapPin, Edit, Save, X } from 'lucide-react'
import { format } from 'date-fns'

interface StateInfo {
  id: string
  state_code: string
  state_name: string
  cpe_requirements: string | null
  renewal_period: string | null
  renewal_month: string | null
  contact_info: string | null
  website_url: string | null
  notes: string | null
  cfp_notes: string | null
  ea_otrp_erpa_notes: string | null
  cdfa_notes: string | null
  iar_notes: string | null
  last_updated: string
  updated_by: string | null
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

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
  'Varies',
]

type RegulatoryType = 'CPA' | 'CFP' | 'EA/OTRP/ERPA' | 'CDFA' | 'IAR'

export default function StatesPage() {
  const searchParams = useSearchParams()
  const [states, setStates] = useState<StateInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedState, setSelectedState] = useState<StateInfo | null>(null)
  const [editingState, setEditingState] = useState<StateInfo | null>(null)
  const [activeTab, setActiveTab] = useState<RegulatoryType>('CPA')
  const [formData, setFormData] = useState({
    cpe_requirements: '',
    renewal_period: '',
    renewal_month: '',
    contact_info: '',
    website_url: '',
    notes: '',
    cfp_notes: '',
    ea_otrp_erpa_notes: '',
    cdfa_notes: '',
    iar_notes: '',
  })
  const [searchTerm, setSearchTerm] = useState('')
  const supabase = createClient()

  useEffect(() => {
    loadStates()
    initializeStates()
  }, [supabase])

  useEffect(() => {
    const tab = searchParams.get('tab') as RegulatoryType | null
    if (tab && ['CPA', 'CFP', 'EA/OTRP/ERPA', 'CDFA', 'IAR'].includes(tab)) {
      setActiveTab(tab)
    }
  }, [searchParams])

  const loadStates = async () => {
    const { data, error } = await supabase
      .from('state_info')
      .select('*')
      .order('state_name', { ascending: true })

    if (error) {
      console.error('Error loading states:', error)
      return
    }

    setStates(data || [])
    setLoading(false)
  }

  const initializeStates = async () => {
    // Check if states exist, if not create placeholder entries
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
      loadStates()
    }
  }

  const handleSelectState = (state: StateInfo) => {
    setSelectedState(state)
    setEditingState(null)
    setActiveTab('CPA')
  }

  const handleEdit = (state: StateInfo) => {
    setEditingState(state)
    setFormData({
      cpe_requirements: state.cpe_requirements || '',
      renewal_period: state.renewal_period || '',
      renewal_month: state.renewal_month || '',
      contact_info: state.contact_info || '',
      website_url: state.website_url || '',
      notes: state.notes || '',
      cfp_notes: state.cfp_notes || '',
      ea_otrp_erpa_notes: state.ea_otrp_erpa_notes || '',
      cdfa_notes: state.cdfa_notes || '',
      iar_notes: state.iar_notes || '',
    })
  }

  const handleSave = async () => {
    if (!editingState) return

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('state_info')
      .update({
        cpe_requirements: formData.cpe_requirements || null,
        renewal_period: formData.renewal_period || null,
        renewal_month: formData.renewal_month || null,
        contact_info: formData.contact_info || null,
        website_url: formData.website_url || null,
        notes: formData.notes || null,
        cfp_notes: formData.cfp_notes || null,
        ea_otrp_erpa_notes: formData.ea_otrp_erpa_notes || null,
        cdfa_notes: formData.cdfa_notes || null,
        iar_notes: formData.iar_notes || null,
        updated_by: user.id,
      })
      .eq('id', editingState.id)

    if (error) {
      console.error('Error updating state:', error)
      return
    }

    setEditingState(null)
    loadStates()
    const updatedState = states.find((s) => s.id === editingState.id)
    if (updatedState) {
      setSelectedState(updatedState)
    }
  }

  const handleCancel = () => {
    setEditingState(null)
    if (selectedState) {
      setFormData({
        cpe_requirements: selectedState.cpe_requirements || '',
        renewal_period: selectedState.renewal_period || '',
        renewal_month: selectedState.renewal_month || '',
        contact_info: selectedState.contact_info || '',
        website_url: selectedState.website_url || '',
        notes: selectedState.notes || '',
        cfp_notes: selectedState.cfp_notes || '',
        ea_otrp_erpa_notes: selectedState.ea_otrp_erpa_notes || '',
        cdfa_notes: selectedState.cdfa_notes || '',
        iar_notes: selectedState.iar_notes || '',
      })
    }
  }

  const filteredStates = states.filter((state) =>
    state.state_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    state.state_code.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return <div className="text-center py-12">Loading...</div>
  }

  const renderTabContent = () => {
    if (!selectedState) return null

    if (editingState?.id === selectedState.id) {
      // Edit mode
      if (activeTab === 'CPA') {
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CPE Requirements
              </label>
              <textarea
                value={formData.cpe_requirements}
                onChange={(e) => setFormData({ ...formData, cpe_requirements: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Renewal Period
              </label>
              <input
                type="text"
                value={formData.renewal_period}
                onChange={(e) => setFormData({ ...formData, renewal_period: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="e.g., Every 2 years"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CPA Renewal Month
              </label>
              <select
                value={formData.renewal_month}
                onChange={(e) => setFormData({ ...formData, renewal_month: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Select a month</option>
                {MONTHS.map((month) => (
                  <option key={month} value={month}>
                    {month}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contact Information
              </label>
              <textarea
                value={formData.contact_info}
                onChange={(e) => setFormData({ ...formData, contact_info: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                State Board URL
              </label>
              <input
                type="url"
                value={formData.website_url}
                onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="https://..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </>
        )
      } else {
        // Other tabs - just Notes field
        const notesField = 
          activeTab === 'CFP' ? 'cfp_notes' :
          activeTab === 'EA/OTRP/ERPA' ? 'ea_otrp_erpa_notes' :
          activeTab === 'CDFA' ? 'cdfa_notes' :
          'iar_notes'
        
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              value={formData[notesField as keyof typeof formData]}
              onChange={(e) => setFormData({ ...formData, [notesField]: e.target.value })}
              rows={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
        )
      }
    } else {
      // View mode
      if (activeTab === 'CPA') {
        return (
          <>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">CPE Requirements</h3>
              <p className="text-gray-700 whitespace-pre-wrap">
                {selectedState.cpe_requirements || 'No information available'}
              </p>
            </div>
            {selectedState.renewal_period && (
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Renewal Period</h3>
                <p className="text-gray-700">{selectedState.renewal_period}</p>
              </div>
            )}
            {selectedState.renewal_month && (
              <div>
                <h3 className="font-medium text-gray-900 mb-2">CPA Renewal Month</h3>
                <p className="text-gray-700">{selectedState.renewal_month}</p>
              </div>
            )}
            {selectedState.contact_info && (
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Contact Information</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{selectedState.contact_info}</p>
              </div>
            )}
            {selectedState.website_url && (
              <div>
                <h3 className="font-medium text-gray-900 mb-2">State Board URL</h3>
                <a
                  href={selectedState.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {selectedState.website_url}
                </a>
              </div>
            )}
            {selectedState.notes && (
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Notes</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{selectedState.notes}</p>
              </div>
            )}
          </>
        )
      } else {
        // Other tabs - just Notes
        const notesValue = 
          activeTab === 'CFP' ? selectedState.cfp_notes :
          activeTab === 'EA/OTRP/ERPA' ? selectedState.ea_otrp_erpa_notes :
          activeTab === 'CDFA' ? selectedState.cdfa_notes :
          selectedState.iar_notes
        
        return (
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Notes</h3>
            <p className="text-gray-700 whitespace-pre-wrap">
              {notesValue || 'No notes available'}
            </p>
          </div>
        )
      }
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Regulatory Information</h1>
        <p className="text-gray-600 mt-1">View and manage regulatory requirements by state</p>
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
              const state = states.find(s => s.id === e.target.value)
              if (state) handleSelectState(state)
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
                  Last updated: {format(new Date(selectedState.last_updated), 'MMM d, yyyy h:mm a')}
                </CardDescription>
              </div>
              {editingState?.id !== selectedState.id && (
                <Button variant="outline" size="sm" onClick={() => handleEdit(selectedState)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {/* Tabs */}
            <div className="flex gap-2 mb-6 border-b border-gray-200">
              {(['CPA', 'CFP', 'EA/OTRP/ERPA', 'CDFA', 'IAR'] as RegulatoryType[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                    activeTab === tab
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="space-y-4">
              {renderTabContent()}
            </div>

            {/* Save/Cancel buttons */}
            {editingState?.id === selectedState.id && (
              <div className="flex gap-2 mt-6">
                <Button onClick={handleSave}>
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </Button>
                <Button variant="outline" onClick={handleCancel}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            )}
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
