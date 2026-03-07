import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/helpers'

export async function GET() {
  try {
    const { user, supabase } = await requireAuth()

    // Get user profile from users table
    const { data: userProfile, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error) {
      console.error('Failed to fetch profile:', error.message)
      return NextResponse.json(
        { error: 'Failed to fetch profile' },
        { status: 400 }
      )
    }

    return NextResponse.json({ user: userProfile }, { status: 200 })
  } catch {
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
  try {
    const { user, supabase } = await requireAuth()
    const { name } = await request.json()

    const trimmedName = name?.trim() || ''

    if (!trimmedName || trimmedName.length < 2) {
      return NextResponse.json(
        { error: 'Name must be at least 2 characters' },
        { status: 400 }
      )
    }

    if (trimmedName.length > 100) {
      return NextResponse.json(
        { error: 'Name must be less than 100 characters' },
        { status: 400 }
      )
    }

    // Update name in users table
    const { data: updatedUser, error } = await supabase
      .from('users')
      .update({
        name: trimmedName,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Failed to update profile:', error.message)
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 400 }
      )
    }

    // Also update auth metadata
    await supabase.auth.updateUser({
      data: { name: trimmedName },
    })

    return NextResponse.json({ user: updatedUser }, { status: 200 })
  } catch {
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
