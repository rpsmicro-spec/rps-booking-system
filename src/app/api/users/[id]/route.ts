import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { canManageUsers, getUserRole } from '@/lib/auth/roles'
import { requireAuth } from '@/lib/auth/helpers'
import { headers } from 'next/headers'
import type { UserUpdate } from '@/types/types'

// Get user details
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const role = await getUserRole()
    
    if (!canManageUsers(role)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    const adminClient = createAdminClient()
    const { data: user, error } = await adminClient
      .from('users')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Failed to fetch user:', error.message)
      return NextResponse.json(
        { error: 'Failed to fetch user' },
        { status: 400 }
      )
    }

    return NextResponse.json({ user }, { status: 200 })
  } catch {
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

// Update user (edit name, email, etc.)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { user: currentUser } = await requireAuth()
    const currentUserRole = await getUserRole()
    
    if (!canManageUsers(currentUserRole)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    const { name, email } = await request.json()
    const adminClient = createAdminClient()

    // Get current user data
    const { data: existingUser } = await adminClient
      .from('users')
      .select('*')
      .eq('id', id)
      .single()

    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const updates: UserUpdate = {
      updated_at: new Date().toISOString(),
    }

    if (name !== undefined) {
      updates.name = name
    }

    if (email !== undefined && email !== existingUser.email) {
      // Update email in auth.users
      const { error: authError } = await adminClient.auth.admin.updateUserById(
        id,
        { email }
      )
      if (authError) {
        console.error('Failed to update user:', authError.message)
        return NextResponse.json(
          { error: 'Failed to update user' },
          { status: 400 }
        )
      }
      updates.email = email
    }

    const { data: updatedUser, error } = await adminClient
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Failed to update user:', error.message)
      return NextResponse.json(
        { error: 'Failed to update user' },
        { status: 400 }
      )
    }

    // Log audit event (using admin client to bypass RLS)
    const headersList = await headers()
    await adminClient.from('audit_log').insert({
      user_id: currentUser.id,
      action: 'user.updated',
      resource_type: 'user',
      resource_id: id,
      details: {
        changes: { name, email },
        updated_user_email: updatedUser.email,
      },
      ip_address: headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || null,
      user_agent: headersList.get('user-agent') || null,
    })

    return NextResponse.json({ user: updatedUser }, { status: 200 })
  } catch (error: unknown) {
    console.error('Failed to update user:', error instanceof Error ? error.message : error)
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    )
  }
}

// Delete user (remove from org)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { user: currentUser } = await requireAuth()
    const currentUserRole = await getUserRole()
    
    if (!canManageUsers(currentUserRole)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Prevent deleting yourself
    if (id === currentUser.id) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      )
    }

    // Prevent deleting owner unless you're owner
    const adminClient = createAdminClient()
    const { data: targetUser } = await adminClient
      .from('users')
      .select('role, email')
      .eq('id', id)
      .single()

    if (targetUser?.role === 'owner' && currentUserRole !== 'owner') {
      return NextResponse.json(
        { error: 'Only owner can delete owner accounts' },
        { status: 403 }
      )
    }

    // Delete user from auth (this will cascade delete from users table)
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(id)

    if (deleteError) {
      console.error('Failed to delete user:', deleteError.message)
      return NextResponse.json(
        { error: 'Failed to delete user' },
        { status: 400 }
      )
    }

    // Log audit event (using admin client to bypass RLS)
    const headersList = await headers()
    await adminClient.from('audit_log').insert({
      user_id: currentUser.id,
      action: 'user.deleted',
      resource_type: 'user',
      resource_id: id,
      details: {
        deleted_user_email: targetUser?.email || id,
      },
      ip_address: headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || null,
      user_agent: headersList.get('user-agent') || null,
    })

    return NextResponse.json(
      { message: 'User deleted successfully' },
      { status: 200 }
    )
  } catch (error: unknown) {
    console.error('Failed to delete user:', error instanceof Error ? error.message : error)
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    )
  }
}

