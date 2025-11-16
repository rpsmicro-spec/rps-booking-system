import { ReactNode } from 'react'
import Image from 'next/image'

interface AuthLayoutProps {
  children: ReactNode
  title: string
  subtitle?: string
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="space-y-4 text-center">
          <div className="flex justify-center">
            <Image
              src="/Logo.png"
              alt="RPS Micro Electronics"
              width={120}
              height={120}
              className="object-contain rounded-full"
              priority
            />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">{title}</h1>
            {subtitle && (
              <p className="text-muted-foreground">{subtitle}</p>
            )}
          </div>
        </div>
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          {children}
        </div>
      </div>
    </div>
  )
}

