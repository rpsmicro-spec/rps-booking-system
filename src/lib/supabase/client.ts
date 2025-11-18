import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseDatabase } from '@/types/types'

export function createClient() {
  return createBrowserClient<SupabaseDatabase>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        // Use localStorage for PWA persistent sessions
        // This ensures users stay logged in until manual logout
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    }
  )
}

