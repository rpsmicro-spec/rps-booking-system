import { requireAuth } from '@/lib/auth/helpers'
import { getUserRole } from '@/lib/auth/roles'
import { canManageUsers } from '@/lib/constants/roles'
import { redirect } from 'next/navigation'
import { ActivityPageClient } from '@/features/users/components/ActivityPageClient'

export default async function ActivityPage() {
  await requireAuth()
  
  const role = await getUserRole()
  if (!canManageUsers(role)) {
    redirect('/dashboard')
  }

  return <ActivityPageClient />
}

