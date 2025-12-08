'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Settings, Palette, Check, Globe, Key } from 'lucide-react'

// Predefined color palette
const COLOR_OPTIONS = [
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Indigo', value: '#6366f1' },
  { name: 'Purple', value: '#8b5cf6' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Rose', value: '#f43f5e' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Amber', value: '#f59e0b' },
  { name: 'Yellow', value: '#eab308' },
  { name: 'Lime', value: '#84cc16' },
  { name: 'Green', value: '#22c55e' },
  { name: 'Emerald', value: '#10b981' },
  { name: 'Teal', value: '#14b8a6' },
  { name: 'Cyan', value: '#06b6d4' },
  { name: 'Sky', value: '#0ea5e9' },
  { name: 'Slate', value: '#64748b' },
  { name: 'Gray', value: '#9ca3af' },
]

interface AppSetting {
  key: string
  value: string
  description: string | null
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [unassignedColor, setUnassignedColor] = useState('#9ca3af')
  const [wordpressUrl, setWordpressUrl] = useState('')
  const [wordpressApiKey, setWordpressApiKey] = useState('')
  const [saveSuccess, setSaveSuccess] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    let urlFromDb = ''
    let keyFromDb = ''
    
    const { data, error } = await supabase
      .from('app_settings')
      .select('*')
      .in('key', ['unassigned_todo_color', 'wordpress_url', 'wordpress_api_key'])

    if (error) {
      console.error('Error loading settings:', error)
    } else if (data) {
      data.forEach((setting) => {
        if (setting.key === 'unassigned_todo_color') {
          setUnassignedColor(setting.value || '#9ca3af')
        } else if (setting.key === 'wordpress_url') {
          urlFromDb = setting.value || ''
          setWordpressUrl(urlFromDb)
        } else if (setting.key === 'wordpress_api_key') {
          keyFromDb = setting.value || ''
          setWordpressApiKey(keyFromDb)
        }
      })
    }
    
    // Fallback to localStorage if not in database (for backwards compatibility)
    if (!urlFromDb) {
      const localUrl = localStorage.getItem('bhfe_wordpress_url')
      const localKey = localStorage.getItem('bhfe_api_key')
      if (localUrl) setWordpressUrl(localUrl)
      if (localKey) setWordpressApiKey(localKey)
    }
    
    setLoading(false)
  }

  const handleSave = async () => {
    setSaving(true)
    setSaveSuccess(false)

    // Update or insert all settings
    const settingsToSave = [
      {
        key: 'unassigned_todo_color',
        value: unassignedColor,
        description: 'Color for unassigned todos',
        updated_at: new Date().toISOString(),
      },
      {
        key: 'wordpress_url',
        value: wordpressUrl.trim(),
        description: 'WordPress site URL for course sync and order monitoring',
        updated_at: new Date().toISOString(),
      },
      {
        key: 'wordpress_api_key',
        value: wordpressApiKey.trim(),
        description: 'API key for WordPress REST API authentication',
        updated_at: new Date().toISOString(),
      },
    ]

    const { error: upsertError } = await supabase
      .from('app_settings')
      .upsert(settingsToSave, {
        onConflict: 'key'
      })

    if (upsertError) {
      console.error('Error saving settings:', upsertError)
    } else {
      // Also sync to localStorage for backwards compatibility
      if (wordpressUrl.trim()) {
        localStorage.setItem('bhfe_wordpress_url', wordpressUrl.trim())
      }
      if (wordpressApiKey.trim()) {
        localStorage.setItem('bhfe_api_key', wordpressApiKey.trim())
      }
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    }

    setSaving(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading settings...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">Manage application-wide settings</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Unassigned Todo Color
          </CardTitle>
          <CardDescription>
            Choose the color that will be used for todos that are not assigned to any user. This setting applies to all users.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Color Preview
            </label>
            <div className="flex items-center gap-4 mb-4">
              <div
                className="w-16 h-16 rounded-lg border-2 border-gray-300 shadow-sm"
                style={{ backgroundColor: unassignedColor }}
              />
              <div>
                <p className="text-sm font-medium text-gray-900">Unassigned Todo</p>
                <p className="text-xs text-gray-500">This color will appear on unassigned todos</p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select Color
            </label>
            <div className="grid grid-cols-8 gap-3 mb-4">
              {COLOR_OPTIONS.map((color) => (
                <button
                  key={color.value}
                  onClick={() => setUnassignedColor(color.value)}
                  className={`
                    w-12 h-12 rounded-lg border-2 transition-all
                    ${unassignedColor === color.value
                      ? 'border-gray-900 shadow-lg scale-110'
                      : 'border-gray-300 hover:border-gray-400 hover:scale-105'
                    }
                  `}
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Custom Color
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={unassignedColor}
                onChange={(e) => setUnassignedColor(e.target.value)}
                className="w-20 h-10 rounded border-2 border-gray-300 cursor-pointer"
              />
              <input
                type="text"
                value={unassignedColor}
                onChange={(e) => {
                  const value = e.target.value
                  if (/^#[0-9A-F]{6}$/i.test(value)) {
                    setUnassignedColor(value)
                  }
                }}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md font-mono text-sm"
                placeholder="#9ca3af"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            {saveSuccess && (
              <div className="flex items-center gap-2 text-green-600">
                <Check className="h-4 w-4" />
                <span className="text-sm font-medium">Settings saved!</span>
              </div>
            )}
            <Button
              onClick={handleSave}
              disabled={saving}
              className="min-w-[100px]"
            >
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            WordPress Integration
          </CardTitle>
          <CardDescription>
            Configure WordPress URL and API key for course syncing and order monitoring. These settings apply to all users.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              WordPress Site URL
            </label>
            <input
              type="url"
              value={wordpressUrl}
              onChange={(e) => setWordpressUrl(e.target.value)}
              placeholder="https://yoursite.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              The base URL of your WordPress site (e.g., https://www.bhfe.com)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              API Key
            </label>
            <input
              type="password"
              value={wordpressApiKey}
              onChange={(e) => setWordpressApiKey(e.target.value)}
              placeholder="Leave empty if not configured"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              API key configured in WordPress Settings &gt; BHFE Course Sync
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            {saveSuccess && (
              <div className="flex items-center gap-2 text-green-600">
                <Check className="h-4 w-4" />
                <span className="text-sm font-medium">Settings saved!</span>
              </div>
            )}
            <Button
              onClick={handleSave}
              disabled={saving}
              className="min-w-[100px]"
            >
              {saving ? 'Saving...' : 'Save All Settings'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
