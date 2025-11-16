import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/helpers'

export async function GET() {
  try {
    const { user } = await requireAuth()
    const supabase = await createClient()

    // Get user profile from users table
    const { data: userProfile, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error) {
      return NextResponse.json(
        { error: error.message },
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
    const { user } = await requireAuth()
    const supabase = await createClient()
    const { name } = await request.json()

    if (!name || name.trim().length < 2) {
      return NextResponse.json(
        { error: 'Name must be at least 2 characters' },
        { status: 400 }
      )
    }

    // Update name in users table
    const { data: updatedUser, error } = await supabase
      .from('users')
      .update({
        name: name.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    // Also update auth metadata
    await supabase.auth.updateUser({
      data: { name: name.trim() },
    })

    return NextResponse.json({ user: updatedUser }, { status: 200 })
  } catch {
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
