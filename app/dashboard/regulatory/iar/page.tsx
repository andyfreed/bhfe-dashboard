'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MapPin } from 'lucide-react'

// States and territories that have adopted IAR requirements
const ADOPTED_STATES: string[] = [
  'MD', // Maryland
  'MS', // Mississippi
  'VT', // Vermont
  'AR', // Arkansas
  'KY', // Kentucky
  'MI', // Michigan
  'OK', // Oklahoma
  'OR', // Oregon
  'SC', // South Carolina
  'DC', // Washington, D.C.
  'WI', // Wisconsin
  'CA', // California
  'CO', // Colorado
  'FL', // Florida
  'HI', // Hawaii
  'NV', // Nevada
  'ND', // North Dakota
  'TN', // Tennessee
  'MN', // Minnesota
  'NE', // Nebraska
  'NJ', // New Jersey
  'RI', // Rhode Island
  'VI', // U.S. Virgin Islands
]

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
  { code: 'DC', name: 'Washington, D.C.' }, { code: 'VI', name: 'U.S. Virgin Islands' },
]

export default function IARRegulatoryPage() {
  // Get state details for adopted states
  const adoptedStateDetails = ADOPTED_STATES.map(stateCode => {
    return US_STATES.find(s => s.code === stateCode) || { code: stateCode, name: stateCode }
  }).filter(Boolean)

  const notAdoptedStateDetails = US_STATES.filter(state => !ADOPTED_STATES.includes(state.code))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">IAR Regulatory Information</h1>
        <p className="text-gray-600 mt-1">States and territories that have adopted IAR requirements</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>CE Requirements</CardTitle>
          <CardDescription>
            NASAA model rule continuing education requirements for Investment Adviser Representatives
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Annual CE Requirements</h3>
              <p className="text-gray-700 mb-3">
                Every IAR in a jurisdiction that's adopted the NASAA model rule needs:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li><strong>12 hours of CE each year</strong>, made up of:
                  <ul className="list-disc list-inside ml-6 mt-1 space-y-1">
                    <li>6 hours Products & Practices</li>
                    <li>6 hours Ethics & Professional Responsibility</li>
                  </ul>
                </li>
              </ul>
            </div>
            <div className="border-t pt-4">
              <h3 className="font-medium text-gray-900 mb-2">Important Notes</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>Courses must be NASAA-approved and reported through FINRA/FinPro</li>
                <li>There's a one-year grace period</li>
                <li>Missing two years will result in the IAR going CE-inactive in those states</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-blue-600" />
            Adopted States
          </CardTitle>
          <CardDescription>
            {ADOPTED_STATES.length > 0 
              ? `${ADOPTED_STATES.length} state${ADOPTED_STATES.length !== 1 ? 's' : ''} have adopted IAR requirements`
              : 'No states have been added yet. Please provide the list of states.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {ADOPTED_STATES.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {adoptedStateDetails.map((state) => (
                <div
                  key={state.code}
                  className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg"
                >
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium text-gray-900">
                    {state.code} - {state.name}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>Waiting for list of adopted states to be provided.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {ADOPTED_STATES.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Not Yet Adopted</CardTitle>
            <CardDescription>
              {notAdoptedStateDetails.length} state{notAdoptedStateDetails.length !== 1 ? 's' : ''} have not yet adopted IAR requirements
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {notAdoptedStateDetails.map((state) => (
                <div
                  key={state.code}
                  className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg"
                >
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  <span className="text-sm text-gray-600">
                    {state.code} - {state.name}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
