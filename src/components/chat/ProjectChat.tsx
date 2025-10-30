'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { Send, MessageCircle } from 'lucide-react'

interface Message {
  id: string
  content: string
  createdAt: string
  user: {
    id: string
    name: string
    avatar?: string
  }
}

interface ProjectChatProps {
  projectId: string
  userId: string
  userName: string
}

export default function ProjectChat({ projectId, userId, userName }: ProjectChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchMessages()
    
    // Set up WebSocket connection for real-time messages
    // In production, use wss:// for secure WebSocket
    const wsUrl = process.env.NODE_ENV === 'production' 
      ? `wss://${window.location.host}/api/socketio` 
      : `ws://localhost:3000/api/socketio`
    
    console.log('Attempting WebSocket connection to:', wsUrl)
    
    const ws = new WebSocket(wsUrl)
    
    ws.onopen = () => {
      console.log('WebSocket connected successfully')
      
      // Join project room
      ws.send(JSON.stringify({
        type: 'join_project',
        projectId: projectId
      }))
    }
    
    ws.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data)
        console.log('WebSocket message received:', data)
        
        if (data.type === 'new_message') {
          setMessages(prev => [...prev, data.message])
        }
      } catch (error) {
        console.error('WebSocket message error:', error)
      }
    }

    ws.onerror = (error) => {
      console.error('WebSocket error:', error)
      console.log('WebSocket state:', ws.readyState)
    }

    ws.onclose = () => {
      console.log('WebSocket connection closed')
    }

    return () => {
      ws.close()
    }
  }, [projectId])

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight
      }
    }
  }, [messages])

  const fetchMessages = async () => {
    try {
      const response = await fetch(`/api/chat?projectId=${projectId}`)
      const data = await response.json()

      if (response.ok) {
        setMessages(data.messages)
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newMessage.trim() || isSending) return

    setIsSending(true)
    
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: newMessage.trim(),
          userId,
          projectId
        })
      })

      if (response.ok) {
        setNewMessage('')
      } else {
        console.error('Failed to send message')
      }
    } catch (error) {
      console.error('Failed to send message:', error)
    } finally {
      setIsSending(false)
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return 'Today'
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday'
    } else {
      return date.toLocaleDateString()
    }
  }

  const groupMessagesByDate = (messages: Message[]) => {
    const groups: { [date: string]: Message[] } = {}
    
    messages.forEach(message => {
      const date = formatDate(message.createdAt)
      if (!groups[date]) {
        groups[date] = []
      }
      groups[date].push(message)
    })
    
    return groups
  }

  if (isLoading) {
    return (
      <Card className="h-96">
        <CardContent className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </CardContent>
      </Card>
    )
  }

  const messageGroups = groupMessagesByDate(messages)

  return (
    <Card className="h-96 flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <MessageCircle className="w-5 h-5" />
          Team Chat
        </CardTitle>
        <CardDescription>
          Collaborate with your team in real-time
        </CardDescription>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0">
        <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
          <div className="space-y-4">
            {Object.entries(messageGroups).map(([date, dateMessages]) => (
              <div key={date}>
                <div className="text-center text-xs text-gray-500 my-2">
                  {date}
                </div>
                {dateMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 mb-3 ${
                      message.user.id === userId ? 'flex-row-reverse' : ''
                    }`}
                  >
                    <Avatar className="w-8 h-8 flex-shrink-0">
                      <AvatarImage src={message.user.avatar} />
                      <AvatarFallback className="text-xs">
                        {message.user.name?.charAt(0)?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className={`max-w-[70%] ${message.user.id === userId ? 'text-right' : ''}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-gray-600">
                          {message.user.name}
                        </span>
                        <span className="text-xs text-gray-400">
                          {formatTime(message.createdAt)}
                        </span>
                      </div>
                      <div
                        className={`inline-block p-2 rounded-lg text-sm ${
                          message.user.id === userId
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        {message.content}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
            
            {messages.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No messages yet</p>
                <p className="text-xs">Start the conversation!</p>
              </div>
            )}
          </div>
        </ScrollArea>
        
        <form onSubmit={handleSendMessage} className="p-4 border-t">
          <div className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={`Message as ${userName}...`}
              className="flex-1"
              disabled={isSending}
            />
            <Button type="submit" size="icon" disabled={isSending || !newMessage.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}