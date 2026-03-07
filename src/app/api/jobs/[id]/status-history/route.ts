import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/helpers'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { supabase } = await requireAuth()
    const { id } = await params

    // Fetch status history for the job
    const { data: statusHistory, error } = await supabase
      .from('job_status_history')
      .select('*')
      .eq('job_id', id)
      .order('changed_at', { ascending: true })

    if (error) {
      console.error('Failed to fetch status history:', error.message)
      return NextResponse.json(
        { error: 'Failed to fetch status history' },
        { status: 400 }
      )
    }

    return NextResponse.json({ statusHistory: statusHistory || [] }, { status: 200 })
  } catch {
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

