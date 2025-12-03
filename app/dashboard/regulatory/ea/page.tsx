'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText } from 'lucide-react'

export default function EARegulatoryPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">EA Regulatory Information</h1>
        <p className="text-gray-600 mt-1">Enrolled Agent continuing education requirements</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            CE Requirements
          </CardTitle>
          <CardDescription>
            IRS continuing education requirements for Enrolled Agents
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Continuing Education Requirements</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li><strong>72 CE hours every 3-year enrollment cycle</strong></li>
                <li><strong>Annual minimum:</strong> At least 16 hours per year, including:
                  <ul className="list-disc list-inside ml-6 mt-1 space-y-1">
                    <li>2 hours of ethics or professional conduct each year</li>
                  </ul>
                </li>
                <li><strong>Ethics total:</strong> At least 6 ethics hours over the 3-year cycle</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

