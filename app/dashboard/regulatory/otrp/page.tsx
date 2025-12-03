'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText } from 'lucide-react'

export default function OTRPRegulatoryPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">OTRP Regulatory Information</h1>
        <p className="text-gray-600 mt-1">Other Tax Return Preparer continuing education requirements</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            OTRP Governing Body Requirements
          </CardTitle>
          <CardDescription>
            Information about IRS continuing education requirements for Other Tax Return Preparers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-gray-600">
              This page will allow you to track OTRP regulatory requirements. Fields can be added and customized as needed.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

