import { AuthLayout } from '@/components/layout/AuthLayout'
import { ForgotPasswordForm } from '@/features/auth/components/ForgotPasswordForm'

export default function ForgotPasswordPage() {
  return (
    <AuthLayout
      title="Forgot Password"
      subtitle="Enter your email to receive a password reset link"
    >
      <ForgotPasswordForm />
    </AuthLayout>
  )
}

