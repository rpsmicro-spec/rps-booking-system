import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { canManageUsers, getUserRole } from '@/lib/auth/roles'
import { requireAuth } from '@/lib/auth/helpers'
import { istDateToUtc } from '@/lib/utils/date-ist'

// Get audit logs (global or filtered by user)
export async function GET(request: Request) {
  try {
    const { user } = await requireAuth()
    const role = await getUserRole()
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')
    const action = searchParams.get('action')
    const search = searchParams.get('search')
    const dateFrom = searchParams.get('date_from')
    const dateTo = searchParams.get('date_to')
    const limitRaw = parseInt(searchParams.get('limit') || '100', 10)
    const offsetRaw = parseInt(searchParams.get('offset') || '0', 10)
    const limit = Number.isNaN(limitRaw) ? 100 : Math.max(1, Math.min(limitRaw, 100))
    const offset = Number.isNaN(offsetRaw) ? 0 : Math.max(0, offsetRaw)

    const adminClient = createAdminClient()

    // If user_id is provided, check if user can view that user's logs
    // Owners and admins can view all logs, users can only view their own
    if (userId && userId !== user.id && !canManageUsers(role)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // count: 'exact' rides along on the page query — one DB round-trip
    // instead of a duplicated filtered count query.
    let query = adminClient
      .from('audit_log')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Filter by user if specified
    if (userId) {
      query = query.eq('user_id', userId)
    } else if (!canManageUsers(role)) {
      // Non-admin users can only see their own logs
      query = query.eq('user_id', user.id)
    }

    if (action) {
      query = query.eq('action', action)
    }

    // Date filters arrive as IST calendar dates (YYYY-MM-DD); convert the
    // day boundaries to UTC instants for the timestamptz column.
    if (dateFrom) {
      const fromUtc = istDateToUtc(dateFrom)
      if (fromUtc) {
        query = query.gte('created_at', fromUtc)
      }
    }
    if (dateTo) {
      const toUtc = istDateToUtc(dateTo)
      if (toUtc) {
        // Exclusive upper bound at the start of the next IST day
        const nextDay = new Date(new Date(toUtc).getTime() + 24 * 60 * 60 * 1000)
        query = query.lt('created_at', nextDay.toISOString())
      }
    }

    if (search) {
      // Escape characters that could break the PostgREST filter syntax
      // (commas separate or() conditions, parens delimit in-lists). Dots and
      // underscores stay so emails and action names remain searchable.
      const sanitized = search.replace(/[%,()"'\\]/g, '').trim()
      if (sanitized) {
        const orParts = [
          `action.ilike.%${sanitized}%`,
          `resource_type.ilike.%${sanitized}%`,
          `details->>job_number.ilike.%${sanitized}%`,
          `details->>customer_name.ilike.%${sanitized}%`,
          `details->>invited_email.ilike.%${sanitized}%`,
          `details->>updated_user_email.ilike.%${sanitized}%`,
          `details->>deleted_user_email.ilike.%${sanitized}%`,
        ]
        // audit_log only stores user_id, so match actor email/name via a
        // users lookup and fold the matching ids into the or() group.
        const { data: matchedUsers } = await adminClient
          .from('users')
          .select('id')
          .or(`email.ilike.%${sanitized}%,name.ilike.%${sanitized}%`)
          .limit(50)
        if (matchedUsers && matchedUsers.length > 0) {
          orParts.push(`user_id.in.(${matchedUsers.map(u => u.id).join(',')})`)
        }
        query = query.or(orParts.join(','))
      }
    }

    const { data: logs, error, count } = await query

    if (error) {
      console.error('Failed to fetch audit log:', error.message)
      return NextResponse.json(
        { error: 'Failed to fetch audit log' },
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

    return NextResponse.json(
      {
        logs: logsWithUsers || [],
        total: count || 0,
        limit,
        offset,
      },
      { status: 200 }
    )
  } catch (error: unknown) {
    console.error('Failed to fetch audit log:', error instanceof Error ? error.message : error)
    return NextResponse.json(
      { error: 'Failed to fetch audit log' },
      { status: 500 }
    )
  }
}
