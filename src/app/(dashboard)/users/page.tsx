import { requireAuth } from '@/lib/auth/helpers'
import { getUserRole } from '@/lib/auth/roles'
import { canManageUsers } from '@/lib/constants/roles'
import { redirect } from 'next/navigation'
import { UsersPageClient } from '@/features/users/components/UsersPageClient'

export default async function UsersPage() {
  await requireAuth()
  
  const role = await getUserRole()
  if (!canManageUsers(role)) {
    redirect('/dashboard')
  }

  return <UsersPageClient />
}

