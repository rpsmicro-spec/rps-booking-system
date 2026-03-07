import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { canInviteUsers, getUserRole } from '@/lib/auth/roles'
import { requireAuth } from '@/lib/auth/helpers'
import { USER_ROLES, type UserRole } from '@/lib/constants/roles'
import { headers } from 'next/headers'

export async function POST(request: Request) {
  try {
    const { email, name, role = USER_ROLES.STAFF } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Validate role
    if (!Object.values(USER_ROLES).includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      )
    }

    // Check if user can invite
    const currentUserRole = await getUserRole()
    if (!canInviteUsers(currentUserRole)) {
      return NextResponse.json(
        { error: 'Unauthorized - You do not have permission to invite users' },
        { status: 403 }
      )
    }

    // Prevent non-owners from inviting owners or admins
    if (currentUserRole !== USER_ROLES.OWNER) {
      if (role === USER_ROLES.OWNER || role === USER_ROLES.ADMIN) {
        return NextResponse.json(
          { error: 'Only owner can invite admins and owners' },
          { status: 403 }
        )
      }
    }

    // Use admin client to invite user
    const adminClient = createAdminClient()
    const { data, error } = await adminClient.auth.admin.inviteUserByEmail(email, {
      data: {
        name: name || '',
        role: role as UserRole,
      },
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/setup-password`,
    })

    if (error) {
      console.error('Failed to create invitation:', error.message)
      return NextResponse.json(
        { error: 'Failed to create invitation' },
        { status: 400 }
      )
    }

    // Get current user for tracking
    const { user: currentUser } = await requireAuth()
    
    // The trigger will automatically create the user record in public.users
    // But we need to ensure the role is set correctly and track invitation
    if (data.user) {
      await adminClient
        .from('users')
        .upsert({
          id: data.user.id,
          email: data.user.email || email,
          name: name || '',
          role: role as UserRole,
          invited_at: new Date().toISOString(),
          invited_by: currentUser.id,
        })
    }

    // Log audit event (using admin client to bypass RLS)
    const headersList = await headers()
    await adminClient.from('audit_log').insert({
      user_id: currentUser.id,
      action: 'invite.sent',
      resource_type: 'invitation',
      resource_id: data.user?.id || null,
      details: {
        invited_email: email,
        invited_role: role,
        invited_name: name || null,
      },
      ip_address: headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || null,
      user_agent: headersList.get('user-agent') || null,
    })

    return NextResponse.json(
      { message: 'Invitation sent successfully', user: data.user },
      { status: 200 }
    )
  } catch {
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

