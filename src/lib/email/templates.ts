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
  const logoUrl = 'https://vkboymfxqspiffwaivxj.supabase.co/storage/v1/object/public/file-assets/images/Logo.png'

  return `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html dir="ltr" lang="en">
<head>
  <link rel="preload" as="image" href="${logoUrl}" />
  <meta content="text/html; charset=UTF-8" http-equiv="Content-Type" />
  <meta name="x-apple-disable-message-reformatting" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Job Status Update</title>
</head>
<body style="background-color:rgb(246,249,252)">
  <table border="0" width="100%" cellpadding="0" cellspacing="0" role="presentation" align="center">
    <tbody>
      <tr>
        <td style='background-color:rgb(246,249,252);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif'>
          <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="max-width:37.5em;background-color:rgb(255,255,255);margin-right:auto;margin-left:auto;padding-bottom:48px;padding-top:20px;margin-bottom:64px">
            <tbody>
              <tr style="width:100%">
                <td>
                  <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="padding-right:48px;padding-left:48px">
                    <tbody>
                      <tr>
                        <td>
                          <img alt="${COMPANY_INFO.NAME}" src="${logoUrl}" style="display:block;outline:none;border:none;text-decoration:none;max-width:120px;height:auto" />
                          <hr style="width:100%;border:none;border-top:1px solid #eaeaea;border-color:rgb(230,235,241);margin-bottom:20px;margin-top:20px" />
                          <h2 style="font-size:20px;line-height:28px;color:rgb(31,41,55);text-align:left;margin-top:16px;margin-bottom:16px;font-weight:600">Job Status Update</h2>
                          <p style="font-size:16px;line-height:24px;color:rgb(82,95,127);text-align:left;margin-top:16px;margin-bottom:16px">
                            Dear ${job.customer_name},
                          </p>
                          <p style="font-size:16px;line-height:24px;color:rgb(82,95,127);text-align:left;margin-top:16px;margin-bottom:16px">
                            We wanted to inform you that your job status has been updated:
                          </p>
                          <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background-color:rgb(243,244,246);border-radius:6px;margin:20px 0;padding:15px">
                            <tbody>
                              <tr>
                                <td>
                                  <p style="font-size:16px;line-height:24px;color:rgb(31,41,55);margin:5px 0"><strong>Job Number:</strong> ${job.job_number}</p>
                                  <p style="font-size:16px;line-height:24px;color:rgb(31,41,55);margin:5px 0"><strong>Status:</strong> <span style="color:rgb(37,99,235);font-weight:bold">${statusLabel}</span></p>
                                  ${job.material_type ? `<p style="font-size:16px;line-height:24px;color:rgb(31,41,55);margin:5px 0"><strong>Material Type:</strong> ${job.material_type}</p>` : ''}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                          <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="margin:30px 0">
                            <tbody>
                              <tr>
                                <td align="center">
                                  <a href="${viewLink}" style="line-height:100%;text-decoration:none;display:inline-block;max-width:100%;mso-padding-alt:0px;background-color:rgb(37,99,235);border-radius:6px;color:rgb(255,255,255);font-size:16px;font-weight:700;text-decoration-line:none;text-align:center;padding:12px 24px" target="_blank">
                                    <span style="max-width:100%;display:inline-block;line-height:120%;mso-padding-alt:0px;mso-text-raise:7.5px">View Job Details</span>
                                  </a>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                          <p style="font-size:14px;line-height:20px;color:rgb(102,102,102);text-align:left;margin-top:16px;margin-bottom:16px">
                            Click the button above to view all details about your job, including photos and current status.
                          </p>
                          <hr style="width:100%;border:none;border-top:1px solid #eaeaea;border-color:rgb(230,235,241);margin-bottom:20px;margin-top:30px" />
                          <p style="font-size:14px;line-height:20px;color:rgb(31,41,55);font-weight:bold;margin:0;margin-bottom:5px">${COMPANY_INFO.NAME}</p>
                          <p style="font-size:13px;line-height:20px;color:rgb(102,102,102);margin:5px 0;white-space:pre-line">${COMPANY_INFO.ADDRESS}</p>
                          <p style="font-size:13px;line-height:20px;color:rgb(102,102,102);margin:5px 0">📞 ${COMPANY_INFO.PHONE} | ${COMPANY_INFO.TEL}</p>
                          <p style="font-size:13px;line-height:20px;color:rgb(102,102,102);margin:5px 0">📧 <a href="mailto:${COMPANY_INFO.EMAIL}" style="color:rgb(37,99,235);text-decoration-line:none">${COMPANY_INFO.EMAIL}</a></p>
                          <p style="font-size:13px;line-height:20px;color:rgb(102,102,102);margin:10px 0 0 0">
                            <a href="${COMPANY_INFO.GOOGLE_MAPS_LINK}" style="color:rgb(37,99,235);text-decoration-line:none">📍 View on Google Maps</a>
                          </p>
                          <hr style="width:100%;border:none;border-top:1px solid #eaeaea;border-color:rgb(230,235,241);margin-bottom:20px;margin-top:20px" />
                          <p style="font-size:12px;line-height:16px;color:rgb(102,102,102);margin-top:16px;margin-bottom:16px;text-align:center">
                            &copy; ${new Date().getFullYear()} ${COMPANY_INFO.NAME}. All rights reserved.
                          </p>
                          ${whatsappLink ? `
                          <p style="font-size:11px;line-height:16px;color:rgb(153,153,153);margin-top:10px;margin-bottom:8px;text-align:center">
                            <strong>Need to contact us?</strong><br />
                            <a href="${whatsappLink}" style="color:rgb(37,99,235);text-decoration-line:none">Send us a message on WhatsApp</a>
                          </p>
                          ` : ''}
                          <p style="font-size:11px;line-height:16px;color:rgb(153,153,153);margin-top:8px;margin-bottom:16px;text-align:center">
                            This is an automated notification. Please do not reply to this email.
                          </p>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>
            </tbody>
          </table>
        </td>
      </tr>
    </tbody>
  </table>
</body>
</html>
  `.trim()
}

