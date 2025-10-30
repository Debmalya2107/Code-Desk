'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default function WebSocketDebug() {
  const [status, setStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected')
  const [logs, setLogs] = useState<string[]>([])
  const [ws, setWs] = useState<WebSocket | null>(null)

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [...prev, `[${timestamp}] ${message}`])
  }

  const connect = () => {
    if (ws) {
      ws.close()
    }

    setStatus('connecting')
    addLog('Attempting to connect to WebSocket...')

    const websocket = new WebSocket('ws://localhost:3000/api/socketio')
    
    websocket.onopen = () => {
      setStatus('connected')
      addLog('WebSocket connected successfully!')
      
      // Test join project
      websocket.send(JSON.stringify({
        type: 'join_project',
        projectId: 'test-project-id'
      }))
      addLog('Sent join_project message')
    }

    websocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        addLog(`Received: ${JSON.stringify(data)}`)
      } catch (error) {
        addLog(`Received (raw): ${event.data}`)
      }
    }

    websocket.onerror = (error) => {
      setStatus('error')
      addLog(`WebSocket error: ${JSON.stringify(error)}`)
    }

    websocket.onclose = () => {
      setStatus('disconnected')
      addLog('WebSocket connection closed')
    }

    setWs(websocket)
  }

  const disconnect = () => {
    if (ws) {
      ws.close()
      setWs(null)
    }
  }

  const clearLogs = () => {
    setLogs([])
  }

  const getStatusColor = () => {
    switch (status) {
      case 'connected': return 'bg-green-500'
      case 'connecting': return 'bg-yellow-500'
      case 'error': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          WebSocket Debug Tool
          <Badge className={getStatusColor()}>
            {status.toUpperCase()}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button 
            onClick={connect} 
            disabled={status === 'connecting' || status === 'connected'}
            variant="outline"
          >
            Connect
          </Button>
          <Button 
            onClick={disconnect} 
            disabled={status === 'disconnected'}
            variant="outline"
          >
            Disconnect
          </Button>
          <Button 
            onClick={clearLogs} 
            variant="outline"
          >
            Clear Logs
          </Button>
        </div>

        <div className="border rounded p-4 h-64 overflow-y-auto bg-gray-50">
          <h4 className="font-semibold mb-2">Connection Logs:</h4>
          {logs.length === 0 ? (
            <p className="text-gray-500 text-sm">No logs yet. Click "Connect" to start testing.</p>
          ) : (
            <div className="space-y-1">
              {logs.map((log, index) => (
                <div key={index} className="text-sm font-mono">
                  {log}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="text-sm text-gray-600">
          <p><strong>WebSocket URL:</strong> ws://localhost:3000/api/socketio</p>
          <p><strong>Status:</strong> {status}</p>
        </div>
      </CardContent>
    </Card>
  )
}