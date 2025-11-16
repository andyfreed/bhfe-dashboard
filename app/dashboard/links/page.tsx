'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Trash2, Edit, ExternalLink, Globe } from 'lucide-react'
import { format } from 'date-fns'

interface Link {
  id: string
  title: string
  url: string
  description: string | null
  icon: string | null
  order_index: number
  user_id: string
  created_at: string
  updated_at: string
}

export default function LinksPage() {
  const [links, setLinks] = useState<Link[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingLink, setEditingLink] = useState<Link | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    url: '',
    description: '',
    icon: '',
  })
  const supabase = createClient()

  useEffect(() => {
    loadLinks()
    subscribeToLinks()
  }, [supabase])

  const loadLinks = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('links')
      .select('*')
      .order('order_index', { ascending: true })
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error loading links:', error)
      return
    }

    setLinks(data || [])
    setLoading(false)
  }

  const subscribeToLinks = () => {
    const channel = supabase
      .channel('links-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'links' },
        () => {
          loadLinks()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const linkData = {
      title: formData.title,
      url: formData.url,
      description: formData.description || null,
      icon: formData.icon || null,
      user_id: user.id,
      order_index: links.length,
    }

    if (editingLink) {
      const { error } = await supabase
        .from('links')
        .update(linkData)
        .eq('id', editingLink.id)

      if (error) {
        console.error('Error updating link:', error)
        return
      }
    } else {
      const { error } = await supabase
        .from('links')
        .insert([linkData])

      if (error) {
        console.error('Error creating link:', error)
        return
      }
    }

    resetForm()
    loadLinks()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this link?')) return

    const { error } = await supabase
      .from('links')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting link:', error)
      return
    }

    loadLinks()
  }

  const handleEdit = (link: Link) => {
    setEditingLink(link)
    setFormData({
      title: link.title,
      url: link.url,
      description: link.description || '',
      icon: link.icon || '',
    })
    setShowForm(true)
  }

  const resetForm = () => {
    setFormData({
      title: '',
      url: '',
      description: '',
      icon: '',
    })
    setEditingLink(null)
    setShowForm(false)
  }

  const getDomainFromUrl = (url: string) => {
    try {
      const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`)
      return urlObj.hostname.replace('www.', '')
    } catch {
      return url
    }
  }

  if (loading) {
    return <div className="text-center py-12">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quick Links</h1>
          <p className="text-gray-600 mt-1">Manage your frequently visited websites</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Link
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingLink ? 'Edit Link' : 'New Link'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="e.g., Google"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL *
                </label>
                <input
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="https://example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Optional description"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Icon (URL or emoji)
                </label>
                <input
                  type="text"
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="🔗 or https://example.com/icon.png"
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit">{editingLink ? 'Update' : 'Create'}</Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {links.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Globe className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No links yet. Add your first link to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {links.map((link) => {
            const displayIcon = link.icon?.startsWith('http') ? (
              <img src={link.icon} alt={link.title} className="h-6 w-6" />
            ) : link.icon ? (
              <span className="text-2xl">{link.icon}</span>
            ) : (
              <Globe className="h-6 w-6 text-gray-400" />
            )

            return (
              <Card key={link.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {displayIcon}
                      <div className="flex-1">
                        <CardTitle className="text-lg">{link.title}</CardTitle>
                        {link.description && (
                          <CardDescription className="mt-1">{link.description}</CardDescription>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEdit(link)}
                        className="text-blue-600 hover:text-blue-700 p-1"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(link.id)}
                        className="text-red-600 hover:text-red-700 p-1"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <a
                    href={link.url.startsWith('http') ? link.url : `https://${link.url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 hover:underline"
                  >
                    <span className="text-sm truncate max-w-[200px]">
                      {getDomainFromUrl(link.url)}
                    </span>
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

