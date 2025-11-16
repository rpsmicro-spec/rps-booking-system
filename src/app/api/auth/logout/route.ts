import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const logoutEverywhere = request.headers.get('X-Logout-Everywhere') === 'true'

    // Supabase signOut scopes:
    // - 'global' (default): Signs out from ALL sessions (all tabs, all devices)
    // - 'local': Signs out from current session only (keeps other tabs/devices logged in)
    // - 'others': Signs out from all other sessions except current
    if (logoutEverywhere) {
      // Sign out from all sessions (all tabs, all devices)
      const { error } = await supabase.auth.signOut({ scope: 'global' })

      if (error) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        )
      }
    } else {
      // Sign out from current session only (other tabs/devices stay logged in)
      const { error } = await supabase.auth.signOut({ scope: 'local' })

      if (error) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        )
      }
    }

    const response = NextResponse.json(
      { message: 'Logged out successfully' },
      { status: 200 }
    )
    
    // Clear the remember-me cookie on logout
    response.cookies.delete('remember-me')
    
    return response
  } catch {
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

