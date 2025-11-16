'use client'

import { Suspense } from 'react'
import { AuthLayout } from '@/components/layout/AuthLayout'
import { ResetPasswordForm } from '@/features/auth/components/ResetPasswordForm'

function ResetPasswordContent() {
  return (
    <AuthLayout
      title="Reset Password"
      subtitle="Enter your new password"
    >
      <ResetPasswordForm />
    </AuthLayout>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <AuthLayout
        title="Reset Password"
        subtitle="Loading..."
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </AuthLayout>
    }>
      <ResetPasswordContent />
    </Suspense>
  )
}

