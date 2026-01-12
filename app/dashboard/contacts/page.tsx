'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { OperationsTabs } from '@/components/dashboard/OperationsTabs'
import { Plus, Trash2, Edit, Users, Mail, Phone, Building, Globe, MapPin } from 'lucide-react'
import { format } from 'date-fns'

interface Contact {
  id: string
  name: string
  email: string | null
  email_2: string | null
  phone: string | null
  phone_2: string | null
  website: string | null
  fpa_chapter: string | null
  state: string | null
  company: string | null
  title: string | null
  notes: string | null
  tags: string[] | null
  user_id: string
  created_at: string
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingContact, setEditingContact] = useState<Contact | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    email_2: '',
    phone: '',
    phone_2: '',
    website: '',
    fpa_chapter: '',
    state: '',
    company: '',
    title: '',
    notes: '',
    tags: '',
  })
  const supabase = createClient()

  useEffect(() => {
    loadContacts()
    subscribeToContacts()
  }, [supabase])

  const loadContacts = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Load all contacts (shared across all users)
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .order('name', { ascending: true })

    if (error) {
      console.error('Error loading contacts:', error)
      return
    }

    setContacts(data || [])
    setLoading(false)
  }

  const subscribeToContacts = () => {
    const channel = supabase
      .channel('contacts-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'contacts' },
        () => {
          loadContacts()
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

    const contactData = {
      name: formData.name,
      email: formData.email || null,
      email_2: formData.email_2 || null,
      phone: formData.phone || null,
      phone_2: formData.phone_2 || null,
      website: formData.website || null,
      fpa_chapter: formData.fpa_chapter || null,
      state: formData.state || null,
      company: formData.company || null,
      title: formData.title || null,
      notes: formData.notes || null,
      tags: formData.tags
        ? formData.tags.split(',').map((tag) => tag.trim()).filter(Boolean)
        : [],
      user_id: user.id,
    }

    if (editingContact) {
      const { error } = await supabase
        .from('contacts')
        .update(contactData)
        .eq('id', editingContact.id)

      if (error) {
        console.error('Error updating contact:', error)
        return
      }
    } else {
      const { error } = await supabase
        .from('contacts')
        .insert([contactData])

      if (error) {
        console.error('Error creating contact:', error)
        return
      }
    }

    resetForm()
    loadContacts()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this contact?')) return

    const { error } = await supabase
      .from('contacts')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting contact:', error)
      return
    }

    loadContacts()
  }

  const handleEdit = (contact: Contact) => {
    setEditingContact(contact)
    setFormData({
      name: contact.name,
      email: contact.email || '',
      email_2: contact.email_2 || '',
      phone: contact.phone || '',
      phone_2: contact.phone_2 || '',
      website: contact.website || '',
      fpa_chapter: contact.fpa_chapter || '',
      state: contact.state || '',
      company: contact.company || '',
      title: contact.title || '',
      notes: contact.notes || '',
      tags: contact.tags?.join(', ') || '',
    })
    setShowForm(true)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      email_2: '',
      phone: '',
      phone_2: '',
      website: '',
      fpa_chapter: '',
      state: '',
      company: '',
      title: '',
      notes: '',
      tags: '',
    })
    setEditingContact(null)
    setShowForm(false)
  }

  // Get all unique tags from contacts
  const allTags = Array.from(
    new Set(
      contacts
        .flatMap(contact => contact.tags || [])
        .filter(Boolean)
    )
  ).sort()

  const filteredContacts = contacts.filter((contact) => {
    const matchesSearch = 
      contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.company?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesTag = selectedTag === null || (contact.tags && contact.tags.includes(selectedTag))
    
    return matchesSearch && matchesTag
  })

  if (loading) {
    return <div className="text-center py-12">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Contacts</h1>
          <p className="text-gray-600 mt-1">Manage your business contacts</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Contact
        </Button>
      </div>

      <OperationsTabs />

      <div className="space-y-4">
        <div>
          <input
            type="text"
            placeholder="Search contacts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-md"
          />
        </div>
        {allTags.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Tag:</label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedTag(null)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  selectedTag === null
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                All
              </button>
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    selectedTag === tag
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingContact ? 'Edit Contact' : 'New Contact'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email 2
                  </label>
                  <input
                    type="email"
                    value={formData.email_2}
                    onChange={(e) => setFormData({ ...formData, email_2: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone 2
                  </label>
                  <input
                    type="tel"
                    value={formData.phone_2}
                    onChange={(e) => setFormData({ ...formData, phone_2: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Website
                  </label>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    placeholder="https://example.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    FPA Chapter
                  </label>
                  <input
                    type="text"
                    value={formData.fpa_chapter}
                    onChange={(e) => setFormData({ ...formData, fpa_chapter: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  State
                </label>
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  placeholder="e.g., CA, NY, TX"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company
                  </label>
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="tag1, tag2, tag3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit">{editingContact ? 'Update' : 'Create'}</Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredContacts.map((contact) => (
          <Card key={contact.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-indigo-600" />
                    {contact.name}
                  </CardTitle>
                  {contact.title && (
                    <CardDescription>{contact.title}</CardDescription>
                  )}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleEdit(contact)} className="text-blue-600">
                    <Edit className="h-4 w-4" />
                  </button>
                  <button onClick={() => handleDelete(contact.id)} className="text-red-600">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {contact.company && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Building className="h-4 w-4" />
                  {contact.company}
                </div>
              )}
              {contact.email && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail className="h-4 w-4" />
                  <a href={`mailto:${contact.email}`} className="hover:text-blue-600">
                    {contact.email}
                  </a>
                </div>
              )}
              {contact.email_2 && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail className="h-4 w-4" />
                  <a href={`mailto:${contact.email_2}`} className="hover:text-blue-600">
                    {contact.email_2}
                  </a>
                </div>
              )}
              {contact.phone && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone className="h-4 w-4" />
                  <a href={`tel:${contact.phone}`} className="hover:text-blue-600">
                    {contact.phone}
                  </a>
                </div>
              )}
              {contact.phone_2 && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone className="h-4 w-4" />
                  <a href={`tel:${contact.phone_2}`} className="hover:text-blue-600">
                    {contact.phone_2}
                  </a>
                </div>
              )}
              {contact.website && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Globe className="h-4 w-4" />
                  <a 
                    href={contact.website.startsWith('http') ? contact.website : `https://${contact.website}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hover:text-blue-600"
                  >
                    {contact.website}
                  </a>
                </div>
              )}
              {contact.fpa_chapter && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Building className="h-4 w-4" />
                  <span>FPA Chapter: {contact.fpa_chapter}</span>
                </div>
              )}
              {contact.state && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="h-4 w-4" />
                  <span>{contact.state}</span>
                </div>
              )}
              {contact.tags && contact.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {contact.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              {contact.notes && (
                <div className="text-sm text-gray-600 mt-2 pt-2 border-t border-gray-200">
                  {contact.notes}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredContacts.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">
              {searchTerm ? 'No contacts found matching your search.' : 'No contacts yet. Add your first contact to get started.'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

