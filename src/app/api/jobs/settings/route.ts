import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/helpers'
import { getUserRole } from '@/lib/auth/roles'
import { USER_ROLES } from '@/lib/constants/roles'
import type { Database } from '@/types/database.types'

type JobNumberSettings = Database['public']['Tables']['job_number_settings']['Row']
type JobNumberSettingsUpdate = Database['public']['Tables']['job_number_settings']['Update']
type JobNumberSettingsInsert = Database['public']['Tables']['job_number_settings']['Insert']

export async function GET() {
  try {
    const { supabase } = await requireAuth()

    // Get settings (there should only be one row)
    const { data, error } = await supabase
      .from('job_number_settings')
      .select('*')
      .limit(1)
      .maybeSingle() as { data: JobNumberSettings | null; error: { code?: string; message?: string } | null }

    if (error) {
      // If no settings exist, return defaults
      if (error.code === 'PGRST116') {
        return NextResponse.json({
          settings: {
            id: '',
            prefix: 'RPS',
            number_base: 'sequence',
            next_number: 1,
            year: (() => {
              const now = new Date()
              const currentYear = now.getFullYear()
              const currentMonth = now.getMonth() + 1
              return currentMonth >= 4 ? currentYear : currentYear - 1
            })(),
          },
        })
      }
      throw error
    }

    return NextResponse.json({ settings: data })
  } catch (error) {
    console.error('Error fetching job number settings:', error)
    // If it's an auth error, return 401 instead of 500
    if (error instanceof Error && error.message.includes('redirect')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const { supabase } = await requireAuth()
    const role = await getUserRole()

    // Check if user has permission (owner or admin)
    if (!role || (role !== USER_ROLES.OWNER && role !== USER_ROLES.ADMIN)) {
      return NextResponse.json(
        { error: 'Unauthorized. Only owners and admins can update settings.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { prefix, next_number } = body

    // Validate input
    if (next_number !== undefined && (next_number < 1 || !Number.isInteger(next_number))) {
      return NextResponse.json(
        { error: 'next_number must be a positive integer.' },
        { status: 400 }
      )
    }

    // Check if settings exist
    const { data: existing } = await supabase
      .from('job_number_settings')
      .select('id')
      .limit(1)
      .maybeSingle() as { data: { id: string } | null; error: unknown }

    // Calculate financial year start year (April 1 - March 31)
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() + 1 // getMonth() returns 0-11
    const financialYearStartYear = currentMonth >= 4 ? currentYear : currentYear - 1

    const updateData: JobNumberSettingsUpdate = {}
    if (prefix !== undefined) updateData.prefix = prefix || 'RPS'
    // Keep number_base for backward compatibility, but always use 'sequence' (not used in new format)
    updateData.number_base = 'sequence'
    if (next_number !== undefined) updateData.next_number = next_number
    // Always update year to current financial year start year
    updateData.year = financialYearStartYear

    let result: JobNumberSettings
    const adminClient = createAdminClient()
    
    if (existing) {
      // Update existing settings - use regular client (RLS allows UPDATE)
      const { data, error } = await supabase
        .from('job_number_settings')
        .update(updateData)
        .eq('id', existing.id)
        .select()
        .single() as { data: JobNumberSettings | null; error: unknown }

      if (error) throw error
      if (!data) throw new Error('Failed to update settings')
      result = data
    } else {
      // Calculate financial year start year
      const now = new Date()
      const currentYear = now.getFullYear()
      const currentMonth = now.getMonth() + 1
      const financialYearStartYear = currentMonth >= 4 ? currentYear : currentYear - 1

      // Create new settings - use admin client to bypass RLS for INSERT
      const insertData: JobNumberSettingsInsert = {
        prefix: prefix || 'RPS',
        number_base: 'sequence', // Kept for backward compatibility
        next_number: next_number || 1,
        year: financialYearStartYear,
      }
      const { data, error } = await adminClient
        .from('job_number_settings')
        .insert(insertData)
        .select()
        .single() as { data: JobNumberSettings | null; error: unknown }

      if (error) throw error
      if (!data) throw new Error('Failed to create settings')
      result = data
    }

    return NextResponse.json({ settings: result })
  } catch (error) {
    console.error('Error updating job number settings:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

