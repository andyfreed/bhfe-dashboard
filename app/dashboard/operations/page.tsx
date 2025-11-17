'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Settings, Plus, Edit, Save, X, Globe, Server, Package, Trash2 } from 'lucide-react'

interface DomainWebsite {
  name: string
  cost: string
  isHosted: 'Yes' | 'No'
  autoRenew: 'Yes' | 'No'
  expirationDate: string
}

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
  'Hosting and Domains',
  'WordPress Plugins',
  'Services',
  'Other',
]

export default function OperationsPage() {
  const [items, setItems] = useState<OperationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingItem, setEditingItem] = useState<OperationItem | null>(null)
  const [formData, setFormData] = useState({
    category: 'Hosting and Domains',
    title: '',
    description: '',
    details: '',
    cost: '',
    url: '',
  })
  const [domainsWebsites, setDomainsWebsites] = useState<DomainWebsite[]>([{ name: '', cost: '', isHosted: 'No', autoRenew: 'No', expirationDate: '' }])
  const [costFrequency, setCostFrequency] = useState<'monthly' | 'yearly' | 'paid-in-full'>('monthly')
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

    let submitData: any = {
      category: formData.category,
      title: formData.title,
      description: formData.description || null,
      url: formData.url || null,
    }

    // Handle category-specific fields
    if (formData.category === 'Hosting and Domains') {
      // Store domains/websites as JSON in details field
      const validDomains = domainsWebsites.filter(d => d.name.trim() !== '')
      submitData.details = JSON.stringify(validDomains)
      submitData.cost = null // No single cost field for this category
    } else if (formData.category === 'WordPress Plugins') {
      // Store cost with frequency: "amount|frequency"
      submitData.cost = formData.cost ? `${formData.cost}|${costFrequency}` : null
      submitData.details = null // No details field for plugins
    } else {
      // Other categories use standard fields
      submitData.details = formData.details || null
      submitData.cost = formData.cost || null
    }

    if (editingItem) {
      // Update existing item
      const { error } = await supabase
        .from('operations')
        .update(submitData)
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
        .insert(submitData)

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

    // Parse category-specific data
    if (item.category === 'Hosting and Domains' && item.details) {
      try {
        const parsed = JSON.parse(item.details)
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Ensure all domains have the new fields with defaults
          const domainsWithDefaults = parsed.map((d: any) => ({
            name: d.name || '',
            cost: d.cost || '',
            isHosted: d.isHosted || 'No',
            autoRenew: d.autoRenew || 'No',
            expirationDate: d.expirationDate || '',
          }))
          setDomainsWebsites(domainsWithDefaults)
        } else {
          setDomainsWebsites([{ name: '', cost: '', isHosted: 'No', autoRenew: 'No', expirationDate: '' }])
        }
      } catch {
        setDomainsWebsites([{ name: '', cost: '', isHosted: 'No', autoRenew: 'No', expirationDate: '' }])
      }
    } else {
      setDomainsWebsites([{ name: '', cost: '', isHosted: 'No', autoRenew: 'No', expirationDate: '' }])
    }

    if (item.category === 'WordPress Plugins' && item.cost) {
      const parts = item.cost.split('|')
      if (parts.length === 2) {
        setFormData(prev => ({ ...prev, cost: parts[0] }))
        setCostFrequency(parts[1] as 'monthly' | 'yearly' | 'paid-in-full')
      } else {
        setCostFrequency('monthly')
      }
    } else {
      setCostFrequency('monthly')
    }

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
      category: 'Hosting and Domains',
      title: '',
      description: '',
      details: '',
      cost: '',
      url: '',
    })
    setDomainsWebsites([{ name: '', cost: '', isHosted: 'No', autoRenew: 'No', expirationDate: '' }])
    setCostFrequency('monthly')
    setEditingItem(null)
    setShowForm(false)
  }

  const addDomainWebsite = () => {
    setDomainsWebsites([...domainsWebsites, { name: '', cost: '', isHosted: 'No', autoRenew: 'No', expirationDate: '' }])
  }

  const removeDomainWebsite = (index: number) => {
    if (domainsWebsites.length > 1) {
      setDomainsWebsites(domainsWebsites.filter((_, i) => i !== index))
    }
  }

  const updateDomainWebsite = (index: number, field: 'name' | 'cost' | 'isHosted' | 'autoRenew' | 'expirationDate', value: string) => {
    const updated = [...domainsWebsites]
    updated[index] = { ...updated[index], [field]: value }
    setDomainsWebsites(updated)
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Hosting and Domains':
        return Server
      case 'WordPress Plugins':
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
                  onChange={(e) => {
                    setFormData({ ...formData, category: e.target.value })
                    // Reset category-specific fields when changing category
                    if (e.target.value !== 'Hosting and Domains') {
                      setDomainsWebsites([{ name: '', cost: '', isHosted: 'No', autoRenew: 'No', expirationDate: '' }])
                    }
                    if (e.target.value !== 'WordPress Plugins') {
                      setCostFrequency('monthly')
                    }
                  }}
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

              {/* Title field - different label for WordPress Plugins */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {formData.category === 'WordPress Plugins' ? 'Name of Plugin *' : 'Title *'}
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                  placeholder={formData.category === 'WordPress Plugins' ? 'e.g., WooCommerce' : 'e.g., example.com domain'}
                />
              </div>

              {/* Description field - different label for WordPress Plugins */}
              {formData.category !== 'Hosting and Domains' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {formData.category === 'WordPress Plugins' ? 'Plugin Functionality' : 'Description'}
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder={formData.category === 'WordPress Plugins' ? 'What this plugin does' : 'Brief description'}
                  />
                </div>
              )}

              {/* Hosting and Domains - Dynamic domains fields */}
              {formData.category === 'Hosting and Domains' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Domains
                  </label>
                  <div className="space-y-4">
                    {domainsWebsites.map((domain, index) => (
                      <div key={index} className="p-4 border-2 border-gray-200 rounded-lg space-y-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold text-gray-700">Domain {index + 1}</span>
                          {domainsWebsites.length > 1 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeDomainWebsite(index)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Domain Name *
                            </label>
                            <input
                              type="text"
                              value={domain.name}
                              onChange={(e) => updateDomainWebsite(index, 'name', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                              placeholder="example.com"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Cost
                            </label>
                            <input
                              type="text"
                              value={domain.cost}
                              onChange={(e) => updateDomainWebsite(index, 'cost', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                              placeholder="e.g., $99/year"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Hosted on this Business Item?
                            </label>
                            <select
                              value={domain.isHosted}
                              onChange={(e) => updateDomainWebsite(index, 'isHosted', e.target.value as 'Yes' | 'No')}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            >
                              <option value="Yes">Yes</option>
                              <option value="No">No</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Auto Renew?
                            </label>
                            <select
                              value={domain.autoRenew}
                              onChange={(e) => updateDomainWebsite(index, 'autoRenew', e.target.value as 'Yes' | 'No')}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            >
                              <option value="Yes">Yes</option>
                              <option value="No">No</option>
                            </select>
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Expiration Date
                            </label>
                            <input
                              type="date"
                              value={domain.expirationDate}
                              onChange={(e) => updateDomainWebsite(index, 'expirationDate', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addDomainWebsite}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Another Domain
                    </Button>
                  </div>
                </div>
              )}

              {/* Details field - only for categories other than Hosting and Domains and WordPress Plugins */}
              {formData.category !== 'Hosting and Domains' && formData.category !== 'WordPress Plugins' && (
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
              )}

              {/* Cost field - different for WordPress Plugins */}
              {formData.category !== 'Hosting and Domains' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cost
                  </label>
                  {formData.category === 'WordPress Plugins' ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={formData.cost}
                        onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                        placeholder="e.g., $99"
                      />
                      <select
                        value={costFrequency}
                        onChange={(e) => setCostFrequency(e.target.value as 'monthly' | 'yearly' | 'paid-in-full')}
                        className="px-3 py-2 border border-gray-300 rounded-md"
                      >
                        <option value="monthly">Monthly</option>
                        <option value="yearly">Yearly</option>
                        <option value="paid-in-full">Paid in Full</option>
                      </select>
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={formData.cost}
                      onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="e.g., $99/year or $9.99/month"
                    />
                  )}
                </div>
              )}

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
                {item.category === 'Hosting and Domains' && item.details && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-2">Domains:</p>
                    {(() => {
                      try {
                        const domains = JSON.parse(item.details)
                        if (Array.isArray(domains)) {
                          return (
                            <div className="space-y-3">
                              {domains.map((domain: DomainWebsite, idx: number) => (
                                <div key={idx} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                                  <div className="flex justify-between items-start mb-2">
                                    <span className="text-sm font-semibold text-gray-900">{domain.name || 'Unnamed Domain'}</span>
                                    {domain.cost && (
                                      <span className="text-xs font-semibold text-gray-700">{domain.cost}</span>
                                    )}
                                  </div>
                                  <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div>
                                      <span className="text-gray-500">Hosted: </span>
                                      <span className={`font-medium ${domain.isHosted === 'Yes' ? 'text-green-600' : 'text-gray-700'}`}>
                                        {domain.isHosted || 'No'}
                                      </span>
                                    </div>
                                    <div>
                                      <span className="text-gray-500">Auto Renew: </span>
                                      <span className={`font-medium ${domain.autoRenew === 'Yes' ? 'text-green-600' : 'text-gray-700'}`}>
                                        {domain.autoRenew || 'No'}
                                      </span>
                                    </div>
                                    {domain.expirationDate && (
                                      <div className="col-span-2">
                                        <span className="text-gray-500">Expires: </span>
                                        <span className="font-medium text-gray-700">
                                          {(() => {
                                            try {
                                              const date = new Date(domain.expirationDate)
                                              if (isNaN(date.getTime())) {
                                                return domain.expirationDate
                                              }
                                              return date.toLocaleDateString('en-US', { 
                                                year: 'numeric', 
                                                month: 'long', 
                                                day: 'numeric' 
                                              })
                                            } catch {
                                              return domain.expirationDate
                                            }
                                          })()}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )
                        }
                      } catch {
                        return null
                      }
                    })()}
                  </div>
                )}
                {item.category !== 'Hosting and Domains' && item.details && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">Details:</p>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{item.details}</p>
                  </div>
                )}
                {item.cost && item.category !== 'Hosting and Domains' && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-500">Cost:</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {item.category === 'WordPress Plugins' && item.cost.includes('|')
                        ? item.cost.replace('|', ' ').replace('-', ' ')
                        : item.cost}
                    </span>
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

