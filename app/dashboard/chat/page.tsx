'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Download, MessageSquare, Paperclip, Reply, Send, Trash2, X } from 'lucide-react'
import { format } from 'date-fns'
import { useNotifications } from '@/hooks/useNotifications'

interface ChatMessage {
  id: string
  sender_id: string
  receiver_id: string
  message_group_id?: string | null
  reply_to_group_id?: string | null
  message: string
  is_read: boolean
  created_at: string
}

interface ChatAttachment {
  id: string
  message_group_id: string
  uploader_id: string
  file_name: string
  storage_path: string
  size_bytes: number | null
  content_type: string | null
  created_at: string
}

interface Profile {
  id: string
  name: string
  email: string
}

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [attachmentsByGroup, setAttachmentsByGroup] = useState<Record<string, ChatAttachment[]>>({})
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null)
  const [allUsers, setAllUsers] = useState<Profile[]>([])
  const [currentUser, setCurrentUser] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messageInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const previousMessageCountRef = useRef<number>(0)
  const supabase = createClient()
  const { permission, notify } = useNotifications()
  const chatBucket = 'chat-attachments'

  const getMessageGroupId = (message: ChatMessage) => message.message_group_id || message.id

  const messageMap = useMemo(() => {
    const map = new Map<string, ChatMessage>()
    messages.forEach((message) => {
      map.set(getMessageGroupId(message), message)
    })
    return map
  }, [messages])

  useEffect(() => {
    initializeChat()
    subscribeToMessages()
  }, [supabase])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const initializeChat = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Get current user profile
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileData) {
      setCurrentUser(profileData)
    } else {
      // Create profile if doesn't exist
      const { data: newProfile } = await supabase
        .from('profiles')
        .insert([{ id: user.id, name: user.email?.split('@')[0] || 'User', email: user.email || '' }])
        .select()
        .single()

      if (newProfile) {
        setCurrentUser(newProfile)
      }
    }

    // Get all users for group chat
    const { data: allProfiles } = await supabase
      .from('profiles')
      .select('*')

    if (allProfiles) {
      setAllUsers(allProfiles)
      loadAllMessages()
    }

    setLoading(false)
  }

  const loadAllMessages = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Load all messages for group chat
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error loading messages:', error)
      return
    }

    // Deduplicate group chat messages using the shared group id (fallback to id for older rows)
    const uniqueMessages = (data || []).reduce((acc: ChatMessage[], message: ChatMessage) => {
      const groupId = message.message_group_id || message.id
      const existing = acc.find((m) => (m.message_group_id || m.id) === groupId)
      if (!existing) {
        acc.push(message)
      }
      return acc
    }, [])

    setMessages(uniqueMessages)

    if (uniqueMessages.length > 0) {
      const groupIds = uniqueMessages.map((message) => message.message_group_id || message.id)
      const { data: attachmentsData, error: attachmentsError } = await supabase
        .from('chat_attachments')
        .select('*')
        .in('message_group_id', groupIds)
        .order('created_at', { ascending: true })

      if (attachmentsError) {
        console.error('Error loading attachments:', attachmentsError)
      } else {
        const grouped = (attachmentsData || []).reduce((acc, attachment) => {
          if (!acc[attachment.message_group_id]) {
            acc[attachment.message_group_id] = []
          }
          acc[attachment.message_group_id].push(attachment)
          return acc
        }, {} as Record<string, ChatAttachment[]>)
        setAttachmentsByGroup(grouped)
      }
    } else {
      setAttachmentsByGroup({})
    }

    // Show notification if new messages arrived and user is not on chat page
    const newMessageCount = uniqueMessages.length
    const isOnChatPage = typeof window !== 'undefined' && window.location.pathname === '/dashboard/chat'
    
    // Check if new messages arrived
    if (
      previousMessageCountRef.current > 0 && 
      newMessageCount > previousMessageCountRef.current &&
      permission === 'granted'
    ) {
      // Find the latest new message
      const newMessages = uniqueMessages.slice(previousMessageCountRef.current)
      const latestMessage = newMessages[newMessages.length - 1]
      const sender = allUsers.find(u => u.id === latestMessage.sender_id)
      
      // Show notification if not on chat page
      // On iOS, notifications work when app is in background
      // Note: iOS PWAs cannot receive notifications when app is fully closed
      if (sender && !isOnChatPage) {
        try {
          const isAppHidden = typeof document !== 'undefined' && document.hidden
          console.log('[Chat] Showing notification for new message:', {
            sender: sender.name || sender.email?.split('@')[0],
            message: latestMessage.message.substring(0, 50),
            isOnChatPage,
            isAppHidden,
            permission,
          })
          
          await notify(`New message from ${sender.name || sender.email?.split('@')[0]}`, {
            body: latestMessage.message.substring(0, 100) + (latestMessage.message.length > 100 ? '...' : ''),
            tag: 'chat-message',
            requireInteraction: false,
            silent: false,
          })
        } catch (error) {
          console.error('[Chat] Error showing notification:', error)
        }
      } else if (isOnChatPage) {
        console.log('[Chat] Notification skipped (on chat page)')
      }
    }
    
    previousMessageCountRef.current = newMessageCount

    // Mark messages as read for current user
    await supabase
      .from('chat_messages')
      .update({ is_read: true })
      .eq('receiver_id', user.id)
      .eq('is_read', false)
  }

  const subscribeToMessages = () => {
    const channel = supabase
      .channel('chat-messages')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'chat_messages' },
        async () => {
          loadAllMessages()
        }
      )
      .subscribe()

    // Set up periodic checking for when app becomes visible
    // This helps catch messages when app was closed and reopened
    let visibilityCheckInterval: NodeJS.Timeout | null = null
    
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // App went to background - clear interval
        if (visibilityCheckInterval) {
          clearInterval(visibilityCheckInterval)
          visibilityCheckInterval = null
        }
      } else {
        // App became visible - check for messages immediately
        loadAllMessages()
        // Set up periodic checking every 30 seconds while visible
        if (visibilityCheckInterval) {
          clearInterval(visibilityCheckInterval)
        }
        visibilityCheckInterval = setInterval(() => {
          if (!document.hidden) {
            loadAllMessages()
          } else {
            if (visibilityCheckInterval) {
              clearInterval(visibilityCheckInterval)
              visibilityCheckInterval = null
            }
          }
        }, 30000) // Check every 30 seconds
      }
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    // Initial check if app is visible
    if (!document.hidden) {
      handleVisibilityChange()
    }

    return () => {
      supabase.removeChannel(channel)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      if (visibilityCheckInterval) {
        clearInterval(visibilityCheckInterval)
      }
    }
  }

  const sanitizeFileName = (name: string) => name.replace(/[^a-zA-Z0-9._-]/g, '_')

  const formatFileSize = (sizeBytes: number | null) => {
    if (!sizeBytes) return ''
    const units = ['B', 'KB', 'MB', 'GB']
    let size = sizeBytes
    let unitIndex = 0
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024
      unitIndex += 1
    }
    return `${size.toFixed(size >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`
  }

  const handleAddFiles = (files: FileList | File[]) => {
    const fileArray = Array.from(files)
    if (fileArray.length === 0) return
    setPendingFiles((prev) => [...prev, ...fileArray])
  }

  const handleReply = (message: ChatMessage) => {
    setReplyTo(message)
    messageInputRef.current?.focus()
  }

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    if (!isDragging) {
      setIsDragging(true)
    }
  }

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    if (event.currentTarget === event.target) {
      setIsDragging(false)
    }
  }

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragging(false)
    if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      handleAddFiles(event.dataTransfer.files)
      event.dataTransfer.clearData()
    }
  }

  const handleDeleteAttachment = async (attachment: ChatAttachment) => {
    if (!confirm(`Delete "${attachment.file_name}"?`)) return

    const { error: storageError } = await supabase
      .storage
      .from(chatBucket)
      .remove([attachment.storage_path])

    if (storageError) {
      console.error('Error deleting attachment file:', storageError)
    }

    const { error: deleteError } = await supabase
      .from('chat_attachments')
      .delete()
      .eq('id', attachment.id)

    if (deleteError) {
      console.error('Error deleting attachment record:', deleteError)
      return
    }

    setAttachmentsByGroup((prev) => {
      const next = { ...prev }
      const existing = next[attachment.message_group_id] || []
      next[attachment.message_group_id] = existing.filter((item) => item.id !== attachment.id)
      return next
    })
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if ((!newMessage.trim() && pendingFiles.length === 0) || !currentUser) return

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Send message to all other users (group chat)
    const otherUsers = allUsers.filter((u) => u.id !== user.id)
    
    if (otherUsers.length > 0) {
      const messageGroupId = crypto.randomUUID()
      const replyToGroupId = replyTo ? (replyTo.message_group_id || replyTo.id) : null
      const messagesToInsert = otherUsers.map((otherUser) => ({
        sender_id: user.id,
        receiver_id: otherUser.id,
        message_group_id: messageGroupId,
        reply_to_group_id: replyToGroupId,
        message: newMessage.trim(),
      }))

      const { error } = await supabase
        .from('chat_messages')
        .insert(messagesToInsert)

      if (error) {
        console.error('Error sending message:', error)
        return
      }

      if (pendingFiles.length > 0) {
        const uploads = []
        for (const file of pendingFiles) {
          const safeName = sanitizeFileName(file.name)
          const storagePath = `${messageGroupId}/${Date.now()}-${safeName}`
          const { error: uploadError } = await supabase
            .storage
            .from(chatBucket)
            .upload(storagePath, file, {
              contentType: file.type || 'application/octet-stream',
            })

          if (uploadError) {
            console.error('Error uploading attachment:', uploadError)
            continue
          }

          uploads.push({
            message_group_id: messageGroupId,
            uploader_id: user.id,
            file_name: file.name,
            storage_path: storagePath,
            size_bytes: file.size,
            content_type: file.type || null,
          })
        }

        if (uploads.length > 0) {
          const { error: attachmentError } = await supabase
            .from('chat_attachments')
            .insert(uploads)

          if (attachmentError) {
            console.error('Error saving attachment metadata:', attachmentError)
          }
        }
      }

      // Send push notifications to all receivers
      const senderName = currentUser.name || currentUser.email?.split('@')[0] || 'Someone'
      const trimmedMessage = newMessage.trim()
      const messagePreview = trimmedMessage
        ? trimmedMessage.substring(0, 100) + (trimmedMessage.length > 100 ? '...' : '')
        : pendingFiles.length > 0
          ? `Sent ${pendingFiles.length} file${pendingFiles.length === 1 ? '' : 's'}`
          : 'Sent a message'
      
      // Send push notification to each receiver
      for (const otherUser of otherUsers) {
        try {
          console.log('[Chat] Sending push notification to:', {
            name: otherUser.name || otherUser.email,
            userId: otherUser.id,
            email: otherUser.email,
          })
          const pushResponse = await fetch('/api/push/send', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              receiverId: otherUser.id,
              title: `New message from ${senderName}`,
              body: messagePreview,
              tag: 'chat-message',
              icon: '/icon-192x192.png',
              badge: '/icon-192x192.png',
              data: {
                url: '/dashboard/chat',
                type: 'chat-message',
              },
            }),
          })
          
          const pushResult = await pushResponse.json()
          console.log('[Chat] Push notification result:', pushResult)
          
          if (!pushResponse.ok) {
            console.error('[Chat] Push notification failed:', pushResult)
          }
        } catch (pushError) {
          console.error('[Chat] Error sending push notification:', pushError)
          // Don't fail message sending if push notification fails
        }
      }
    }

    setNewMessage('')
    setPendingFiles([])
    setReplyTo(null)
    loadAllMessages()
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleDeleteHistory = async () => {
    if (!currentUser) return
    if (!confirm('Are you sure you want to delete all chat history? This action cannot be undone.')) return

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Delete all messages where current user is sender or receiver
    // Use separate queries for sender and receiver to avoid OR clause issues
    const { error: senderError } = await supabase
      .from('chat_messages')
      .delete()
      .eq('sender_id', user.id)

    const { error: receiverError } = await supabase
      .from('chat_messages')
      .delete()
      .eq('receiver_id', user.id)

    if (senderError || receiverError) {
      console.error('Error deleting chat history:', senderError || receiverError)
      alert('Failed to delete chat history. Please try again.')
      return
    }

    // Clear messages immediately and reload to ensure UI updates
    setMessages([])
    // Small delay to ensure database operations complete before reloading
    setTimeout(() => {
      loadAllMessages()
    }, 100)
  }

  if (loading) {
    return <div className="text-center py-12">Loading...</div>
  }

  if (!currentUser) {
    return (
      <div className="text-center py-12">
        <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">Loading chat...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Chat</h1>
        <p className="text-gray-600 mt-1">Real-time messaging</p>
      </div>

      <Card className="flex flex-col h-[calc(100vh-250px)]">
        <CardHeader className="border-b border-gray-200">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Team Chat
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDeleteHistory}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete History
            </Button>
          </div>
        </CardHeader>
        <CardContent
          className="relative flex-1 overflow-y-auto p-4 space-y-4"
          onDragEnter={handleDragOver}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {isDragging && (
            <div className="absolute inset-0 z-10 flex items-center justify-center rounded-b-lg border-2 border-dashed border-blue-400 bg-blue-50/80 text-blue-700 text-sm font-semibold">
              Drop files to upload
            </div>
          )}
          {messages.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No messages yet. Start the conversation!
            </div>
          ) : (
            messages.map((message) => {
              const isOwnMessage = message.sender_id === currentUser.id
              const sender = allUsers.find((u) => u.id === message.sender_id)
              const senderName = sender?.name || 'Unknown'
              const groupId = getMessageGroupId(message)
              const attachments = attachmentsByGroup[groupId] || []
              const replyToMessage = message.reply_to_group_id ? messageMap.get(message.reply_to_group_id) : null
              const replySender = replyToMessage
                ? allUsers.find((u) => u.id === replyToMessage.sender_id)
                : null
              
              return (
                <div
                  key={message.id}
                  className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      isOwnMessage
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-900'
                    }`}
                  >
                    {!isOwnMessage && (
                      <p className="text-xs font-semibold mb-1 text-gray-700">
                        {senderName}
                      </p>
                    )}
                    {replyToMessage && (
                      <div className={`mb-2 rounded-md border px-2 py-1 text-xs ${
                        isOwnMessage ? 'border-blue-300/60 bg-blue-500/30 text-blue-50' : 'border-gray-300 bg-white/70 text-gray-700'
                      }`}>
                        <div className="font-semibold">
                          Replying to {replySender?.name || replySender?.email?.split('@')[0] || 'Unknown'}
                        </div>
                        <div className="truncate">
                          {replyToMessage.message || 'Attachment'}
                        </div>
                      </div>
                    )}
                    {message.message && <p className="text-sm">{message.message}</p>}
                    {attachments.length > 0 && (
                      <div className="mt-2 space-y-2">
                        {attachments.map((attachment) => {
                          const { data } = supabase.storage
                            .from(chatBucket)
                            .getPublicUrl(attachment.storage_path)
                          return (
                            <div
                              key={attachment.id}
                              className={`flex items-center gap-2 rounded-md border px-2 py-1 text-xs ${
                                isOwnMessage ? 'border-blue-300/60 bg-blue-500/30 text-blue-50' : 'border-gray-300 bg-white/70 text-gray-700'
                              }`}
                            >
                              <a
                                href={data.publicUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-2 min-w-0 flex-1 hover:underline"
                              >
                                <Download className="h-3 w-3 flex-shrink-0" />
                                <span className="truncate">{attachment.file_name}</span>
                              </a>
                              {attachment.size_bytes !== null && (
                                <span className="text-[10px] opacity-70">
                                  {formatFileSize(attachment.size_bytes)}
                                </span>
                              )}
                              {attachment.uploader_id === currentUser.id && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteAttachment(attachment)}
                                  className="rounded p-1 hover:bg-black/10"
                                  aria-label="Delete attachment"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                    <div
                      className={`mt-1 flex items-center gap-2 text-xs ${
                        isOwnMessage ? 'text-blue-100' : 'text-gray-500'
                      }`}
                    >
                      <span>{format(new Date(message.created_at), 'MMM d, yyyy h:mm a')}</span>
                      <button
                        type="button"
                        onClick={() => handleReply(message)}
                        className="flex items-center gap-1 hover:underline"
                      >
                        <Reply className="h-3 w-3" />
                        Reply
                      </button>
                    </div>
                  </div>
                </div>
              )
            })
          )}
          <div ref={messagesEndRef} />
        </CardContent>
        <div className="border-t border-gray-200 p-4">
          {replyTo && (
            <div className="mb-3 flex items-center justify-between rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800">
              <div className="min-w-0">
                <div className="text-xs font-semibold text-blue-700">
                  Replying to {allUsers.find((u) => u.id === replyTo.sender_id)?.name || 'Unknown'}
                </div>
                <div className="truncate">{replyTo.message || 'Attachment'}</div>
              </div>
              <button
                type="button"
                onClick={() => setReplyTo(null)}
                className="ml-3 rounded p-1 hover:bg-blue-100"
                aria-label="Cancel reply"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
          {pendingFiles.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {pendingFiles.map((file, index) => (
                <div
                  key={`${file.name}-${file.lastModified}-${index}`}
                  className="flex items-center gap-2 rounded-md border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700"
                >
                  <span className="max-w-[160px] truncate">{file.name}</span>
                  <span className="text-[10px] text-gray-500">{formatFileSize(file.size)}</span>
                  <button
                    type="button"
                    onClick={() => setPendingFiles((prev) => prev.filter((_, i) => i !== index))}
                    className="rounded p-1 hover:bg-gray-100"
                    aria-label="Remove file"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <form onSubmit={handleSend} className="flex gap-2">
            <input
              ref={messageInputRef}
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              multiple
              onChange={(e) => {
                if (e.target.files) {
                  handleAddFiles(e.target.files)
                  e.target.value = ''
                }
              }}
              aria-hidden="true"
              tabIndex={-1}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              aria-label="Attach files"
            >
              <Paperclip className="h-4 w-4" />
            </Button>
            <Button type="submit" disabled={!newMessage.trim() && pendingFiles.length === 0}>
              <Send className="h-4 w-4 mr-2" />
              Send
            </Button>
          </form>
        </div>
      </Card>
    </div>
  )
}
