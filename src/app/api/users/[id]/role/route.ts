import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { canManageUsers, getUserRole } from '@/lib/auth/roles'
import { USER_ROLES, type UserRole } from '@/lib/constants/roles'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { role } = await request.json()

    // Validate role
    if (!Object.values(USER_ROLES).includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      )
    }

    // Check if user can manage users
    const currentUserRole = await getUserRole()
    if (!canManageUsers(currentUserRole)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Prevent changing owner role (only owner can change owner)
    if (role === USER_ROLES.OWNER && currentUserRole !== USER_ROLES.OWNER) {
      return NextResponse.json(
        { error: 'Only owner can assign owner role' },
        { status: 403 }
      )
    }

    // Update user role in users table
    const adminClient = createAdminClient()
    const { error } = await adminClient
      .from('users')
      .update({
        role: role as UserRole,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { message: 'User role updated successfully' },
      { status: 200 }
    )
  } catch {
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

