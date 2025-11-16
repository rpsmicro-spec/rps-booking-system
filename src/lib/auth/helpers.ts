import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

/**
 * Get the current user, redirect to login if not authenticated
 */
export async function requireAuth() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  return { user, supabase }
}

/**
 * Get the current user, return null if not authenticated (no redirect)
 */
export async function getCurrentUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return user
}

