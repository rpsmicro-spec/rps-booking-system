import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/helpers'
import { JOB_STATUS, STATUS_WORKFLOW, STATUS_LABELS } from '@/lib/constants'
import { headers } from 'next/headers'
import { resend, FROM_EMAIL, FROM_NAME } from '@/lib/email/resend'
import {
  generateStatusChangeEmail,
  generateCompletionEmail,
  generateStatusChangeEmailText,
  generateCompletionEmailText,
} from '@/lib/email/templates'
import { getJobViewUrl, getWhatsAppLink, generateWhatsAppMessage, generateCompletionWhatsAppMessage } from '@/lib/notifications/utils'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await requireAuth()
    const supabase = await createClient()
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
      return NextResponse.json(
        { error: error.message },
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

    // Send email notification if job has email and public_token
    if (data.email && data.public_token && resend) {
      try {
        const notificationType = status === JOB_STATUS.COMPLETED ? 'completion' : 'status_change'
        const viewLink = getJobViewUrl(data)
        const whatsappLink = getWhatsAppLink(
          notificationType === 'completion'
            ? generateCompletionWhatsAppMessage(data)
            : generateWhatsAppMessage(data, STATUS_LABELS[status as keyof typeof STATUS_LABELS] || 'Unknown')
        )

        const emailData = {
          job: data,
          viewLink,
          whatsappLink: whatsappLink ?? undefined,
        }

        let subject: string
        let html: string
        let text: string

        if (notificationType === 'completion') {
          subject = `Job ${data.job_number} Completed - RPS Micro Electronics`
          html = generateCompletionEmail(emailData)
          text = generateCompletionEmailText(emailData)
        } else {
          const statusLabel = STATUS_LABELS[status as keyof typeof STATUS_LABELS] || 'Unknown'
          subject = `Job ${data.job_number} Status Update - ${statusLabel}`
          html = generateStatusChangeEmail(emailData)
          text = generateStatusChangeEmailText(emailData)
        }

        const { data: emailResult, error: emailError } = await resend.emails.send({
          from: `${FROM_NAME} <${FROM_EMAIL}>`,
          to: data.email,
          subject,
          html,
          text,
        })

        if (emailError) {
          console.error('Email send error:', emailError)
        } else {
          console.log('Email notification sent successfully:', emailResult?.id)
        }
      } catch (error) {
        // Don't fail the status update if notification fails
        console.error('Failed to send email notification:', error)
      }
    } else if (data.email && data.public_token && !resend) {
      console.warn('Email service not configured. RESEND_API_KEY is missing.')
    }

    return NextResponse.json({ job: data }, { status: 200 })
  } catch {
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

