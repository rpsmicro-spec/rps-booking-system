'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { LayoutDashboard, Briefcase, Contact, Activity } from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { href: '/jobs', label: 'Jobs', icon: Briefcase },
  { href: '/customers', label: 'Customers', icon: Contact },
]

const adminNavItems = [
  { href: '/activity', label: 'Activity', icon: Activity },
]

export function MobileNav() {
  const pathname = usePathname()
  const [canManageUsers, setCanManageUsers] = useState(false)

  useEffect(() => {
    fetch('/api/users/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.user?.role) {
          setCanManageUsers(data.user.role === 'owner' || data.user.role === 'admin')
        }
      })
      .catch(() => {})
  }, [])

  const items = [...navItems, ...(canManageUsers ? adminNavItems : [])]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden shadow-lg">
      <div className={cn('grid h-16', items.length === 4 ? 'grid-cols-4' : 'grid-cols-3')}>
        {items.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center space-y-1 transition-colors active:opacity-70',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs font-medium">
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

