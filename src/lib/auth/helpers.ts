import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

/**
 * Get the current user, redirect to login if not authenticated.
 * Cached per-request so layout + page don't each trigger auth/session work.
 */
export const requireAuth = cache(async () => {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getUser()
  const user = data?.user

  if (error || !user) {
    redirect('/login')
  }

  return { user, supabase }
})

/**
 * Get the current user, return null if not authenticated (no redirect).
 * Cached per-request for deduplication.
 */
export const getCurrentUser = cache(async () => {
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()
  return data?.user ?? null
})

