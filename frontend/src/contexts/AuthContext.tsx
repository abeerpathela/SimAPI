import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

import { API_URL } from '@/config'

interface User {
  id: string
  email: string
  apiKeyPrefix?: string
  webhookUrl?: string
  createdAt: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string) => Promise<void>
  logout: () => void
  fetchUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'))
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
  }, [])

  const login = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(`${API_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Login failed')
      }

      localStorage.setItem('token', result.token)
      localStorage.setItem('user', JSON.stringify(result.user))
      setToken(result.token)
      setUser(result.user)
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(`${API_URL}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Registration failed')
      }

      localStorage.setItem('token', result.token)
      localStorage.setItem('user', JSON.stringify(result.user))
      if (result.webhook_secret) {
        localStorage.setItem('webhook_secret', result.webhook_secret)
      }
      setToken(result.token)
      setUser(result.user)
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('webhook_secret')
    setToken(null)
    setUser(null)
  }

  const fetchUser = async () => {
    if (!token) return
    try {
      const response = await fetch(`${API_URL}/api/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const result = await response.json()
        setUser(result.user)
        localStorage.setItem('user', JSON.stringify(result.user))
      }
    } catch (error) {
      console.error('Failed to fetch user:', error)
    }
  }

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout, fetchUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
