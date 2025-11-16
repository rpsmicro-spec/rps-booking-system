import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/helpers'
import { headers } from 'next/headers'
// Email sending is now manual only - removed automatic email imports

export async function GET(request: Request) {
  try {
    await requireAuth()
    const supabase = await createClient()

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = supabase
      .from('jobs')
      .select('*')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply status filter
    if (status) {
      query = query.eq('status', status)
    }

    // Apply search filter (search in job_number, customer_name, email)
    if (search) {
      query = query.or(
        `job_number.ilike.%${search}%,customer_name.ilike.%${search}%,email.ilike.%${search}%`
      )
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

    const { data, error } = await query

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    // Get total count for pagination
    let countQuery = supabase
      .from('jobs')
      .select('*', { count: 'exact', head: true })
      .is('deleted_at', null)

    if (status) {
      countQuery = countQuery.eq('status', status)
    }

    if (search) {
      countQuery = countQuery.or(
        `job_number.ilike.%${search}%,customer_name.ilike.%${search}%,email.ilike.%${search}%`
      )
    }

    if (dateFrom) {
      countQuery = countQuery.gte('booking_date', dateFrom)
    }
    if (dateTo) {
      const endDate = new Date(dateTo)
      endDate.setDate(endDate.getDate() + 1)
      countQuery = countQuery.lt('booking_date', endDate.toISOString())
    }

    const { count } = await countQuery

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
    const { user } = await requireAuth()
    const supabase = await createClient()
    const adminClient = createAdminClient()

    const body = await request.json()

    // Validate required fields
    if (!body.customer_name || !body.booking_date) {
      return NextResponse.json(
        { error: 'Company name and booking date are required' },
        { status: 400 }
      )
    }

    // Always auto-generate job number to ensure uniqueness and proper sequencing
    // Manual job numbers are not allowed to prevent duplicates and counter desync
    const { generateAndReserveJobNumber } = await import('@/lib/job-number-generator')
    const jobNumber = await generateAndReserveJobNumber()

    // Create job
    const { data, error } = await supabase
      .from('jobs')
      .insert({
        ...body,
        job_number: jobNumber,
        created_by: user.id,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: error.message },
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

