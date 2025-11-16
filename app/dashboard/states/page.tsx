'use client'

import { useEffect, useState } from 'react'
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
  ce_requirements: string | null
  renewal_period: string | null
  contact_info: string | null
  website_url: string | null
  notes: string | null
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

export default function StatesPage() {
  const [states, setStates] = useState<StateInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedState, setSelectedState] = useState<StateInfo | null>(null)
  const [editingState, setEditingState] = useState<StateInfo | null>(null)
  const [formData, setFormData] = useState({
    cpe_requirements: '',
    ce_requirements: '',
    renewal_period: '',
    contact_info: '',
    website_url: '',
    notes: '',
  })
  const [searchTerm, setSearchTerm] = useState('')
  const supabase = createClient()

  useEffect(() => {
    loadStates()
    initializeStates()
  }, [supabase])

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
  }

  const handleEdit = (state: StateInfo) => {
    setEditingState(state)
    setFormData({
      cpe_requirements: state.cpe_requirements || '',
      ce_requirements: state.ce_requirements || '',
      renewal_period: state.renewal_period || '',
      contact_info: state.contact_info || '',
      website_url: state.website_url || '',
      notes: state.notes || '',
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
        ce_requirements: formData.ce_requirements || null,
        renewal_period: formData.renewal_period || null,
        contact_info: formData.contact_info || null,
        website_url: formData.website_url || null,
        notes: formData.notes || null,
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
        ce_requirements: selectedState.ce_requirements || '',
        renewal_period: selectedState.renewal_period || '',
        contact_info: selectedState.contact_info || '',
        website_url: selectedState.website_url || '',
        notes: selectedState.notes || '',
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">State CPE/CE Information</h1>
        <p className="text-gray-600 mt-1">View and manage CPE/CE requirements by state</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>States</CardTitle>
              <CardDescription>Select a state to view details</CardDescription>
            </CardHeader>
            <CardContent className="max-h-[600px] overflow-y-auto">
              <div className="space-y-1">
                {filteredStates.map((state) => (
                  <button
                    key={state.id}
                    onClick={() => handleSelectState(state)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                      selectedState?.id === state.id
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span className="font-medium">{state.state_code}</span>
                      <span>{state.state_name}</span>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
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
              <CardContent className="space-y-4">
                {editingState?.id === selectedState.id ? (
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
                        CE Requirements
                      </label>
                      <textarea
                        value={formData.ce_requirements}
                        onChange={(e) => setFormData({ ...formData, ce_requirements: e.target.value })}
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
                        Website URL
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
                    <div className="flex gap-2">
                      <Button onClick={handleSave}>
                        <Save className="h-4 w-4 mr-2" />
                        Save
                      </Button>
                      <Button variant="outline" onClick={handleCancel}>
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <h3 className="font-medium text-gray-900 mb-2">CPE Requirements</h3>
                      <p className="text-gray-700 whitespace-pre-wrap">
                        {selectedState.cpe_requirements || 'No information available'}
                      </p>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 mb-2">CE Requirements</h3>
                      <p className="text-gray-700 whitespace-pre-wrap">
                        {selectedState.ce_requirements || 'No information available'}
                      </p>
                    </div>
                    {selectedState.renewal_period && (
                      <div>
                        <h3 className="font-medium text-gray-900 mb-2">Renewal Period</h3>
                        <p className="text-gray-700">{selectedState.renewal_period}</p>
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
                        <h3 className="font-medium text-gray-900 mb-2">Website</h3>
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
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Select a state to view CPE/CE information</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

