import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { SupabaseDatabase } from '@/types/types'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  // Check if user has "remember me" enabled
  const rememberMe = request.cookies.get('remember-me')?.value === 'true'

  const supabase = createServerClient<SupabaseDatabase>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => {
            // Supabase auth cookies typically start with 'sb-' and contain 'auth'
            // Check if this is a Supabase auth-related cookie
            const isSupabaseAuthCookie = name.startsWith('sb-') && 
              (name.includes('auth') || name.includes('code-verifier') || name.includes('code-challenge'))
            
            if (isSupabaseAuthCookie) {
              if (rememberMe) {
                // Set persistent cookies that expire in 30 days
                supabaseResponse.cookies.set(name, value, {
                  ...options,
                  maxAge: 60 * 60 * 24 * 30, // 30 days in seconds
                  expires: new Date(Date.now() + 60 * 60 * 24 * 30 * 1000), // 30 days from now
                  path: '/', // Ensure cookie is available site-wide
                  sameSite: 'lax',
                  secure: process.env.NODE_ENV === 'production',
                })
              } else {
                // For session cookies, remove maxAge and expires to ensure they expire when browser closes
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { maxAge, expires, ...sessionOptions } = options || {}
                supabaseResponse.cookies.set(name, value, {
                  ...sessionOptions,
                  path: '/',
                  sameSite: 'lax',
                  secure: process.env.NODE_ENV === 'production',
                })
              }
            } else {
              // For non-auth cookies, preserve original options
              supabaseResponse.cookies.set(name, value, options)
            }
          })
        },
      },
    }
  )

  // Refresh the auth token on every request
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Protected routes (dashboard)
  const isProtectedRoute = pathname.startsWith('/dashboard') || pathname === '/'
  
  // Auth routes (login, register, forgot-password)
  // Note: setup-password and reset-password are handled separately as they can be accessed with or without auth
  const isAuthRoute = pathname.startsWith('/login') || 
                      pathname.startsWith('/register') || 
                      pathname.startsWith('/forgot-password')

  // Setup password route - for invited users setting up their account
  // (allowed regardless of auth state)
  // Reset password route - for existing users resetting their password
  // (client-side handles recovery token exchange, allowed regardless of auth state)

  // If user is not authenticated and trying to access protected route
  if (!user && isProtectedRoute) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/login'
    redirectUrl.searchParams.set('redirectedFrom', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // If user is authenticated and trying to access auth routes, redirect to dashboard
  // (but allow reset-password as users might reset their password while logged in)
  if (user && isAuthRoute) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/dashboard'
    return NextResponse.redirect(redirectUrl)
  }

  // If user is authenticated and on root, redirect to dashboard
  if (user && pathname === '/') {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/dashboard'
    return NextResponse.redirect(redirectUrl)
  }

  // Allow setup-password route regardless of auth state
  // (for invited users setting up their account)
  // Allow reset-password route regardless of auth state
  // (for existing users resetting their password)

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api routes (handled separately)
     * - static files (images, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

