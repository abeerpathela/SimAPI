import { useState } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Globe as GoogleIcon, GitBranch as GithubIcon } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

import { API_URL } from '@/config'

export function AuthPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { login, register, isLoading } = useAuth()
  const error = searchParams.get('error')
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [formError, setFormError] = useState('')

  const handleOAuthLogin = (provider: 'google' | 'github') => {
    window.location.href = `${API_URL}/api/auth/${provider}`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')

    try {
      if (mode === 'login') {
        await login(formData.email, formData.password)
      } else {
        await register(formData.email, formData.password)
      }
      navigate('/dashboard')
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'An error occurred')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/10">
      <div className="w-full max-w-md space-y-6 px-4">
        <div className="text-center space-y-2">
          <Link to="/" className="flex items-center justify-center space-x-2">
            <img 
              src="/simapi-logo.png" 
              alt="SimAPI" 
              className="h-8 w-auto"
            />
            <span className="text-xl font-bold">SimAPI</span>
          </Link>
          <h1 className="text-2xl font-bold">
            {mode === 'login' ? 'Welcome back' : 'Create an account'}
          </h1>
          <p className="text-muted-foreground">
            {mode === 'login' 
              ? 'Sign in to your account' 
              : 'Start sending SMS with your own SIM card'
            }
          </p>
        </div>

        {(error || formError) && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive p-3 rounded-md text-sm">
            {formError || 'Authentication failed. Please try again.'}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>{mode === 'login' ? 'Sign In' : 'Sign Up'}</CardTitle>
            <CardDescription>
              Choose your preferred sign-in method
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* OAuth Buttons */}
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => handleOAuthLogin('google')}
                disabled={isLoading}
              >
                <GoogleIcon className="mr-2 h-4 w-4" />
                Continue with Google
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => handleOAuthLogin('github')}
                disabled={isLoading}
              >
                <GithubIcon className="mr-2 h-4 w-4" />
                Continue with GitHub
              </Button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or continue with email
                </span>
              </div>
            </div>

            {/* Email/Password Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder={mode === 'register' ? 'At least 10 characters' : 'Enter your password'}
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading 
                  ? (mode === 'login' ? 'Signing in...' : 'Signing up...') 
                  : (mode === 'login' ? 'Sign In' : 'Sign Up')
                }
              </Button>
            </form>

            <div className="text-center text-sm text-muted-foreground">
              {mode === 'login' 
                ? "Don't have an account? " 
                : 'Already have an account? '
              }
              <Button
                variant="link"
                className="p-0 h-auto font-normal"
                onClick={() => {
                  setMode(mode === 'login' ? 'register' : 'login')
                  setFormError('')
                }}
                disabled={isLoading}
              >
                {mode === 'login' ? 'Sign up' : 'Sign in'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
