import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { ArrowRight, Code, Zap, Shield, DollarSign, Terminal } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

import { API_URL } from '@/config'

export function LandingPage() {
  const { user } = useAuth()

  const handleDownloadApp = () => {
    // TODO: Replace with real app download URL when available
    // Example: window.open('https://play.google.com/store/apps/details?id=com.simapi.app', '_blank')
    alert('SimAPI Android App Coming Soon! This is a placeholder - replace with real download URL when app is ready.')
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="flex-1 flex items-center justify-center bg-gradient-to-b from-background to-muted/20 py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                Zero Fee SMS API.
                <br />
                <span className="text-primary">Bring Your Own SIM.</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Turn your Android phone into a powerful SMS gateway. No per-message fees, 
                no subscriptions. Just your SIM card and our API.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {user ? (
                <>
                  <Button onClick={handleDownloadApp} size="lg">
                    Download Android App
                  </Button>
                  <Link to="/dashboard">
                    <Button variant="outline" size="lg">
                      Go to Dashboard
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <Button onClick={handleDownloadApp} size="lg">
                    Download Android App
                  </Button>
                  <Link to="/auth">
                    <Button size="lg">
                      Get Started Free
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                  <Link to="/auth">
                    <Button variant="outline" size="lg">
                      Login
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/10">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl font-bold mb-4">Why Choose SimAPI?</h2>
            <p className="text-xl text-muted-foreground">Build your SMS infrastructure without breaking the bank</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            <div className="text-center space-y-4 p-6 rounded-xl bg-background border shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto">
                <DollarSign className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Zero Per-Message Fees</h3>
              <p className="text-muted-foreground">
                Use your own SIM card—no per‑SMS charges beyond your carrier plan.
              </p>
            </div>

            <div className="text-center space-y-4 p-6 rounded-xl bg-background border shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Lightning Fast</h3>
              <p className="text-muted-foreground">
                Direct WebSocket connection to your phone ensures instant message delivery.
              </p>
            </div>

            <div className="text-center space-y-4 p-6 rounded-xl bg-background border shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Secure & Private</h3>
              <p className="text-muted-foreground">
                End‑to‑end encryption with your own SIM. No third‑party intermediaries.
              </p>
            </div>

            <div className="text-center space-y-4 p-6 rounded-xl bg-background border shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto">
                <Code className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Developer First</h3>
              <p className="text-muted-foreground">
                Clean REST API with comprehensive documentation and webhook support.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl font-bold mb-4">How It Works</h2>
            <p className="text-xl text-muted-foreground">Get up and running in less than 5 minutes</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="space-y-4">
              <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-xl">
                1
              </div>
              <h3 className="text-xl font-semibold">Create Your Account</h3>
              <p className="text-muted-foreground">
                Sign up for free, no credit card required. Get instant access to your dashboard and API keys.
              </p>
            </div>
            <div className="space-y-4">
              <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-xl">
                2
              </div>
              <h3 className="text-xl font-semibold">Connect Your Android Phone</h3>
              <p className="text-muted-foreground">
                Install our companion app on your Android device and link it to your account using your API key.
              </p>
            </div>
            <div className="space-y-4">
              <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-xl">
                3
              </div>
              <h3 className="text-xl font-semibold">Start Sending SMS</h3>
              <p className="text-muted-foreground">
                Use our simple REST API to send SMS messages from your application.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Code Snippet Section */}
      <section className="py-20 bg-muted/10">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="text-center space-y-4">
              <h2 className="text-3xl font-bold">Simple Integration</h2>
              <p className="text-muted-foreground text-lg">
                Send SMS messages with just a few lines of code
              </p>
            </div>
            
            <div className="bg-slate-900 rounded-lg p-6 overflow-x-auto shadow-lg">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-700">
                <Terminal className="h-5 w-5 text-slate-400" />
                <span className="text-slate-300 font-medium">Send SMS in JavaScript</span>
              </div>
              <pre className="text-sm text-slate-100">
                <code>{`const response = await fetch('${API_URL}/api/v1/send-sms', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer sim_live_1234567890abcdef'
  },
  body: JSON.stringify({
    to_number: '+1234567890',
    content: 'Hello from SimAPI!'
  })
});

const result = await response.json();
console.log('Message sent:', result.id);`}</code>
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-b from-muted/20 to-background">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto space-y-6">
            <h2 className="text-3xl font-bold">Ready to Build?</h2>
            <p className="text-xl text-muted-foreground">
              Join thousands of developers who have already cut their SMS costs by 90%
            </p>
            {user ? (
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button onClick={handleDownloadApp} size="lg">
                  Download App
                </Button>
                <Link to="/dashboard">
                  <Button variant="outline" size="lg">
                    Open Your Dashboard
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button onClick={handleDownloadApp} size="lg">
                  Download App
                </Button>
                <Link to="/auth">
                  <Button size="lg">
                    Start Building Now — It's Free
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
