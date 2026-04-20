import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { ArrowRight, Code, Zap, Shield } from 'lucide-react'

export function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="flex-1 flex items-center justify-center bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
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
              <Link to="/auth">
                <Button size="lg" className="text-lg px-8">
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/auth">
                <Button variant="outline" size="lg" className="text-lg px-8">
                  Login
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/10">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="text-center space-y-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Lightning Fast</h3>
              <p className="text-muted-foreground">
                Direct WebSocket connection to your phone ensures instant message delivery.
              </p>
            </div>
            <div className="text-center space-y-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Secure & Private</h3>
              <p className="text-muted-foreground">
                End-to-end encryption with your own SIM. No third-party intermediaries.
              </p>
            </div>
            <div className="text-center space-y-4">
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

      {/* Code Snippet Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="text-center space-y-4">
              <h2 className="text-3xl font-bold">Simple Integration</h2>
              <p className="text-muted-foreground">
                Send SMS messages with just a few lines of code
              </p>
            </div>
            
            <div className="bg-slate-900 rounded-lg p-6 overflow-x-auto">
              <pre className="text-sm text-slate-100">
                <code>{`const response = await fetch('https://api.simapi.dev/api/v1/send-sms', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer sim_live_1234567890abcdef'
  },
  body: JSON.stringify({
    to_number: '+1234567890',
    content: 'Hello from SimAPI! Your message has been sent successfully.'
  })
});

const result = await response.json();
console.log('Message sent:', result.id);`}</code>
              </pre>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
