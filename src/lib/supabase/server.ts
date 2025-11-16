import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { SupabaseDatabase } from '@/types/types'

export async function createClient() {
  const cookieStore = await cookies()
  
  // Check if user has "remember me" enabled
  const rememberMe = cookieStore.get('remember-me')?.value === 'true'

  return createServerClient<SupabaseDatabase>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              // Supabase auth cookies typically start with 'sb-' and contain 'auth'
              const isSupabaseAuthCookie = name.startsWith('sb-') && 
                (name.includes('auth') || name.includes('code-verifier') || name.includes('code-challenge'))
              
              if (isSupabaseAuthCookie && rememberMe) {
                // If rememberMe is enabled, ensure cookies have 30-day expiration
                cookieStore.set(name, value, {
                  ...options,
                  maxAge: 60 * 60 * 24 * 30, // 30 days in seconds
                  expires: new Date(Date.now() + 60 * 60 * 24 * 30 * 1000), // 30 days from now
                  path: '/',
                  sameSite: 'lax',
                  secure: process.env.NODE_ENV === 'production',
                })
              } else {
                // For non-auth cookies or when rememberMe is false, use original options
                cookieStore.set(name, value, options)
              }
            })
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

