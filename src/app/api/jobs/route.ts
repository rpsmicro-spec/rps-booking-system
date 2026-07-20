import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/helpers'
import { headers } from 'next/headers'
// Email sending is now manual only - removed automatic email imports

export async function GET(request: Request) {
  try {
    const { supabase } = await requireAuth()

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const limitRaw = parseInt(searchParams.get('limit') || '50', 10)
    const offsetRaw = parseInt(searchParams.get('offset') || '0', 10)
    const limit = Number.isNaN(limitRaw) ? 50 : Math.max(1, Math.min(limitRaw, 100))
    const offset = Number.isNaN(offsetRaw) ? 0 : Math.max(0, offsetRaw)

    // count: 'exact' rides along on the page query — one DB round-trip
    // instead of a duplicated filtered count query.
    let query = supabase
      .from('jobs')
      .select('*', { count: 'exact' })
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply status filter
    if (status) {
      query = query.eq('status', status)
    }

    // Apply search filter (search in job_number, customer_name, email)
    if (search) {
      // Escape special characters that could break the PostgREST filter syntax
      const sanitized = search.replace(/[%_,.()"'\\]/g, '')
      if (sanitized) {
        query = query.or(
          `job_number.ilike.%${sanitized}%,customer_name.ilike.%${sanitized}%,email.ilike.%${sanitized}%`
        )
      }
    }

    // Apply date range filter (filter by booking_date)
    if (dateFrom) {
      query = query.gte('booking_date', dateFrom)
    }
    if (dateTo) {
      // Add one day to include the entire end date
      const endDate = new Date(dateTo)
      endDate.setDate(endDate.getDate() + 1)
      query = query.lt('booking_date', endDate.toISOString())
    }

    const { data, error, count } = await query

    if (error) {
      console.error('Jobs query error:', error.message)
      return NextResponse.json(
        { error: 'Failed to fetch jobs' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        jobs: data || [],
        total: count || 0,
        limit,
        offset,
      },
      { status: 200 }
    )
  } catch {
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const { user, supabase } = await requireAuth()
    const adminClient = createAdminClient()

    const body = await request.json()

    // Validate required fields
    if (!body.customer_name || !body.booking_date) {
      return NextResponse.json(
        { error: 'Company name and booking date are required' },
        { status: 400 }
      )
    }

    // Server-owned fields must never come from the request body: job_number
    // and created_by are set below, and letting callers set id, timestamps,
    // deleted_at, or public_token would forge/break records.
    const {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      id: _id, job_number: _jobNumber, created_by: _createdBy, created_at: _createdAt,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      updated_at: _updatedAt, deleted_at: _deletedAt, public_token: _publicToken,
      client_ref: clientRefRaw,
      ...jobFields
    } = body

    // Idempotency for offline sync: the client sends its local job id as
    // client_ref. If a previous attempt already created this job (response
    // lost mid-flight), return the existing row instead of duplicating it.
    const clientRef =
      typeof clientRefRaw === 'string' && clientRefRaw.length > 0 && clientRefRaw.length <= 128
        ? clientRefRaw
        : null

    if (clientRef) {
      const { data: existing } = await supabase
        .from('jobs')
        .select('*')
        .filter('client_ref', 'eq', clientRef)
        .maybeSingle()

      if (existing) {
        return NextResponse.json({ job: existing, deduplicated: true }, { status: 200 })
      }
    }

    // Always auto-generate job number to ensure uniqueness and proper sequencing
    // Manual job numbers are not allowed to prevent duplicates and counter desync
    const { generateAndReserveJobNumber } = await import('@/lib/job-number-generator')
    const jobNumber = await generateAndReserveJobNumber()

    // Create job. client_ref is only referenced when present so plain online
    // creation keeps working even if the column migration hasn't run yet.
    // (cast: client_ref is newer than the generated types)
    const { data, error } = await supabase
      .from('jobs')
      .insert({
        ...jobFields,
        job_number: jobNumber,
        created_by: user.id,
        ...(clientRef ? { client_ref: clientRef } : {}),
      } as never)
      .select()
      .single()

    if (error) {
      // Unique violation on client_ref: a concurrent replay won the race —
      // return the row it created.
      if (clientRef && error.code === '23505' && error.message.includes('client_ref')) {
        const { data: existing } = await supabase
          .from('jobs')
          .select('*')
          .filter('client_ref', 'eq', clientRef)
          .maybeSingle()
        if (existing) {
          return NextResponse.json({ job: existing, deduplicated: true }, { status: 200 })
        }
      }
      console.error('Job creation error:', error.message)
      return NextResponse.json(
        { error: 'Failed to create job' },
        { status: 400 }
      )
    }

    // Log audit event (using admin client to bypass RLS)
    const headersList = await headers()
    await adminClient.from('audit_log').insert({
      user_id: user.id,
      action: 'job.created',
      resource_type: 'job',
      resource_id: data.id,
      details: {
        job_number: data.job_number,
        customer_name: data.customer_name,
      },
      ip_address: headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || null,
      user_agent: headersList.get('user-agent') || null,
    })

    // Email notifications are now sent manually via the "Send Email" button
    // No automatic email sending on job creation

    return NextResponse.json({ job: data }, { status: 201 })
  } catch {
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

