import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { canManageUsers, getUserRole } from '@/lib/auth/roles'

export async function GET() {
  try {
    // Check if user can manage users
    const role = await getUserRole()
    if (!canManageUsers(role)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Get all users from users table
    const adminClient = createAdminClient()
    const { data: users, error } = await adminClient
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Failed to fetch users:', error.message)
      return NextResponse.json(
        { error: 'Failed to fetch users' },
        { status: 400 }
      )
    }

    return NextResponse.json({ users: users || [] }, { status: 200 })
  } catch {
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

