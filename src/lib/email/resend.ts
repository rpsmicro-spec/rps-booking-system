import { Resend } from 'resend'
import { COMPANY_INFO } from '@/lib/constants'

// Initialize Resend only if API key is available
export const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null

export const FROM_EMAIL = process.env.FROM_EMAIL || 'onboarding@resend.dev'
export const FROM_NAME = COMPANY_INFO.NAME

