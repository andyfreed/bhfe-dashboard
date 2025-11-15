'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Send, MessageSquare, User } from 'lucide-react'
import { format } from 'date-fns'
import { useNotifications } from '@/hooks/useNotifications'

interface ChatMessage {
  id: string
  sender_id: string
  receiver_id: string
  message: string
  is_read: boolean
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
  const [allUsers, setAllUsers] = useState<Profile[]>([])
  const [currentUser, setCurrentUser] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const previousMessageCountRef = useRef<number>(0)
  const supabase = createClient()
  const { permission, notify } = useNotifications()

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

    // Deduplicate messages by content, sender, and timestamp (since group messages create multiple records)
    // Group messages with same content, sender, and time (< 1 second apart) together
    const uniqueMessages = (data || []).reduce((acc: ChatMessage[], message: ChatMessage) => {
      const existing = acc.find(
        (m) =>
          m.message === message.message &&
          m.sender_id === message.sender_id &&
          Math.abs(new Date(m.created_at).getTime() - new Date(message.created_at).getTime()) < 1000
      )
      if (!existing) {
        acc.push(message)
      }
      return acc
    }, [])

    setMessages(uniqueMessages)

    // Show notification if new messages arrived and user is not on chat page
    const newMessageCount = uniqueMessages.length
    const isOnChatPage = window.location.pathname === '/dashboard/chat'
    
    if (
      previousMessageCountRef.current > 0 && 
      newMessageCount > previousMessageCountRef.current &&
      !isOnChatPage &&
      permission === 'granted'
    ) {
      // Find the latest new message
      const newMessages = uniqueMessages.slice(previousMessageCountRef.current)
      const latestMessage = newMessages[newMessages.length - 1]
      const sender = allUsers.find(u => u.id === latestMessage.sender_id)
      
      if (sender) {
        await notify(`New message from ${sender.name || sender.email?.split('@')[0]}`, {
          body: latestMessage.message.substring(0, 100) + (latestMessage.message.length > 100 ? '...' : ''),
          tag: 'chat-message',
          requireInteraction: false,
        })
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

    return () => {
      supabase.removeChannel(channel)
    }
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !currentUser) return

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Send message to all other users (group chat)
    const otherUsers = allUsers.filter((u) => u.id !== user.id)
    
    if (otherUsers.length > 0) {
      const messagesToInsert = otherUsers.map((otherUser) => ({
        sender_id: user.id,
        receiver_id: otherUser.id,
        message: newMessage.trim(),
      }))

      const { error } = await supabase
        .from('chat_messages')
        .insert(messagesToInsert)

      if (error) {
        console.error('Error sending message:', error)
        return
      }
    }

    setNewMessage('')
    loadAllMessages()
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
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
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Team Chat
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No messages yet. Start the conversation!
            </div>
          ) : (
            messages.map((message) => {
              const isOwnMessage = message.sender_id === currentUser.id
              const sender = allUsers.find((u) => u.id === message.sender_id)
              const senderName = sender?.name || 'Unknown'
              
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
                    <p className="text-sm">{message.message}</p>
                    <p
                      className={`text-xs mt-1 ${
                        isOwnMessage ? 'text-blue-100' : 'text-gray-500'
                      }`}
                    >
                      {format(new Date(message.created_at), 'h:mm a')}
                    </p>
                  </div>
                </div>
              )
            })
          )}
          <div ref={messagesEndRef} />
        </CardContent>
        <div className="border-t border-gray-200 p-4">
          <form onSubmit={handleSend} className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Button type="submit" disabled={!newMessage.trim()}>
              <Send className="h-4 w-4 mr-2" />
              Send
            </Button>
          </form>
        </div>
      </Card>
    </div>
  )
}

