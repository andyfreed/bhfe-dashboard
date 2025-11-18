'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Lock, Mail, Sparkles } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      setError(signInError.message)
      setLoading(false)
      return
    }

    if (data.user) {
      router.push('/dashboard')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden scanlines">
      {/* Laser grid background */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,0,255,0.1)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,255,255,0.1)_1px,transparent_1px)] bg-[size:50px_50px]" />
      </div>
      
      {/* Synthwave glowing orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-fuchsia-500/30 rounded-full mix-blend-screen filter blur-[120px] animate-blob" />
      <div className="absolute top-1/2 right-1/4 w-96 h-96 bg-cyan-500/25 rounded-full mix-blend-screen filter blur-[140px] animate-blob animation-delay-2000" />
      <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-fuchsia-400/20 rounded-full mix-blend-screen filter blur-[100px] animate-blob animation-delay-4000" />
      
      {/* Laser accent lines */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-fuchsia-500/60 to-transparent animate-pulse" />
      <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-500/60 to-transparent animate-pulse" />
      
      {/* Scanning laser effect */}
      <div className="absolute inset-0 scan-line pointer-events-none" />
      
      <Card className="w-full max-w-md relative z-10 glass border-fuchsia-500/40 shadow-2xl laser-beam">
        <CardHeader className="text-center space-y-6 pb-8 p-8 relative overflow-hidden">
          {/* Shimmer effect */}
          <div className="absolute inset-0 shimmer opacity-40" />
          
          {/* Neon accent border */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-fuchsia-500 to-cyan-500 to-transparent animate-pulse-glow" />
          
          <div className="mx-auto mb-4 h-24 w-24 rounded-2xl glass-light flex items-center justify-center shadow-2xl border-fuchsia-500/50 overflow-hidden relative glow-pink">
            <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-500/30 via-cyan-500/20 to-transparent" />
            <img src="/logo.png" alt="BHFE Logo" className="h-full w-full object-contain relative z-10" />
          </div>
          <CardTitle className="text-5xl font-black text-white tracking-tight neon-pink animate-neon-flicker">
            BHFE
          </CardTitle>
          <CardDescription className="text-cyan-400/90 text-lg font-semibold uppercase tracking-widest neon-cyan">
            Dashboard
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8 glass-light">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-3">
              <label htmlFor="email" className="block text-sm font-bold text-fuchsia-400 uppercase tracking-wider neon-pink">
                <div className="flex items-center gap-2 mb-2">
                  <Mail className="h-4 w-4" />
                  Email Address
                </div>
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3.5 bg-black/60 border-2 border-fuchsia-500/40 rounded-xl text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/50 focus:border-fuchsia-500 transition-all duration-200 font-medium hover:border-fuchsia-500/60 hover:glow-pink backdrop-blur-sm"
                placeholder="you@example.com"
              />
            </div>
            <div className="space-y-3">
              <label htmlFor="password" className="block text-sm font-bold text-cyan-400 uppercase tracking-wider neon-cyan">
                <div className="flex items-center gap-2 mb-2">
                  <Lock className="h-4 w-4" />
                  Password
                </div>
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3.5 bg-black/60 border-2 border-cyan-500/40 rounded-xl text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all duration-200 font-medium hover:border-cyan-500/60 hover:glow-cyan backdrop-blur-sm"
                placeholder="••••••••"
              />
            </div>
            {error && (
              <div className="text-red-400 text-sm font-semibold bg-red-950/60 border-2 border-red-500/40 p-4 rounded-xl backdrop-blur-sm glow-pink">
                <div className="flex items-center gap-2">
                  <span className="text-xl">⚠️</span>
                  <span>{error}</span>
                </div>
              </div>
            )}
            <Button 
              type="submit" 
              className="w-full h-14 text-base font-black shadow-2xl hover:shadow-fuchsia-500/40 transition-all duration-300 glow-pink hover:scale-[1.02] animate-pulse-glow" 
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center gap-3">
                  <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Signing in...</span>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Lock className="h-5 w-5" />
                  <span>Sign In</span>
                </div>
              )}
            </Button>
          </form>
          <div className="mt-8 text-center space-y-3 pt-6 border-t border-fuchsia-500/30">
            <p className="text-xs font-bold text-cyan-400/70 uppercase tracking-widest neon-cyan">Authorized Users</p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <div className="px-4 py-2 rounded-lg glass-light border border-fuchsia-500/40 glow-pink">
                <p className="text-sm font-bold text-fuchsia-400 neon-pink">Andy</p>
              </div>
              <div className="px-4 py-2 rounded-lg glass-light border border-cyan-500/40 glow-cyan">
                <p className="text-sm font-bold text-cyan-400 neon-cyan">Dave</p>
              </div>
              <div className="px-4 py-2 rounded-lg glass-light border border-fuchsia-500/40 glow-pink">
                <p className="text-sm font-bold text-fuchsia-400 neon-pink">Diane</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
