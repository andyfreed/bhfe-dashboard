// Create a mock client for build-time/static export
function createMockClient() {
  return {
    auth: {
      getUser: async () => ({ data: { user: null }, error: null }),
      getSession: async () => ({ data: { session: null }, error: null }),
      signInWithPassword: async () => ({ data: null, error: new Error('Supabase not configured') }),
      signOut: async () => ({ error: null }),
    },
    from: () => ({
      select: () => ({ data: [], error: null }),
      insert: () => ({ data: null, error: new Error('Supabase not configured') }),
      update: () => ({ data: null, error: new Error('Supabase not configured') }),
      delete: () => ({ data: null, error: new Error('Supabase not configured') }),
      eq: () => ({ data: [], error: null }),
      neq: () => ({ data: [], error: null }),
      not: () => ({ data: [], error: null }),
      gte: () => ({ data: [], error: null }),
      lte: () => ({ data: [], error: null }),
      order: () => ({ data: [], error: null }),
    }),
    channel: () => ({
      on: () => ({ subscribe: () => {}, unsubscribe: () => {} }),
      subscribe: () => {},
    }),
    removeChannel: () => {},
  } as any
}

export function createClient() {
  // During build time (static export), always return mock client
  // This prevents build-time errors when Supabase can't be initialized
  if (typeof window === 'undefined') {
    return createMockClient()
  }

  // For static export builds, provide fallback values if env vars aren't available
  // In Electron, these should be available at runtime via process.env
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 
    (typeof window !== 'undefined' ? (window as any).__NEXT_PUBLIC_SUPABASE_URL__ : '') || ''
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
    (typeof window !== 'undefined' ? (window as any).__NEXT_PUBLIC_SUPABASE_ANON_KEY__ : '') || ''
  
  // If env vars aren't available, return mock client
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase env vars not found, using mock client. URL:', supabaseUrl ? 'set' : 'missing', 'Key:', supabaseAnonKey ? 'set' : 'missing')
    return createMockClient()
  }
  
  // Try to create real client, fallback to mock if it fails
  try {
    const { createBrowserClient } = require('@supabase/ssr')
    return createBrowserClient(supabaseUrl, supabaseAnonKey)
  } catch (e) {
    // If Supabase can't be loaded (e.g., during build), return mock
    console.error('Failed to create Supabase client:', e)
    return createMockClient()
  }
}

