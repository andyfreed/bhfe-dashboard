'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Settings, Plus, Edit, Save, X, Globe, Server, Package } from 'lucide-react'

interface OperationItem {
  id: string
  category: string
  title: string
  description: string | null
  details: string | null
  cost: string | null
  url: string | null
  created_at: string
  updated_at: string
}

const CATEGORIES = [
  'Domain',
  'Hosting',
  'WordPress Plugin',
  'Service',
  'Other',
]

export default function OperationsPage() {
  const [items, setItems] = useState<OperationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingItem, setEditingItem] = useState<OperationItem | null>(null)
  const [formData, setFormData] = useState({
    category: 'Domain',
    title: '',
    description: '',
    details: '',
    cost: '',
    url: '',
  })
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const supabase = createClient()

  useEffect(() => {
    loadItems()
  }, [supabase])

  const loadItems = async () => {
    const { data, error } = await supabase
      .from('operations')
      .select('*')
      .order('category', { ascending: true })
      .order('title', { ascending: true })

    if (error) {
      console.error('Error loading operations:', error)
      return
    }

    setItems(data || [])
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    if (editingItem) {
      // Update existing item
      const { error } = await supabase
        .from('operations')
        .update({
          category: formData.category,
          title: formData.title,
          description: formData.description || null,
          details: formData.details || null,
          cost: formData.cost || null,
          url: formData.url || null,
        })
        .eq('id', editingItem.id)

      if (error) {
        console.error('Error updating operation:', error)
        alert('Failed to update item. Please try again.')
        return
      }
    } else {
      // Create new item
      const { error } = await supabase
        .from('operations')
        .insert({
          category: formData.category,
          title: formData.title,
          description: formData.description || null,
          details: formData.details || null,
          cost: formData.cost || null,
          url: formData.url || null,
        })

      if (error) {
        console.error('Error creating operation:', error)
        alert('Failed to create item. Please try again.')
        return
      }
    }

    resetForm()
    loadItems()
  }

  const handleEdit = (item: OperationItem) => {
    setEditingItem(item)
    setFormData({
      category: item.category,
      title: item.title,
      description: item.description || '',
      details: item.details || '',
      cost: item.cost || '',
      url: item.url || '',
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return

    const { error } = await supabase
      .from('operations')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting operation:', error)
      alert('Failed to delete item. Please try again.')
      return
    }

    loadItems()
  }

  const resetForm = () => {
    setFormData({
      category: 'Domain',
      title: '',
      description: '',
      details: '',
      cost: '',
      url: '',
    })
    setEditingItem(null)
    setShowForm(false)
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Domain':
        return Globe
      case 'Hosting':
        return Server
      case 'WordPress Plugin':
        return Package
      default:
        return Settings
    }
  }

  const filteredItems = selectedCategory === 'All'
    ? items
    : items.filter(item => item.category === selectedCategory)

  const categories = ['All', ...CATEGORIES]

  if (loading) {
    return <div className="text-center py-12">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Operations</h1>
          <p className="text-gray-600 mt-1">Track technical business information</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Item
        </Button>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 flex-wrap">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedCategory === category
                ? 'bg-blue-600 text-white'
                : 'bg-white text-slate-700 border-2 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingItem ? 'Edit Item' : 'Add New Item'}</CardTitle>
            <CardDescription>
              {editingItem ? 'Update the operation item' : 'Add a new technical business item'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                  placeholder="e.g., example.com domain"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Brief description"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Details
                </label>
                <textarea
                  value={formData.details}
                  onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Additional details, notes, configuration info, etc."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cost
                </label>
                <input
                  type="text"
                  value={formData.cost}
                  onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="e.g., $99/year or $9.99/month"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL
                </label>
                <input
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="https://..."
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit">
                  <Save className="h-4 w-4 mr-2" />
                  {editingItem ? 'Update' : 'Create'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map((item) => {
          const Icon = getCategoryIcon(item.category)
          return (
            <Card key={item.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-100">
                      <Icon className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{item.title}</CardTitle>
                      <CardDescription className="mt-1">{item.category}</CardDescription>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(item)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(item.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {item.description && (
                  <p className="text-sm text-gray-700">{item.description}</p>
                )}
                {item.details && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">Details:</p>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{item.details}</p>
                  </div>
                )}
                {item.cost && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-500">Cost:</span>
                    <span className="text-sm font-semibold text-gray-900">{item.cost}</span>
                  </div>
                )}
                {item.url && (
                  <div>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <Globe className="h-3 w-3" />
                      Visit URL
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {filteredItems.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">
              {selectedCategory === 'All' 
                ? 'No operations items yet. Add your first item to get started!'
                : `No items in the ${selectedCategory} category.`}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

