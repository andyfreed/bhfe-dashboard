'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Trash2, Edit, FileText, Pin } from 'lucide-react'
import { format } from 'date-fns'

interface Note {
  id: string
  title: string
  content: string | null
  tags: string[] | null
  is_pinned: boolean
  user_id: string
  created_at: string
  updated_at: string
}

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    tags: '',
    is_pinned: false,
  })
  const supabase = createClient()

  useEffect(() => {
    loadNotes()
    subscribeToNotes()
  }, [supabase])

  const loadNotes = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', user.id)
      .order('is_pinned', { ascending: false })
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('Error loading notes:', error)
      return
    }

    setNotes(data || [])
    setLoading(false)
  }

  const subscribeToNotes = () => {
    const channel = supabase
      .channel('notes-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notes' },
        () => {
          loadNotes()
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

    const noteData = {
      title: formData.title,
      content: formData.content || null,
      tags: formData.tags
        ? formData.tags.split(',').map((tag) => tag.trim()).filter(Boolean)
        : [],
      is_pinned: formData.is_pinned,
      user_id: user.id,
    }

    if (editingNote) {
      const { error } = await supabase
        .from('notes')
        .update(noteData)
        .eq('id', editingNote.id)

      if (error) {
        console.error('Error updating note:', error)
        return
      }
    } else {
      const { error } = await supabase
        .from('notes')
        .insert([noteData])

      if (error) {
        console.error('Error creating note:', error)
        return
      }
    }

    resetForm()
    loadNotes()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return

    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting note:', error)
      return
    }

    loadNotes()
    if (selectedNote?.id === id) {
      setSelectedNote(null)
    }
  }

  const handleTogglePin = async (note: Note) => {
    const { error } = await supabase
      .from('notes')
      .update({ is_pinned: !note.is_pinned })
      .eq('id', note.id)

    if (error) {
      console.error('Error updating note:', error)
      return
    }

    loadNotes()
  }

  const handleEdit = (note: Note) => {
    setEditingNote(note)
    setFormData({
      title: note.title,
      content: note.content || '',
      tags: note.tags?.join(', ') || '',
      is_pinned: note.is_pinned,
    })
    setShowForm(true)
    setSelectedNote(null)
  }

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      tags: '',
      is_pinned: false,
    })
    setEditingNote(null)
    setShowForm(false)
  }

  const filteredNotes = notes.filter((note) =>
    note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    note.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    note.tags?.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const pinnedNotes = filteredNotes.filter((note) => note.is_pinned)
  const otherNotes = filteredNotes.filter((note) => !note.is_pinned)

  if (loading) {
    return <div className="text-center py-12">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Notes</h1>
          <p className="text-gray-600 mt-1">Keep track of your thoughts and ideas</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Note
        </Button>
      </div>

      <div>
        <input
          type="text"
          placeholder="Search notes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-md"
        />
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingNote ? 'Edit Note' : 'New Note'}</CardTitle>
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
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Content
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={10}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm"
                />
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
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.is_pinned}
                  onChange={(e) => setFormData({ ...formData, is_pinned: e.target.checked })}
                  className="rounded"
                />
                <label className="text-sm text-gray-700">Pin note</label>
              </div>
              <div className="flex gap-2">
                <Button type="submit">{editingNote ? 'Update' : 'Create'}</Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {selectedNote && (
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  {selectedNote.is_pinned && <Pin className="h-5 w-5 text-yellow-500 fill-current" />}
                  {selectedNote.title}
                </CardTitle>
                <CardDescription>
                  Updated {format(new Date(selectedNote.updated_at), 'MMM d, yyyy h:mm a')}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleEdit(selectedNote)} className="text-blue-600">
                  <Edit className="h-4 w-4" />
                </button>
                <button onClick={() => handleDelete(selectedNote.id)} className="text-red-600">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {selectedNote.tags && selectedNote.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {selectedNote.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
            <div className="prose max-w-none whitespace-pre-wrap">
              {selectedNote.content || <span className="text-gray-400">No content</span>}
            </div>
          </CardContent>
        </Card>
      )}

      {pinnedNotes.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Pinned Notes</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pinnedNotes.map((note) => (
              <Card
                key={note.id}
                className="hover:shadow-lg transition-shadow cursor-pointer border-yellow-200"
                onClick={() => setSelectedNote(note)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Pin className="h-4 w-4 text-yellow-500 fill-current" />
                      {note.title}
                    </CardTitle>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleTogglePin(note)
                      }}
                      className="text-yellow-600"
                    >
                      <Pin className="h-4 w-4" />
                    </button>
                  </div>
                  <CardDescription>
                    {format(new Date(note.updated_at), 'MMM d, yyyy')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 line-clamp-3">
                    {note.content || 'No content'}
                  </p>
                  {note.tags && note.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {note.tags.slice(0, 3).map((tag, index) => (
                        <span
                          key={index}
                          className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">All Notes</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {otherNotes.map((note) => (
            <Card
              key={note.id}
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setSelectedNote(note)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-4 w-4 text-pink-600" />
                    {note.title}
                  </CardTitle>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleTogglePin(note)
                    }}
                    className="text-gray-400 hover:text-yellow-600"
                  >
                    <Pin className="h-4 w-4" />
                  </button>
                </div>
                <CardDescription>
                  {format(new Date(note.updated_at), 'MMM d, yyyy')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 line-clamp-3">
                  {note.content || 'No content'}
                </p>
                {note.tags && note.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {note.tags.slice(0, 3).map((tag, index) => (
                      <span
                        key={index}
                        className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {filteredNotes.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">
              {searchTerm ? 'No notes found matching your search.' : 'No notes yet. Create your first note to get started.'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

