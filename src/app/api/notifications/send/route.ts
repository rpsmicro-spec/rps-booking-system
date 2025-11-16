import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/helpers'
import { resend, FROM_EMAIL, FROM_NAME } from '@/lib/email/resend'
import {
  generateStatusChangeEmail,
  generateCompletionEmail,
  generateStatusChangeEmailText,
  generateCompletionEmailText,
} from '@/lib/email/templates'
import { getJobViewUrl, getWhatsAppLink, generateWhatsAppMessage, generateCompletionWhatsAppMessage } from '@/lib/notifications/utils'
import { createClient } from '@/lib/supabase/server'
import { STATUS_LABELS } from '@/lib/constants'

export async function POST(request: Request) {
  try {
    await requireAuth()
    const { jobId, notificationType } = await request.json()

    if (!jobId || !notificationType) {
      return NextResponse.json(
        { error: 'jobId and notificationType are required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Fetch job with public_token
    const { data: job, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .is('deleted_at', null)
      .single()

    if (error || !job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      )
    }

    if (!job.public_token) {
      return NextResponse.json(
        { error: 'Job does not have a public token' },
        { status: 400 }
      )
    }

    if (!job.email || !job.email.trim()) {
      return NextResponse.json(
        { error: 'Cannot send email: Job does not have a customer email address. Please add an email address to the job to send notifications.' },
        { status: 400 }
      )
    }

    const viewLink = getJobViewUrl(job)
    const whatsappLink = getWhatsAppLink(
      notificationType === 'completion'
        ? generateCompletionWhatsAppMessage(job)
        : generateWhatsAppMessage(job, STATUS_LABELS[job.status as keyof typeof STATUS_LABELS] || 'Unknown')
    )

    const emailData = {
      job,
      viewLink,
      whatsappLink: whatsappLink ?? undefined,
    }

    let subject: string
    let html: string
    let text: string

    if (notificationType === 'completion') {
      subject = `Job ${job.job_number} Completed - RPS Micro Electronics`
      html = generateCompletionEmail(emailData)
      text = generateCompletionEmailText(emailData)
    } else {
      const statusLabel = STATUS_LABELS[job.status as keyof typeof STATUS_LABELS] || 'Unknown'
      subject = `Job ${job.job_number} Status Update - ${statusLabel}`
      html = generateStatusChangeEmail(emailData)
      text = generateStatusChangeEmailText(emailData)
    }

    // Send email via Resend
    if (!resend) {
      return NextResponse.json(
        { error: 'Email service not configured. Please set RESEND_API_KEY.' },
        { status: 500 }
      )
    }

    const { data: emailResult, error: emailError } = await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: job.email,
      subject,
      html,
      text,
    })

    if (emailError) {
      console.error('Email send error:', emailError)
      return NextResponse.json(
        { error: 'Failed to send email', details: emailError },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        message: 'Notification sent successfully',
        emailId: emailResult?.id,
        viewLink,
        whatsappLink,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Notification error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

