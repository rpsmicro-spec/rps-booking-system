import type { Job } from '@/types/types'
import { STATUS_LABELS, COMPANY_INFO } from '@/lib/constants'
import { utcToIstDateObject } from '@/lib/utils/date-ist'
import { format } from 'date-fns'

export interface EmailTemplateData {
  job: Job
  viewLink: string
  whatsappLink?: string
}

const LOGO_URL = 'https://vkboymfxqspiffwaivxj.supabase.co/storage/v1/object/public/file-assets/images/Logo.png'

const EMAIL_STYLES = {
  font: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
  bg: 'rgb(246,249,252)',
  cardBg: 'rgb(255,255,255)',
  border: 'rgb(230,235,241)',
  text: 'rgb(31,41,55)',
  textMuted: 'rgb(82,95,127)',
  textMuted2: 'rgb(102,102,102)',
  link: 'rgb(37,99,235)',
  boxBg: 'rgb(243,244,246)',
  buttonBg: 'rgb(37,99,235)',
  footerMuted: 'rgb(153,153,153)',
} as const

/** Shared footer: full company address + copyright + automated notice */
function emailFooter(): string {
  const year = new Date().getFullYear()
  return `
<hr style="width:100%;border:none;border-top:1px solid ${EMAIL_STYLES.border};margin:24px 0 16px" />
<p style="font-size:13px;line-height:20px;color:${EMAIL_STYLES.textMuted2};margin:0 0 4px;font-weight:600">${COMPANY_INFO.NAME}</p>
<p style="font-size:12px;line-height:18px;color:${EMAIL_STYLES.textMuted2};margin:0;white-space:pre-line">${COMPANY_INFO.ADDRESS}</p>
<p style="font-size:12px;line-height:18px;color:${EMAIL_STYLES.textMuted2};margin:6px 0 0">📞 ${COMPANY_INFO.PHONE} | ${COMPANY_INFO.TEL} · 📧 <a href="mailto:${COMPANY_INFO.EMAIL}" style="color:${EMAIL_STYLES.link};text-decoration:none">${COMPANY_INFO.EMAIL}</a></p>
<p style="font-size:12px;line-height:18px;margin:4px 0 0"><a href="${COMPANY_INFO.GOOGLE_MAPS_LINK}" style="color:${EMAIL_STYLES.link};text-decoration:none">📍 View on Google Maps</a></p>
<p style="font-size:11px;line-height:16px;color:${EMAIL_STYLES.footerMuted};margin:16px 0 4px;text-align:center">© ${year} ${COMPANY_INFO.NAME}.</p>
<p style="font-size:11px;line-height:16px;color:${EMAIL_STYLES.footerMuted};margin:0;text-align:center">This is an automated email. Please do not reply.</p>
`.trim()
}

/** Shared wrapper: logo + optional heading + body slot + footer */
function emailShell(title: string, bodyHtml: string): string {
  return `
<!DOCTYPE html>
<html dir="ltr" lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="x-apple-disable-message-reformatting" />
  <title>${title}</title>
</head>
<body style="background-color:${EMAIL_STYLES.bg};font-family:${EMAIL_STYLES.font};margin:0;padding:0">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" align="center" style="background-color:${EMAIL_STYLES.bg}">
    <tr><td style="padding:24px 16px 48px">
      <table role="presentation" align="center" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;background:${EMAIL_STYLES.cardBg};border-radius:8px;padding:32px 24px;margin:0 auto">
        <tr><td>
          <img alt="${COMPANY_INFO.NAME}" src="${LOGO_URL}" width="120" height="auto" style="display:block;border:none;outline:none" />
          ${bodyHtml}
          ${emailFooter()}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
`.trim()
}

/**
 * Generate status change email HTML (simplified, standardized)
 */
export function generateStatusChangeEmail(data: EmailTemplateData): string {
  const { job, viewLink } = data
  const statusLabel = job.status ? STATUS_LABELS[job.status as keyof typeof STATUS_LABELS] : 'Unknown'

  const body = `
<h2 style="font-size:18px;line-height:26px;color:${EMAIL_STYLES.text};margin:20px 0 12px;font-weight:600">Job status update</h2>
<p style="font-size:15px;line-height:22px;color:${EMAIL_STYLES.textMuted};margin:0 0 16px">Hi ${job.customer_name}, your job status has been updated.</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${EMAIL_STYLES.boxBg};border-radius:8px;padding:16px;margin:0 0 20px">
  <tr><td>
    <p style="font-size:14px;line-height:22px;color:${EMAIL_STYLES.text};margin:0"><strong>Job:</strong> ${job.job_number}</p>
    <p style="font-size:14px;line-height:22px;color:${EMAIL_STYLES.text};margin:6px 0 0"><strong>Status:</strong> <span style="color:${EMAIL_STYLES.link};font-weight:600">${statusLabel}</span></p>
    ${job.material_type ? `<p style="font-size:14px;line-height:22px;color:${EMAIL_STYLES.text};margin:6px 0 0"><strong>Material:</strong> ${job.material_type}</p>` : ''}
  </td></tr>
</table>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:8px 0 0">
  <a href="${viewLink}" style="display:inline-block;background:${EMAIL_STYLES.buttonBg};color:#fff;font-size:14px;font-weight:600;text-decoration:none;padding:12px 24px;border-radius:6px" target="_blank">View job details</a>
</td></tr></table>
`
  return emailShell('Job status update', body)
}

