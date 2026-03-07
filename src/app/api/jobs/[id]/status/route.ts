import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/helpers'
import { JOB_STATUS, STATUS_WORKFLOW } from '@/lib/constants'
import { headers } from 'next/headers'
// Email sending is now manual only - removed automatic email imports

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, supabase } = await requireAuth()
    const { id } = await params

    const { status } = await request.json()

    if (!status || !Object.values(JOB_STATUS).includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      )
    }

    // Get current job
    const { data: currentJob, error: fetchError } = await supabase
      .from('jobs')
      .select('status, job_number, customer_name')
      .eq('id', id)
      .is('deleted_at', null)
      .single()

    if (fetchError || !currentJob) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      )
    }

    // Validate status transition
    const allowedStatuses = STATUS_WORKFLOW[currentJob.status as keyof typeof STATUS_WORKFLOW]
    if (!allowedStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Cannot change status from ${currentJob.status} to ${status}` },
        { status: 400 }
      )
    }

    // Update job status
    const { data, error } = await supabase
      .from('jobs')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Failed to update job status:', error.message)
      return NextResponse.json(
        { error: 'Failed to update job status' },
        { status: 400 }
      )
    }

    // Record status change in history
    await supabase.from('job_status_history').insert({
      job_id: id,
      old_status: currentJob.status,
      new_status: status,
      changed_by: user.id,
      changed_at: new Date().toISOString(),
    })

    // Log audit event (using admin client to bypass RLS)
    const adminClient = createAdminClient()
    const headersList = await headers()
    await adminClient.from('audit_log').insert({
      user_id: user.id,
      action: 'job.status_changed',
      resource_type: 'job',
      resource_id: id,
      details: {
        job_number: currentJob.job_number,
        customer_name: currentJob.customer_name,
        old_status: currentJob.status,
        new_status: status,
      },
      ip_address: headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || null,
      user_agent: headersList.get('user-agent') || null,
    })

    // Email notifications are now sent manually via the "Send Email" button
    // No automatic email sending on status change

    return NextResponse.json({ job: data }, { status: 200 })
  } catch {
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