/**
 * Generate completion email HTML
 */
export function generateCompletionEmail(data: EmailTemplateData): string {
  const { job, viewLink, whatsappLink } = data
  const logoUrl = 'https://vkboymfxqspiffwaivxj.supabase.co/storage/v1/object/public/file-assets/images/Logo.png'

  return `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html dir="ltr" lang="en">
<head>
  <link rel="preload" as="image" href="${logoUrl}" />
  <meta content="text/html; charset=UTF-8" http-equiv="Content-Type" />
  <meta name="x-apple-disable-message-reformatting" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Job Completed</title>
</head>
<body style="background-color:rgb(246,249,252)">
  <table border="0" width="100%" cellpadding="0" cellspacing="0" role="presentation" align="center">
    <tbody>
      <tr>
        <td style='background-color:rgb(246,249,252);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif'>
          <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="max-width:37.5em;background-color:rgb(255,255,255);margin-right:auto;margin-left:auto;padding-bottom:48px;padding-top:20px;margin-bottom:64px">
            <tbody>
              <tr style="width:100%">
                <td>
                  <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="padding-right:48px;padding-left:48px">
                    <tbody>
                      <tr>
                        <td>
                          <img alt="${COMPANY_INFO.NAME}" src="${logoUrl}" style="display:block;outline:none;border:none;text-decoration:none;max-width:120px;height:auto" />
                          <hr style="width:100%;border:none;border-top:1px solid #eaeaea;border-color:rgb(230,235,241);margin-bottom:20px;margin-top:20px" />
                          <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background-color:rgb(16,185,129);border-radius:8px;margin-bottom:20px;text-align:center;padding:20px">
                            <tbody>
                              <tr>
                                <td>
                                  <h2 style="color:rgb(255,255,255);margin:0;font-size:20px;line-height:28px;font-weight:600">✓ Job Completed!</h2>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                          <p style="font-size:16px;line-height:24px;color:rgb(82,95,127);text-align:left;margin-top:16px;margin-bottom:16px">
                            Dear ${job.customer_name},
                          </p>
                          <p style="font-size:16px;line-height:24px;color:rgb(82,95,127);text-align:left;margin-top:16px;margin-bottom:16px">
                            Great news! Your job has been completed successfully.
                          </p>
                          <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background-color:rgb(243,244,246);border-radius:6px;margin:20px 0;padding:15px">
                            <tbody>
                              <tr>
                                <td>
                                  <p style="font-size:16px;line-height:24px;color:rgb(31,41,55);margin:5px 0"><strong>Job Number:</strong> ${job.job_number}</p>
                                  ${job.material_type ? `<p style="font-size:16px;line-height:24px;color:rgb(31,41,55);margin:5px 0"><strong>Material Type:</strong> ${job.material_type}</p>` : ''}
                                  ${job.delivery_date ? `<p style="font-size:16px;line-height:24px;color:rgb(31,41,55);margin:5px 0"><strong>Delivery Date:</strong> ${new Date(job.delivery_date).toLocaleDateString()}</p>` : ''}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                          <p style="font-size:16px;line-height:24px;color:rgb(82,95,127);text-align:left;margin-top:16px;margin-bottom:16px">
                            You can now view the completed work, including before and after photos, on our website.
                          </p>
                          <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="margin:30px 0">
                            <tbody>
                              <tr>
                                <td align="center">
                                  <a href="${viewLink}" style="line-height:100%;text-decoration:none;display:inline-block;max-width:100%;mso-padding-alt:0px;background-color:rgb(37,99,235);border-radius:6px;color:rgb(255,255,255);font-size:16px;font-weight:700;text-decoration-line:none;text-align:center;padding:12px 24px" target="_blank">
                                    <span style="max-width:100%;display:inline-block;line-height:120%;mso-padding-alt:0px;mso-text-raise:7.5px">View Completed Job</span>
                                  </a>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                          ${job.invoice_file_path ? `
                          <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background-color:rgb(254,243,199);border-radius:6px;margin:20px 0;border-left:4px solid rgb(245,158,11);padding:15px">
                            <tbody>
                              <tr>
                                <td>
                                  <p style="font-size:16px;line-height:24px;color:rgb(31,41,55);margin:0;font-weight:bold">Invoice Available:</p>
                                  <p style="font-size:14px;line-height:20px;color:rgb(102,102,102);margin:5px 0">Your invoice is available on the job details page.</p>
                                  <p style="font-size:14px;line-height:20px;margin:5px 0">
                                    <a href="${viewLink}" style="color:rgb(37,99,235);text-decoration-line:none" target="_blank" rel="noopener noreferrer">View Invoice on Job Page →</a>
                                  </p>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                          ` : ''}
                          <p style="font-size:16px;line-height:24px;color:rgb(82,95,127);text-align:left;margin-top:30px;margin-bottom:16px">
                            Thank you for choosing ${COMPANY_INFO.NAME}!
                          </p>
                          <hr style="width:100%;border:none;border-top:1px solid #eaeaea;border-color:rgb(230,235,241);margin-bottom:20px;margin-top:30px" />
                          <p style="font-size:14px;line-height:20px;color:rgb(31,41,55);font-weight:bold;margin:0;margin-bottom:5px">${COMPANY_INFO.NAME}</p>
                          <p style="font-size:13px;line-height:20px;color:rgb(102,102,102);margin:5px 0;white-space:pre-line">${COMPANY_INFO.ADDRESS}</p>
                          <p style="font-size:13px;line-height:20px;color:rgb(102,102,102);margin:5px 0">📞 ${COMPANY_INFO.PHONE} | ${COMPANY_INFO.TEL}</p>
                          <p style="font-size:13px;line-height:20px;color:rgb(102,102,102);margin:5px 0">📧 <a href="mailto:${COMPANY_INFO.EMAIL}" style="color:rgb(37,99,235);text-decoration-line:none">${COMPANY_INFO.EMAIL}</a></p>
                          <p style="font-size:13px;line-height:20px;color:rgb(102,102,102);margin:10px 0 0 0">
                            <a href="${COMPANY_INFO.GOOGLE_MAPS_LINK}" style="color:rgb(37,99,235);text-decoration-line:none">📍 View on Google Maps</a>
                          </p>
                          <hr style="width:100%;border:none;border-top:1px solid #eaeaea;border-color:rgb(230,235,241);margin-bottom:20px;margin-top:20px" />
                          <p style="font-size:12px;line-height:16px;color:rgb(102,102,102);margin-top:16px;margin-bottom:16px;text-align:center">
                            &copy; ${new Date().getFullYear()} ${COMPANY_INFO.NAME}. All rights reserved.
                          </p>
                          ${whatsappLink ? `
                          <p style="font-size:11px;line-height:16px;color:rgb(153,153,153);margin-top:10px;margin-bottom:8px;text-align:center">
                            <strong>Need to contact us?</strong><br />
                            <a href="${whatsappLink}" style="color:rgb(37,99,235);text-decoration-line:none">Send us a message on WhatsApp</a>
                          </p>
                          ` : ''}
                          <p style="font-size:11px;line-height:16px;color:rgb(153,153,153);margin-top:8px;margin-bottom:16px;text-align:center">
                            This is an automated notification. Please do not reply to this email.
                          </p>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>
            </tbody>
          </table>
        </td>
      </tr>
    </tbody>
  </table>
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