/**
 * Generate completion email HTML (simplified, standardized)
 */
export function generateCompletionEmail(data: EmailTemplateData): string {
  const { job, viewLink } = data
  const deliveryStr = job.delivery_date
    ? (() => {
        const istDate = utcToIstDateObject(job.delivery_date)
        return istDate ? format(istDate, 'MMM dd, yyyy') : ''
      })()
    : ''

  const body = `
<h2 style="font-size:18px;line-height:26px;color:${EMAIL_STYLES.text};margin:20px 0 12px;font-weight:600">Job completed</h2>
<p style="font-size:15px;line-height:22px;color:${EMAIL_STYLES.textMuted};margin:0 0 16px">Hi ${job.customer_name}, your job is complete. View details and photos below.</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${EMAIL_STYLES.boxBg};border-radius:8px;padding:16px;margin:0 0 20px">
  <tr><td>
    <p style="font-size:14px;line-height:22px;color:${EMAIL_STYLES.text};margin:0"><strong>Job:</strong> ${job.job_number}</p>
    ${job.material_type ? `<p style="font-size:14px;line-height:22px;color:${EMAIL_STYLES.text};margin:6px 0 0"><strong>Material:</strong> ${job.material_type}</p>` : ''}
    ${deliveryStr ? `<p style="font-size:14px;line-height:22px;color:${EMAIL_STYLES.text};margin:6px 0 0"><strong>Delivery:</strong> ${deliveryStr}</p>` : ''}
  </td></tr>
</table>
${(job.invoice_file_path || (job as { invoice_url?: string }).invoice_url) ? `<p style="font-size:13px;line-height:20px;color:${EMAIL_STYLES.textMuted2};margin:0 0 16px">Your invoice is available on the job page.</p>` : ''}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:8px 0 0">
  <a href="${viewLink}" style="display:inline-block;background:${EMAIL_STYLES.buttonBg};color:#fff;font-size:14px;font-weight:600;text-decoration:none;padding:12px 24px;border-radius:6px" target="_blank">View job details</a>
</td></tr></table>
<p style="font-size:14px;line-height:22px;color:${EMAIL_STYLES.textMuted};margin:20px 0 0">Thank you for choosing ${COMPANY_INFO.NAME}.</p>
`
  return emailShell('Job completed', body)
}

function textFooter(): string {
  return `© ${new Date().getFullYear()} ${COMPANY_INFO.NAME}.

This is an automated email. Please do not reply.`
}

/** Plain text version for status change email */
export function generateStatusChangeEmailText(data: EmailTemplateData): string {
  const { job, viewLink } = data
  const statusLabel = job.status ? STATUS_LABELS[job.status as keyof typeof STATUS_LABELS] : 'Unknown'

  return [
    `${COMPANY_INFO.NAME} – Job status update`,
    '',
    `Hi ${job.customer_name}, your job status has been updated.`,
    '',
    `Job: ${job.job_number}`,
    `Status: ${statusLabel}`,
    job.material_type ? `Material: ${job.material_type}` : '',
    '',
    `View job details: ${viewLink}`,
    '',
    textFooter(),
  ]
    .filter(Boolean)
    .join('\n')
}

/** Plain text version for completion email */
export function generateCompletionEmailText(data: EmailTemplateData): string {
  const { job, viewLink } = data
  const deliveryStr = job.delivery_date
    ? (() => {
        const istDate = utcToIstDateObject(job.delivery_date)
        return istDate ? format(istDate, 'MMM dd, yyyy') : ''
      })()
    : ''

  const lines = [
    `${COMPANY_INFO.NAME} – Job completed`,
    '',
    `Hi ${job.customer_name}, your job is complete. View details and photos below.`,
    '',
    `Job: ${job.job_number}`,
    job.material_type ? `Material: ${job.material_type}` : '',
    deliveryStr ? `Delivery: ${deliveryStr}` : '',
    (job.invoice_file_path || (job as { invoice_url?: string }).invoice_url) ? 'Your invoice is available on the job page.' : '',
    '',
    `View job details: ${viewLink}`,
    '',
    `Thank you for choosing ${COMPANY_INFO.NAME}.`,
    '',
    textFooter(),
  ]
  return lines.filter(Boolean).join('\n')
}

