'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { User, Palette, Check, Mail } from 'lucide-react'

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
]

interface Profile {
  id: string
  name: string
  email: string
  user_color: string | null
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedColor, setSelectedColor] = useState('#3b82f6')
  const [name, setName] = useState('')
  const [saveSuccess, setSaveSuccess] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error) {
      console.error('Error loading profile:', error)
      return
    }

    if (data) {
      setProfile(data)
      setSelectedColor(data.user_color || '#3b82f6')
      setName(data.name || '')
    }
    setLoading(false)
  }

  const handleSave = async () => {
    if (!profile) return

    setSaving(true)
    setSaveSuccess(false)

    const { error } = await supabase
      .from('profiles')
      .update({
        name: name,
        user_color: selectedColor,
        updated_at: new Date().toISOString(),
      })
      .eq('id', profile.id)

    if (error) {
      console.error('Error saving profile:', error)
    } else {
      setSaveSuccess(true)
      setProfile({ ...profile, name, user_color: selectedColor })
      setTimeout(() => setSaveSuccess(false), 3000)
    }

    setSaving(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <div className="text-slate-600 font-medium">Loading profile...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
        <p className="text-gray-600 mt-1">Manage your personal information and preferences</p>
      </div>

      {/* Profile Info Card */}
      <Card className="border-2 border-slate-300">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile Information
          </CardTitle>
          <CardDescription>
            Your basic profile details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
              Display Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Your name"
            />
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email
              </div>
            </label>
            <div className="px-4 py-2 bg-gray-100 rounded-md text-gray-600">
              {profile?.email}
            </div>
            <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
          </div>
        </CardContent>
      </Card>

      {/* Color Selection Card */}
      <Card className="border-2 border-slate-300">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Your Color
          </CardTitle>
          <CardDescription>
            Choose a color to identify your tasks and items throughout the app
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current Color Preview */}
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
            <div
              className="w-16 h-16 rounded-xl shadow-lg border-2 border-white"
              style={{ backgroundColor: selectedColor }}
            />
            <div>
              <div className="font-semibold text-gray-900">Selected Color</div>
              <div className="text-sm text-gray-600 font-mono">{selectedColor}</div>
              <div className="text-xs text-gray-500 mt-1">
                {COLOR_OPTIONS.find(c => c.value === selectedColor)?.name || 'Custom'}
              </div>
            </div>
          </div>

          {/* Color Grid */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Choose a color
            </label>
            <div className="grid grid-cols-8 gap-2">
              {COLOR_OPTIONS.map((color) => (
                <button
                  key={color.value}
                  onClick={() => setSelectedColor(color.value)}
                  className={`
                    w-10 h-10 rounded-lg transition-all duration-200 relative
                    ${selectedColor === color.value 
                      ? 'ring-2 ring-offset-2 ring-gray-900 scale-110' 
                      : 'hover:scale-105 hover:shadow-md'
                    }
                  `}
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                >
                  {selectedColor === color.value && (
                    <Check className="h-5 w-5 text-white absolute inset-0 m-auto drop-shadow-md" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Color Input */}
          <div>
            <label htmlFor="custom-color" className="block text-sm font-semibold text-gray-700 mb-2">
              Or enter a custom color
            </label>
            <div className="flex gap-2">
              <input
                id="custom-color"
                type="color"
                value={selectedColor}
                onChange={(e) => setSelectedColor(e.target.value)}
                className="w-12 h-10 rounded cursor-pointer border border-gray-300"
              />
              <input
                type="text"
                value={selectedColor}
                onChange={(e) => setSelectedColor(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                placeholder="#3b82f6"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex items-center gap-4">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="px-6"
          style={{ backgroundColor: selectedColor }}
        >
          {saving ? (
            <>
              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Saving...
            </>
          ) : (
            <>
              <Check className="h-4 w-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
        
        {saveSuccess && (
          <div className="flex items-center gap-2 text-green-600 font-medium animate-in fade-in">
            <Check className="h-5 w-5" />
            Profile saved successfully!
          </div>
        )}
      </div>
    </div>
  )
}

