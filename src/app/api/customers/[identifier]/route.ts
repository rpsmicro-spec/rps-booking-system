import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/helpers'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ identifier: string }> }
) {
  try {
    const { supabase } = await requireAuth()
    const { identifier } = await params

    // Decode the identifier (URL encoded customer name)
    const customerName = decodeURIComponent(identifier)

    // Get all jobs for this customer
    const { data: jobs, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('customer_name', customerName)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Failed to fetch customer:', error.message)
      return NextResponse.json(
        { error: 'Failed to fetch customer' },
        { status: 400 }
      )
    }

    if (!jobs || jobs.length === 0) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      )
    }

    // Get customer info from first job
    type JobWithAddress = {
      customer_name: string
      email: string | null
      contact_number: string | null
      address_street: string | null
      address_area: string | null
      address_city: string | null
      address_state: string | null
      address_pincode: string | null
    }

    const jobWithAddress = jobs[0] as unknown as JobWithAddress
    const customerInfo = {
      customer_name: jobs[0].customer_name,
      email: jobs[0].email,
      contact_number: jobs[0].contact_number,
      address_street: jobWithAddress.address_street || null,
      address_area: jobWithAddress.address_area || null,
      address_city: jobWithAddress.address_city || null,
      address_state: jobWithAddress.address_state || null,
      address_pincode: jobWithAddress.address_pincode || null,
      total_jobs: jobs.length,
    }

    return NextResponse.json(
      {
        customer: customerInfo,
        jobs: jobs,
      },
      { status: 200 }
    )
  } catch {
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

