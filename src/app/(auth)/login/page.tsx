import Link from 'next/link'
import { AuthLayout } from '@/components/layout/AuthLayout'
import { LoginForm } from '@/features/auth/components/LoginForm'

export default function LoginPage() {
  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Log in to your account to continue"
    >
      <LoginForm />
      <div className="mt-4 text-center text-sm">
        <Link href="/forgot-password" className="text-primary hover:underline">
          Forgot password?
        </Link>
      </div>
    </AuthLayout>
  )
}

