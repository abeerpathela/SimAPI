import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Smartphone } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

export function Navbar() {
  const { user, logout } = useAuth()

  const APK_DOWNLOAD_URL = "https://drive.google.com/uc?export=download&id=1xJxiVHCUIWdCZItZMDWF0ypxJhlHf2iG"

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link to="/" className="flex items-center space-x-2">
            <img 
              src="/simapi-logo.png" 
              alt="SimAPI" 
              className="h-8 w-auto"
            />
            <span className="text-xl font-bold">SimAPI</span>
          </Link>
        </div>
        
        <div className="flex items-center space-x-3">
          {user ? (
            <>
              <span className="text-sm text-muted-foreground">{user.email}</span>
              <Link to="/dashboard">
                <Button variant="ghost">Dashboard</Button>
              </Link>
              <Button variant="ghost" onClick={logout}>Logout</Button>
            </>
          ) : (
            <>
              <Link to="/auth">
                <Button variant="ghost">Login</Button>
              </Link>
              <a 
                href={APK_DOWNLOAD_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button>
                  <Smartphone className="mr-2 h-4 w-4" />
                  Download App
                </Button>
              </a>
              <Link to="/auth">
                <Button>Get Started</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
