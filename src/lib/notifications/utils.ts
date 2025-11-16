import type { Job } from '@/types/types'
import { COMPANY_INFO } from '@/lib/constants'

/**
 * Generate public job view URL
 */
export function getJobViewUrl(job: Job, baseUrl?: string): string {
  const url = baseUrl || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  if (!job.public_token) {
    throw new Error('Job does not have a public token')
  }
  return `${url}/jobs/view/${job.public_token}`
}

/**
 * Generate WhatsApp link to contact the business
 * Uses business WhatsApp number from constants
 */
export function getWhatsAppLink(message?: string): string | null {
  const businessNumber: string = COMPANY_INFO.WHATSAPP_NUMBER
  if (!businessNumber || businessNumber === '+91XXXXXXXXXX') {
    return null
  }
  
  // Remove any non-digit characters except +
  const cleanPhone = businessNumber.replace(/[^\d+]/g, '')
  
  // If phone doesn't start with +, assume it's a local number
  const formattedPhone = cleanPhone.startsWith('+') ? cleanPhone : `+${cleanPhone}`
  
  const encodedMessage = message ? encodeURIComponent(message) : ''
  return `https://wa.me/${formattedPhone}${encodedMessage ? `?text=${encodedMessage}` : ''}`
}

/**
 * Generate WhatsApp message for customer to contact business about job status update
 */
export function generateWhatsAppMessage(job: Job, statusLabel: string): string {
  return `Hello, I have a question about my job ${job.job_number}. The status shows as ${statusLabel}.`
}

/**
 * Generate WhatsApp message for customer to contact business about job completion
 */
export function generateCompletionWhatsAppMessage(job: Job): string {
  return `Hello, I have a question about my completed job ${job.job_number}.`
}

/**
 * Generate WhatsApp link to send message TO customer
 * Uses customer's phone number from job
 */
export function getCustomerWhatsAppLink(phoneNumber: string, message: string): string | null {
  if (!phoneNumber) {
    return null
  }
  
  // Remove any non-digit characters except +
  const cleanPhone = phoneNumber.replace(/[^\d+]/g, '')
  
  // If phone doesn't start with +, assume it's a local number (Indian format)
  const formattedPhone = cleanPhone.startsWith('+') ? cleanPhone : `+91${cleanPhone}`
  
  const encodedMessage = encodeURIComponent(message)
  return `https://wa.me/${formattedPhone}?text=${encodedMessage}`
}

/**
 * Generate status update message to send TO customer (from business)
 */
export function generateStatusUpdateMessageToCustomer(job: Job, statusLabel: string, viewLink: string): string {
  return `Hello ${job.customer_name}, your job ${job.job_number} status has been updated to ${statusLabel}. View details: ${viewLink}

${COMPANY_INFO.NAME}
${COMPANY_INFO.ADDRESS}
📞 ${COMPANY_INFO.PHONE} | ${COMPANY_INFO.TEL}
📧 ${COMPANY_INFO.EMAIL}
📍 ${COMPANY_INFO.GOOGLE_MAPS_LINK}`
}

/**
 * Generate completion message to send TO customer (from business)
 */
export function generateCompletionMessageToCustomer(job: Job, viewLink: string): string {
  let message = `Hello ${job.customer_name}, great news! Your job ${job.job_number} has been completed.`
  if (job.invoice_file_path) {
    message += ` Invoice is available.`
  }
  message += ` View details: ${viewLink}

${COMPANY_INFO.NAME}
${COMPANY_INFO.ADDRESS}
📞 ${COMPANY_INFO.PHONE} | ${COMPANY_INFO.TEL}
📧 ${COMPANY_INFO.EMAIL}
📍 ${COMPANY_INFO.GOOGLE_MAPS_LINK}`
  return message
}

