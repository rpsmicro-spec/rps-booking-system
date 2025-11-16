'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface FloatingActionButtonProps {
  href: string
  label?: string
  className?: string
}

export function FloatingActionButton({
  href,
  label = 'New Job',
  className,
}: FloatingActionButtonProps) {
  const pathname = usePathname()
  
  // Hide FAB on the new job page
  if (pathname === '/jobs/new') {
    return null
  }

  return (
    <div className="fixed bottom-20 right-4 z-50 md:hidden">
      <Button
        asChild
        size="lg"
        className={cn(
          'h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-shadow',
          className
        )}
      >
        <Link href={href}>
          <Plus className="h-6 w-6" />
          <span className="sr-only">{label}</span>
        </Link>
      </Button>
    </div>
  )
}

