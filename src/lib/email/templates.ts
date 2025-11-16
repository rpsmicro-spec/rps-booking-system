import type { Job } from '@/types/types'
import { STATUS_LABELS, COMPANY_INFO } from '@/lib/constants'

export interface EmailTemplateData {
  job: Job
  viewLink: string
  whatsappLink?: string
}

/**
 * Generate status change email HTML
 */
export function generateStatusChangeEmail(data: EmailTemplateData): string {
  const { job, viewLink, whatsappLink } = data
  const statusLabel = job.status ? STATUS_LABELS[job.status as keyof typeof STATUS_LABELS] : 'Unknown'

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Job Status Update</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <h1 style="color: #2563eb; margin: 0;">${COMPANY_INFO.NAME}</h1>
  </div>

  <div style="background-color: #fff; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb;">
    <h2 style="color: #1f2937; margin-top: 0;">Job Status Update</h2>
    
    <p>Dear ${job.customer_name},</p>
    
    <p>We wanted to inform you that your job status has been updated:</p>
    
    <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0;">
      <p style="margin: 5px 0;"><strong>Job Number:</strong> ${job.job_number}</p>
      <p style="margin: 5px 0;"><strong>Status:</strong> <span style="color: #2563eb; font-weight: bold;">${statusLabel}</span></p>
      ${job.material_type ? `<p style="margin: 5px 0;"><strong>Material Type:</strong> ${job.material_type}</p>` : ''}
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${viewLink}" 
         style="display: inline-block; background-color: #2563eb; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
        View Job Details
      </a>
    </div>

    <p style="color: #666; font-size: 14px;">
      Click the button above to view all details about your job, including photos and current status.
    </p>

    ${whatsappLink ? `
    <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
      <p style="margin: 0; color: #666; font-size: 14px;">
        <strong>Need to contact us?</strong><br>
        <a href="${whatsappLink}" style="color: #2563eb;">Send us a message on WhatsApp</a>
      </p>
    </div>
    ` : ''}

    <p style="margin-top: 30px; color: #666; font-size: 12px;">
      This is an automated notification. Please do not reply to this email.
    </p>

    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
      <p style="margin: 0; color: #1f2937; font-weight: bold; font-size: 14px;">${COMPANY_INFO.NAME}</p>
      <p style="margin: 5px 0; color: #666; font-size: 13px; white-space: pre-line; line-height: 1.6;">${COMPANY_INFO.ADDRESS}</p>
      <p style="margin: 5px 0; color: #666; font-size: 13px;">📞 ${COMPANY_INFO.PHONE} | ${COMPANY_INFO.TEL}</p>
      <p style="margin: 5px 0; color: #666; font-size: 13px;">📧 <a href="mailto:${COMPANY_INFO.EMAIL}" style="color: #2563eb; text-decoration: none;">${COMPANY_INFO.EMAIL}</a></p>
      <p style="margin: 10px 0 0 0;">
        <a href="${COMPANY_INFO.GOOGLE_MAPS_LINK}" style="color: #2563eb; text-decoration: none; font-size: 13px;">
          📍 View on Google Maps
        </a>
      </p>
    </div>
  </div>

  <div style="text-align: center; margin-top: 20px; color: #666; font-size: 12px;">
    <p>&copy; ${new Date().getFullYear()} ${COMPANY_INFO.NAME}. All rights reserved.</p>
  </div>
</body>
</html>
  `.trim()
}

/**
 * Generate completion email HTML
 */
export function generateCompletionEmail(data: EmailTemplateData): string {
  const { job, viewLink, whatsappLink } = data

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Job Completed</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <h1 style="color: #2563eb; margin: 0;">${COMPANY_INFO.NAME}</h1>
  </div>

  <div style="background-color: #10b981; padding: 20px; border-radius: 8px; margin-bottom: 20px; text-align: center;">
    <h2 style="color: #fff; margin: 0;">✓ Job Completed!</h2>
  </div>

  <div style="background-color: #fff; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb;">
    <p>Dear ${job.customer_name},</p>
    
    <p>Great news! Your job has been completed successfully.</p>
    
    <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0;">
      <p style="margin: 5px 0;"><strong>Job Number:</strong> ${job.job_number}</p>
      ${job.material_type ? `<p style="margin: 5px 0;"><strong>Material Type:</strong> ${job.material_type}</p>` : ''}
      ${job.delivery_date ? `<p style="margin: 5px 0;"><strong>Delivery Date:</strong> ${new Date(job.delivery_date).toLocaleDateString()}</p>` : ''}
    </div>

    <p>You can now view the completed work, including before and after photos, on our website.</p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${viewLink}" 
         style="display: inline-block; background-color: #2563eb; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
        View Completed Job
      </a>
    </div>

    ${job.invoice_file_path ? `
    <div style="background-color: #fef3c7; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #f59e0b;">
      <p style="margin: 0;"><strong>Invoice Available:</strong></p>
      <p style="margin: 5px 0; color: #666; font-size: 14px;">Your invoice is available on the job details page.</p>
      <a href="${viewLink}" style="color: #2563eb; text-decoration: none;" target="_blank" rel="noopener noreferrer">View Invoice on Job Page →</a>
    </div>
    ` : ''}

    ${whatsappLink ? `
    <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
      <p style="margin: 0; color: #666; font-size: 14px;">
        <strong>Questions or concerns?</strong><br>
        <a href="${whatsappLink}" style="color: #2563eb;">Contact us on WhatsApp</a>
      </p>
    </div>
    ` : ''}

    <p style="margin-top: 30px; color: #666; font-size: 12px;">
      Thank you for choosing ${COMPANY_INFO.NAME}!
    </p>

    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
      <p style="margin: 0; color: #1f2937; font-weight: bold; font-size: 14px;">${COMPANY_INFO.NAME}</p>
      <p style="margin: 5px 0; color: #666; font-size: 13px; white-space: pre-line; line-height: 1.6;">${COMPANY_INFO.ADDRESS}</p>
      <p style="margin: 5px 0; color: #666; font-size: 13px;">📞 ${COMPANY_INFO.PHONE} | ${COMPANY_INFO.TEL}</p>
      <p style="margin: 5px 0; color: #666; font-size: 13px;">📧 <a href="mailto:${COMPANY_INFO.EMAIL}" style="color: #2563eb; text-decoration: none;">${COMPANY_INFO.EMAIL}</a></p>
      <p style="margin: 10px 0 0 0;">
        <a href="${COMPANY_INFO.GOOGLE_MAPS_LINK}" style="color: #2563eb; text-decoration: none; font-size: 13px;">
          📍 View on Google Maps
        </a>
      </p>
    </div>
  </div>

  <div style="text-align: center; margin-top: 20px; color: #666; font-size: 12px;">
    <p>&copy; ${new Date().getFullYear()} ${COMPANY_INFO.NAME}. All rights reserved.</p>
  </div>
</body>
</html>
  `.trim()
}

