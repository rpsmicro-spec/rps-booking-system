import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { UserUpdate } from '@/types/types'

export async function POST(request: Request) {
  try {
    const { password, name } = await request.json()

    if (!password) {
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      )
    }

    // Update the user's password (user must be authenticated via recovery token)
    const { error: passwordError } = await supabase.auth.updateUser({
      password: password,
      data: name ? { name } : undefined,
    })

    if (passwordError) {
      return NextResponse.json(
        { error: passwordError.message || 'Invalid or expired reset token' },
        { status: 400 }
      )
    }

    // Update name and mark invitation as accepted in users table
    const updateData: UserUpdate = {
      updated_at: new Date().toISOString(),
      invitation_accepted_at: new Date().toISOString(),
    }
    
    // Only update name if a non-empty name is provided
    // This preserves the invited name if the user doesn't change it
    if (name && name.trim().length > 0) {
      updateData.name = name.trim()
    }

    const { error: userError } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', user.id)

    if (userError) {
      console.error('Failed to update user:', userError)
      // Don't fail the request if user update fails
    }

    return NextResponse.json(
      { message: 'Password reset successfully' },
      { status: 200 }
    )
  } catch {
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

