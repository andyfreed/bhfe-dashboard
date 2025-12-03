'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText } from 'lucide-react'

export default function ERPARegulatoryPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">ERPA Regulatory Information</h1>
        <p className="text-gray-600 mt-1">Enrolled Retirement Plan Agent continuing education requirements</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            CE Requirements
          </CardTitle>
          <CardDescription>
            IRS continuing education requirements for Enrolled Retirement Plan Agents
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Continuing Education Requirements</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li><strong>72 CE hours every 3 years</strong></li>
                <li><strong>Annual minimum:</strong> At least 16 hours per year, of which:
                  <ul className="list-disc list-inside ml-6 mt-1 space-y-1">
                    <li>2 hours must be ethics or professional conduct</li>
                  </ul>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

