import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/helpers'
import type { Database } from '@/types/database.types'

type JobNumberSettings = Database['public']['Tables']['job_number_settings']['Row']
type JobNumberSettingsUpdate = Database['public']['Tables']['job_number_settings']['Update']
type JobNumberSettingsInsert = Database['public']['Tables']['job_number_settings']['Insert']

export async function GET() {
  try {
    const { user } = await requireAuth()
    const supabase = await createClient()

    // Check if user has permission (owner or admin)
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!userData || !['owner', 'admin'].includes(userData.role)) {
      return NextResponse.json(
        { error: 'Unauthorized. Only owners and admins can view settings.' },
        { status: 403 }
      )
    }

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
            prefix: '',
            number_base: 'sequence',
            next_number: 1,
            year: new Date().getFullYear(),
          },
        })
      }
      throw error
    }

    return NextResponse.json({ settings: data })
  } catch (error) {
    console.error('Error fetching job number settings:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const { user } = await requireAuth()
    const supabase = await createClient()

    // Check if user has permission (owner or admin)
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!userData || !['owner', 'admin'].includes(userData.role)) {
      return NextResponse.json(
        { error: 'Unauthorized. Only owners and admins can update settings.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { prefix, number_base, next_number } = body

    // Validate input
    if (number_base && !['sequence', 'year'].includes(number_base)) {
      return NextResponse.json(
        { error: 'Invalid number_base. Must be "sequence" or "year".' },
        { status: 400 }
      )
    }

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

    const updateData: JobNumberSettingsUpdate = {}
    if (prefix !== undefined) updateData.prefix = prefix || ''
    if (number_base) updateData.number_base = number_base
    if (next_number !== undefined) updateData.next_number = next_number
    if (number_base === 'year') {
      updateData.year = new Date().getFullYear()
    }

    let result: JobNumberSettings
    if (existing?.data) {
      // Update existing settings
      const { data, error } = await supabase
        .from('job_number_settings')
        .update(updateData)
        .eq('id', existing.data.id)
        .select()
        .single() as { data: JobNumberSettings | null; error: unknown }

      if (error) throw error
      if (!data) throw new Error('Failed to update settings')
      result = data
    } else {
      // Create new settings
      const insertData: JobNumberSettingsInsert = {
        prefix: prefix || '',
        number_base: number_base || 'sequence',
        next_number: next_number || 1,
        year: number_base === 'year' ? new Date().getFullYear() : null,
      }
      const { data, error } = await supabase
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

