'use client'

import { DashboardLayout as Layout } from '@/components/dashboard/DashboardLayout'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

// For Electron builds, we use client-side auth check
// For web builds, this will still work but server-side auth in middleware handles it
export default function LayoutWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // Only check auth client-side (works for both web and Electron)
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
      }
    }
    checkAuth()
  }, [router, supabase])

  return <Layout>{children}</Layout>
}

