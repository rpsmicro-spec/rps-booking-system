import { createClient } from '@/lib/supabase/server'
import { USER_ROLES, type UserRole } from '@/lib/constants/roles'
import { canInviteUsers, canManageUsers } from '@/lib/constants/roles'

/**
 * Get the current user's role from the users table
 */
export async function getUserRole(): Promise<UserRole | null> {
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()
  const user = data?.user

  if (!user) return null

  // Get role from users table
  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  return (userData?.role as UserRole) || USER_ROLES.STAFF
}

/**
 * Get the current user's full profile from the users table
 */
export async function getUserProfile() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()
  const user = data?.user

  if (!user) return null

  const { data: userData } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  return userData
}

// Re-export permission checks
export { canInviteUsers, canManageUsers }
