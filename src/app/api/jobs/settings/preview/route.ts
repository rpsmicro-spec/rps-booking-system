import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/helpers'
import { getNextJobNumberPreview } from '@/lib/job-number-generator'

export async function GET() {
  try {
    await requireAuth()
    
    const preview = await getNextJobNumberPreview()
    
    return NextResponse.json({ preview })
  } catch (error) {
    console.error('Error getting job number preview:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

