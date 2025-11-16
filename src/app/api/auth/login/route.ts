import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { SupabaseDatabase } from '@/types/types'

export async function POST(request: Request) {
  try {
    const { email, password, rememberMe = false } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const cookieStore = await cookies()
    
    // Create a custom Supabase client that sets cookie expiration based on rememberMe
    const supabase = createServerClient<SupabaseDatabase>(
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
                
                if (isSupabaseAuthCookie) {
                  // If rememberMe is true, set cookies to expire in 30 days
                  // If false, set as session cookies (no maxAge/expires, expires when browser closes)
                  if (rememberMe) {
                    cookieStore.set(name, value, {
                      ...options,
                      maxAge: 60 * 60 * 24 * 30, // 30 days in seconds
                      expires: new Date(Date.now() + 60 * 60 * 24 * 30 * 1000), // 30 days from now
                      path: '/', // Ensure cookie is available site-wide
                      sameSite: 'lax',
                      secure: process.env.NODE_ENV === 'production',
                    })
                  } else {
                    // For session cookies, explicitly remove maxAge and expires
                    // to ensure they expire when browser closes
                    const { maxAge, expires, ...sessionOptions } = options || {}
                    cookieStore.set(name, value, {
                      ...sessionOptions,
                      path: '/',
                      sameSite: 'lax',
                      secure: process.env.NODE_ENV === 'production',
                    })
                  }
                } else {
                  // For non-auth cookies, preserve original options
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

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      )
    }

    // Store rememberMe preference in a cookie so middleware can respect it
    const response = NextResponse.json(
      { user: data.user, session: data.session },
      { status: 200 }
    )
    
    if (rememberMe) {
      response.cookies.set('remember-me', 'true', {
        maxAge: 60 * 60 * 24 * 30, // 30 days
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/', // Ensure cookie is available site-wide
      })
    } else {
      // Clear the remember-me cookie if it exists
      response.cookies.delete('remember-me')
    }

    return response
  } catch {
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

