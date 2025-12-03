'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText } from 'lucide-react'

export default function CDFARegulatoryPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">CDFA Regulatory Information</h1>
        <p className="text-gray-600 mt-1">View and manage CDFA regulatory requirements</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            CE Requirements
          </CardTitle>
          <CardDescription>
            Institute for Divorce Financial Analysts continuing education requirements for Certified Divorce Financial Analysts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Continuing Education Requirements</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li><strong>30 hours of divorce‑related CE every 2 years</strong></li>
                <li><strong>Content:</strong> Must be specifically related to divorce/financial aspects of divorce, including:
                  <ul className="list-disc list-inside ml-6 mt-1 space-y-1">
                    <li>Property division</li>
                    <li>Support</li>
                    <li>Pensions</li>
                    <li>Tax issues</li>
                    <li>Other financial aspects of divorce</li>
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

