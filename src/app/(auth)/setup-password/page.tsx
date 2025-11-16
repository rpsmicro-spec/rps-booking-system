'use client'

import { Suspense } from 'react'
import { AuthLayout } from '@/components/layout/AuthLayout'
import { SetupPasswordForm } from '@/features/auth/components/SetupPasswordForm'

function SetupPasswordContent() {
  return (
    <AuthLayout
      title="Set Up Your Account"
      subtitle="Create a password to get started"
    >
      <SetupPasswordForm />
    </AuthLayout>
  )
}

export default function SetupPasswordPage() {
  return (
    <Suspense fallback={
      <AuthLayout
        title="Set Up Your Account"
        subtitle="Loading..."
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </AuthLayout>
    }>
      <SetupPasswordContent />
    </Suspense>
  )
}

