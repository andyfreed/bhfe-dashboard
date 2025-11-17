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
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-black">
      {/* Animated grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1a1a1a_1px,transparent_1px),linear-gradient(to_bottom,#1a1a1a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
      
      {/* Glowing orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-yellow-500/20 rounded-full mix-blend-screen filter blur-[100px] animate-blob" />
      <div className="absolute top-1/2 right-1/4 w-96 h-96 bg-amber-500/15 rounded-full mix-blend-screen filter blur-[120px] animate-blob animation-delay-2000" />
      <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-yellow-400/10 rounded-full mix-blend-screen filter blur-[100px] animate-blob animation-delay-4000" />
      
      {/* Yellow accent lines */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-yellow-500/50 to-transparent" />
      <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-yellow-500/50 to-transparent" />
      
      <Card className="w-full max-w-md relative z-10 glass border-yellow-500/30 shadow-2xl">
        <CardHeader className="text-center space-y-6 pb-8 p-8 relative overflow-hidden">
          {/* Shimmer effect */}
          <div className="absolute inset-0 shimmer opacity-30" />
          
          {/* Yellow accent border */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-yellow-500 to-transparent" />
          
          <div className="mx-auto mb-4 h-24 w-24 rounded-2xl glass-light flex items-center justify-center shadow-2xl border-yellow-500/40 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/20 to-transparent" />
            <img src="/logo.png" alt="BHFE Logo" className="h-full w-full object-contain relative z-10" />
          </div>
          <CardTitle className="text-5xl font-black text-white tracking-tight neon-yellow">
            BHFE
          </CardTitle>
          <CardDescription className="text-yellow-400/80 text-lg font-semibold uppercase tracking-widest">
            Dashboard
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8 glass-light">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-3">
              <label htmlFor="email" className="block text-sm font-bold text-yellow-400 uppercase tracking-wider">
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
                className="w-full px-4 py-3.5 bg-black/50 border-2 border-yellow-500/30 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500 transition-all duration-200 font-medium hover:border-yellow-500/50 backdrop-blur-sm"
                placeholder="you@example.com"
              />
            </div>
            <div className="space-y-3">
              <label htmlFor="password" className="block text-sm font-bold text-yellow-400 uppercase tracking-wider">
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
                className="w-full px-4 py-3.5 bg-black/50 border-2 border-yellow-500/30 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500 transition-all duration-200 font-medium hover:border-yellow-500/50 backdrop-blur-sm"
                placeholder="••••••••"
              />
            </div>
            {error && (
              <div className="text-red-400 text-sm font-semibold bg-red-950/50 border-2 border-red-500/30 p-4 rounded-xl backdrop-blur-sm">
                <div className="flex items-center gap-2">
                  <span className="text-xl">⚠️</span>
                  <span>{error}</span>
                </div>
              </div>
            )}
            <Button 
              type="submit" 
              className="w-full h-14 text-base font-black shadow-2xl hover:shadow-yellow-500/20 transition-all duration-300 glow-yellow hover:scale-[1.02]" 
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center gap-3">
                  <div className="h-5 w-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
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
          <div className="mt-8 text-center space-y-3 pt-6 border-t border-yellow-500/20">
            <p className="text-xs font-bold text-yellow-400/60 uppercase tracking-widest">Authorized Users</p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <div className="px-4 py-2 rounded-lg glass-light border border-yellow-500/30">
                <p className="text-sm font-bold text-yellow-400">Andy</p>
              </div>
              <div className="px-4 py-2 rounded-lg glass-light border border-yellow-500/30">
                <p className="text-sm font-bold text-yellow-400">Dave</p>
              </div>
              <div className="px-4 py-2 rounded-lg glass-light border border-yellow-500/30">
                <p className="text-sm font-bold text-yellow-400">Diane</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