/**
 * Generate plain text version for email clients that don't support HTML
 */
export function generateStatusChangeEmailText(data: EmailTemplateData): string {
  const { job, viewLink } = data
  const statusLabel = job.status ? STATUS_LABELS[job.status as keyof typeof STATUS_LABELS] : 'Unknown'

  return `
${COMPANY_INFO.NAME} - Job Status Update

Dear ${job.customer_name},

Your job status has been updated:

Job Number: ${job.job_number}
Status: ${statusLabel}
${job.material_type ? `Material Type: ${job.material_type}` : ''}

View your job details: ${viewLink}

This is an automated notification. Please do not reply to this email.

${COMPANY_INFO.NAME}
${COMPANY_INFO.ADDRESS}
📞 ${COMPANY_INFO.PHONE} | ${COMPANY_INFO.TEL}
📧 ${COMPANY_INFO.EMAIL}
📍 ${COMPANY_INFO.GOOGLE_MAPS_LINK}

© ${new Date().getFullYear()} ${COMPANY_INFO.NAME}. All rights reserved.
  `.trim()
}

export function generateCompletionEmailText(data: EmailTemplateData): string {
  const { job, viewLink } = data

  return `
${COMPANY_INFO.NAME} - Job Completed

Dear ${job.customer_name},

Great news! Your job has been completed successfully.

Job Number: ${job.job_number}
${job.material_type ? `Material Type: ${job.material_type}` : ''}
${job.delivery_date ? `Delivery Date: ${new Date(job.delivery_date).toLocaleDateString()}` : ''}

View your completed job: ${viewLink}
${job.invoice_file_path ? `Invoice is available on the job details page: ${viewLink}` : ''}

Thank you for choosing ${COMPANY_INFO.NAME}!

${COMPANY_INFO.NAME}
${COMPANY_INFO.ADDRESS}
📞 ${COMPANY_INFO.PHONE} | ${COMPANY_INFO.TEL}
📧 ${COMPANY_INFO.EMAIL}
📍 ${COMPANY_INFO.GOOGLE_MAPS_LINK}

© ${new Date().getFullYear()} ${COMPANY_INFO.NAME}. All rights reserved.
  `.trim()
}

