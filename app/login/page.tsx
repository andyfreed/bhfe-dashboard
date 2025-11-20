'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Lock, Mail } from 'lucide-react'

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
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-neutral-900">
      {/* Animated background pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-10" />
      
      {/* Decorative gradient orbs */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-blue-600/20 rounded-full mix-blend-overlay filter blur-3xl opacity-30 animate-blob" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/20 rounded-full mix-blend-overlay filter blur-3xl opacity-30 animate-blob animation-delay-2000" />
      <div className="absolute -bottom-8 left-1/2 w-96 h-96 bg-indigo-600/20 rounded-full mix-blend-overlay filter blur-3xl opacity-30 animate-blob animation-delay-4000" />
      
      <Card className="w-full max-w-md relative z-10 shadow-2xl border border-white/5 bg-white/2 backdrop-blur-xl">
        <CardHeader className="text-center space-y-4 pb-6 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-t-xl p-8">
          <div className="mx-auto mb-2 h-20 w-20 rounded-3xl bg-white/10 backdrop-blur-md flex items-center justify-center shadow-2xl border border-white/20 overflow-hidden">
            <img src="/logo.png" alt="BHFE Logo" className="h-full w-full object-contain" />
          </div>
          <CardTitle className="text-4xl font-medium text-white tracking-tight">
            BHFE Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8 bg-neutral-900">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-light text-neutral-400 uppercase tracking-wide">
                <div className="flex items-center gap-2 mb-1">
                  <Mail className="h-4 w-4 text-blue-500" />
                  Email Address
                </div>
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3.5 border border-white/5 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/5 font-light text-neutral-200 hover:border-white/10 placeholder:text-neutral-500"
                placeholder="you@example.com"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-light text-neutral-400 uppercase tracking-wide">
                <div className="flex items-center gap-2 mb-1">
                  <Lock className="h-4 w-4 text-blue-500" />
                  Password
                </div>
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3.5 border border-white/5 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/5 font-light text-neutral-200 hover:border-white/10 placeholder:text-neutral-500"
                placeholder="••••••••"
              />
            </div>
            {error && (
              <div className="text-red-400 text-sm font-light bg-red-500/10 border border-red-500/20 p-4 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-xl">⚠️</span>
                  <span>{error}</span>
                </div>
              </div>
            )}
            <Button 
              type="submit" 
              className="w-full h-12 text-base font-light shadow-lg hover:shadow-xl transition-all duration-200" 
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Signing in...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  <span>Sign In</span>
                </div>
              )}
            </Button>
          </form>
          <div className="mt-8 text-center space-y-2 pt-6 border-t border-white/5">
            <p className="text-sm font-light text-neutral-400 uppercase tracking-wide">Authorized Users</p>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <div className="px-4 py-2 rounded-lg bg-white/5 border border-white/5">
                <p className="text-sm font-light text-neutral-300">Andy</p>
              </div>
              <div className="px-4 py-2 rounded-lg bg-white/5 border border-white/5">
                <p className="text-sm font-light text-neutral-300">Dave</p>
              </div>
              <div className="px-4 py-2 rounded-lg bg-white/5 border border-white/5">
                <p className="text-sm font-light text-neutral-300">Diane</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
