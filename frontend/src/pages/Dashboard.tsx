import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Copy, Key, Smartphone, Settings, MessageSquare } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { io, type Socket } from 'socket.io-client'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

interface Message {
  id: string
  toNumber: string
  content: string
  status: 'PENDING' | 'SENT' | 'FAILED'
  createdAt: string
}

interface Device {
  id: string
  deviceName: string
  isOnline: boolean
  lastHeartbeat: string | null
}

export function Dashboard() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user, token, fetchUser } = useAuth()
  const [apiKey, setApiKey] = useState<string>('')
  const [deviceStatus, setDeviceStatus] = useState<'online' | 'offline'>('offline')
  const [webhookUrl, setWebhookUrl] = useState<string>('')
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    const urlToken = searchParams.get('token')
    
    if (urlToken) {
      localStorage.setItem('token', urlToken)
      window.history.replaceState({}, document.title, window.location.pathname)
      window.location.reload()
    }

    if (!token) {
      navigate('/auth')
      return
    }

    fetchUser()
    loadDashboardData()
  }, [token, navigate, searchParams, fetchUser])

  const loadDashboardData = async () => {
    loadMessages()
    loadDevices()
    loadWebhookUrl()
  }

  const loadMessages = async () => {
    try {
      const response = await fetch(`${API_URL}/api/messages`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages || [])
      }
    } catch (error) {
      console.error('Failed to load messages:', error)
    }
  }

  const loadDevices = async () => {
    try {
      const response = await fetch(`${API_URL}/api/devices`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        const hasOnlineDevice = (data.devices || []).some((d: Device) => d.isOnline)
        setDeviceStatus(hasOnlineDevice ? 'online' : 'offline')
      }
    } catch (error) {
      console.error('Failed to load devices:', error)
    }
  }

  const loadWebhookUrl = async () => {
    if (user?.webhookUrl) {
      setWebhookUrl(user.webhookUrl)
    }
  }

  const generateApiKey = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`${API_URL}/api/generate-key`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setApiKey(data.api_key)
      } else {
        alert('Failed to generate API key')
      }
    } catch (error) {
      alert('Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert('API key copied to clipboard!')
  }

  const saveWebhookUrl = async () => {
    try {
      const response = await fetch(`${API_URL}/api/webhook-url`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ webhook_url: webhookUrl || null })
      })
      
      if (response.ok) {
        alert('Webhook URL saved successfully!')
        fetchUser()
      } else {
        alert('Failed to save webhook URL')
      }
    } catch (error) {
      alert('Network error. Please try again.')
    }
  }

  const maskedApiKey = apiKey ? 
    apiKey.slice(0, 12) + '*'.repeat(apiKey.length - 12) : 
    (user?.apiKeyPrefix ? `${user.apiKeyPrefix}...` : 'No API key generated')

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Manage your SMS API settings and monitor message delivery
        </p>
      </div>

      {/* API Key Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            API Key
          </CardTitle>
          <CardDescription>
            Generate your API key to start sending SMS messages
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {(apiKey || user?.apiKeyPrefix) && (
            <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
              <code className="flex-1 text-sm">{maskedApiKey}</code>
              {apiKey && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(apiKey)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
          {!apiKey && !user?.apiKeyPrefix && (
            <p className="text-muted-foreground">No API key generated yet</p>
          )}
          <Button 
            onClick={generateApiKey} 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'Generating...' : (user?.apiKeyPrefix ? 'Regenerate API Key' : 'Generate API Key')}
          </Button>
        </CardContent>
      </Card>

      {/* Device Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Device Status
          </CardTitle>
          <CardDescription>
            Status of your connected Android device
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Badge variant={deviceStatus === 'online' ? 'default' : 'destructive'}>
              {deviceStatus === 'online' ? 'Online' : 'Offline'}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {deviceStatus === 'online' 
                ? 'Your device is connected and ready to send messages'
                : 'No device connected. Install the mobile app to get started.'
              }
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Webhook Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Webhook Settings
          </CardTitle>
          <CardDescription>
            Configure webhook URL for failed message notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="webhook-url">Webhook URL</Label>
            <Input
              id="webhook-url"
              type="url"
              placeholder="https://your-app.com/webhooks/simapi"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
            />
          </div>
          <Button onClick={saveWebhookUrl} variant="outline">
            Save Webhook URL
          </Button>
        </CardContent>
      </Card>

      {/* Message Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Message Logs
          </CardTitle>
          <CardDescription>
            Recent SMS messages and their delivery status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {messages.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No messages sent yet. Generate an API key and start sending messages!
            </p>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <div key={message.id} className="flex items-center justify-between p-3 border rounded-md">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{message.toNumber}</span>
                      <Badge variant={
                        message.status === 'SENT' ? 'default' :
                        message.status === 'FAILED' ? 'destructive' : 'secondary'
                      }>
                        {message.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{message.content}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(message.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
