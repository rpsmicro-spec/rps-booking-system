import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/helpers'

export async function GET(request: Request) {
  try {
    const { supabase } = await requireAuth()

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const limitRaw = parseInt(searchParams.get('limit') || '50', 10)
    const offsetRaw = parseInt(searchParams.get('offset') || '0', 10)
    const limit = Number.isNaN(limitRaw) ? 50 : Math.max(1, Math.min(limitRaw, 100))
    const offset = Number.isNaN(offsetRaw) ? 0 : Math.max(0, offsetRaw)

    // Get all unique customers by grouping jobs
    let query = supabase
      .from('jobs')
      .select('customer_name, email, contact_number, address_street, address_area, address_city, address_state, address_pincode, contact_person_name, contact_person_designation, created_at')
      .is('deleted_at', null)
      .order('customer_name', { ascending: true })

    // Apply search filter
    if (search) {
      const sanitized = search.replace(/[%_,.()"'\\]/g, '')
      if (sanitized) {
        query = query.or(
          `customer_name.ilike.%${sanitized}%,email.ilike.%${sanitized}%,contact_number.ilike.%${sanitized}%`
        )
      }
    }

    const { data: jobs, error } = await query

    if (error) {
      console.error('Customers query error:', error.message)
      return NextResponse.json(
        { error: 'Failed to fetch customers' },
        { status: 400 }
      )
    }

    // Group by customer (using customer_name + email + contact_number as unique key)
    const customerMap = new Map<string, {
      customer_name: string
      email: string | null
      contact_number: string | null
      address_street: string | null
      address_area: string | null
      address_city: string | null
      address_state: string | null
      address_pincode: string | null
      contact_person_name: string | null
      contact_person_designation: string | null
      job_count: number
      last_job_date: string | null
      created_at: string | null
    }>()

    type JobWithAddress = {
      customer_name: string
      email: string | null
      contact_number: string | null
      address_street: string | null
      address_area: string | null
      address_city: string | null
      address_state: string | null
      address_pincode: string | null
      contact_person_name: string | null
      contact_person_designation: string | null
      created_at: string | null
    }

    jobs?.forEach((job) => {
      // Create unique key from customer_name, email, and contact_number
      const key = `${job.customer_name.toLowerCase()}_${job.email?.toLowerCase() || ''}_${job.contact_number || ''}`
      const jobWithAddress = job as unknown as JobWithAddress
      
      if (!customerMap.has(key)) {
        customerMap.set(key, {
          customer_name: job.customer_name,
          email: job.email,
          contact_number: job.contact_number,
          address_street: jobWithAddress.address_street || null,
          address_area: jobWithAddress.address_area || null,
          address_city: jobWithAddress.address_city || null,
          address_state: jobWithAddress.address_state || null,
          address_pincode: jobWithAddress.address_pincode || null,
          contact_person_name: jobWithAddress.contact_person_name || null,
          contact_person_designation: jobWithAddress.contact_person_designation || null,
          job_count: 0,
          last_job_date: null,
          created_at: job.created_at || null,
        })
      }

      const customer = customerMap.get(key)!
      customer.job_count += 1
      
      // Track the earliest created_at date for each customer
      if (job.created_at) {
        const jobDate = new Date(job.created_at)
        if (!customer.created_at || jobDate < new Date(customer.created_at)) {
          customer.created_at = job.created_at
        }
      }
    })

    // Convert map to array and sort
    const allCustomers = Array.from(customerMap.values()).sort((a, b) => 
      a.customer_name.localeCompare(b.customer_name)
    )

    // Apply pagination
    const total = allCustomers.length
    const customers = allCustomers.slice(offset, offset + limit)

    return NextResponse.json(
      {
        customers,
        total,
        limit,
        offset,
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
