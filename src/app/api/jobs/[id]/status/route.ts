import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/helpers'
import { JOB_STATUS, STATUS_WORKFLOW } from '@/lib/constants'
import { headers } from 'next/headers'
// Email sending is now manual only - removed automatic email imports

const VALID_STATUSES = Object.values(JOB_STATUS) as string[]
const IDEMPOTENCY_KEY_RE = /^[A-Za-z0-9_-]{8,128}$/

/**
 * PATCH /api/jobs/:id/status
 *
 * Body: { status, expected_status?, idempotency_key? }
 *
 * - expected_status (offline/optimistic clients): the status the client saw
 *   when it made the change. If the job is already at `status` → 200, no
 *   side effects (idempotent replay). If it's at anything other than
 *   expected_status → 409 with current_status; the change is never applied
 *   over someone else's.
 * - idempotency_key: recorded in the audit row; a replay of an applied
 *   change returns 200 even if the job has moved on since.
 * - Without expected_status (old clients) behaviour is unchanged, except
 *   that a concurrent change landing between our read and write now returns
 *   409 instead of both being applied.
 *
 * The write is a compare-and-swap on the status we read, so history + audit
 * rows are written exactly once per applied change.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, supabase } = await requireAuth()
    const { id } = await params

    const body = await request.json().catch(() => null)
    const status = body?.status
    const expectedStatus = body?.expected_status
    const idempotencyKey =
      typeof body?.idempotency_key === 'string' && IDEMPOTENCY_KEY_RE.test(body.idempotency_key)
        ? (body.idempotency_key as string)
        : null

    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }
    if (expectedStatus !== undefined && !VALID_STATUSES.includes(expectedStatus)) {
      return NextResponse.json({ error: 'Invalid expected_status' }, { status: 400 })
    }

    const readJob = () =>
      supabase
        .from('jobs')
        .select('*')
        .eq('id', id)
        .is('deleted_at', null)
        .maybeSingle()

    const { data: currentJob, error: fetchError } = await readJob()
    if (fetchError || !currentJob) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    const adminClient = createAdminClient()

    // Replay of a change we already applied (response was lost)?
    if (idempotencyKey) {
      const { data: prior } = await adminClient
        .from('audit_log')
        .select('id')
        .eq('action', 'job.status_changed')
        .eq('resource_id', id)
        .eq('details->>idempotency_key', idempotencyKey)
        .limit(1)
      if (prior && prior.length > 0) {
        return NextResponse.json({ job: currentJob, already_applied: true }, { status: 200 })
      }
    }

    // Conflict guard for clients that say what they expected.
    const conflictOrNoop = (job: typeof currentJob) => {
      if (job.status === status) {
        return NextResponse.json({ job, already_applied: true }, { status: 200 })
      }
      return NextResponse.json(
        {
          error: `Job ${job.job_number} was changed to ${job.status} by someone else`,
          current_status: job.status,
          job,
        },
        { status: 409 }
      )
    }

    if (expectedStatus !== undefined && currentJob.status !== expectedStatus) {
      return conflictOrNoop(currentJob)
    }

    // Validate status transition
    const allowedStatuses =
      STATUS_WORKFLOW[currentJob.status as keyof typeof STATUS_WORKFLOW] ?? []
    if (!allowedStatuses.includes(status)) {
      if (expectedStatus !== undefined && currentJob.status === status) {
        return conflictOrNoop(currentJob)
      }
      return NextResponse.json(
        { error: `Cannot change status from ${currentJob.status} to ${status}` },
        { status: 400 }
      )
    }

    // Compare-and-swap: only succeeds if nobody changed the status since our
    // read. Zero rows → someone else won the race.
    const { data, error } = await supabase
      .from('jobs')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('status', currentJob.status as string)
      .is('deleted_at', null)
      .select()
      .maybeSingle()

    if (error) {
      console.error('Failed to update job status:', error.message)
      return NextResponse.json(
        { error: 'Failed to update job status' },
        { status: 400 }
      )
    }

    if (!data) {
      const { data: latest } = await readJob()
      if (!latest) {
        return NextResponse.json({ error: 'Job not found' }, { status: 404 })
      }
      return conflictOrNoop(latest)
    }

    // Side effects: only reached when this request actually applied the change.
    await supabase.from('job_status_history').insert({
      job_id: id,
      old_status: currentJob.status,
      new_status: status,
      changed_by: user.id,
      changed_at: new Date().toISOString(),
    })

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
        ...(idempotencyKey ? { idempotency_key: idempotencyKey } : {}),
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
