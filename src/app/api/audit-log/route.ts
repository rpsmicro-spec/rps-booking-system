import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { canManageUsers, getUserRole } from '@/lib/auth/roles'
import { requireAuth } from '@/lib/auth/helpers'

// Get audit logs (global or filtered by user)
export async function GET(request: Request) {
  try {
    const { user } = await requireAuth()
    const role = await getUserRole()
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')

    const adminClient = createAdminClient()

    // If user_id is provided, check if user can view that user's logs
    // Owners and admins can view all logs, users can only view their own
    if (userId && userId !== user.id && !canManageUsers(role)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    let query = adminClient
      .from('audit_log')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Filter by user if specified
    if (userId) {
      query = query.eq('user_id', userId)
    } else if (!canManageUsers(role)) {
      // Non-admin users can only see their own logs
      query = query.eq('user_id', user.id)
    }

    const { data: logs, error } = await query

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    // Get user details for each log entry
    const userIds = [...new Set(logs?.map(log => log.user_id).filter(Boolean) || [])]
    const { data: users } = await adminClient
      .from('users')
      .select('id, email, name')
      .in('id', userIds.filter((id): id is string => id !== null))

    const usersMap = new Map(users?.map(u => [u.id, u]) || [])

    const logsWithUsers = logs?.map(log => ({
      ...log,
      user: log.user_id ? usersMap.get(log.user_id) : null,
    }))

    return NextResponse.json({ logs: logsWithUsers || [] }, { status: 200 })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

