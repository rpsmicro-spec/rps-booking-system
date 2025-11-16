import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/helpers'
import { headers } from 'next/headers'
import type { JobUpdate } from '@/types/types'

/**
 * Update customer data across all their jobs
 * This endpoint updates all jobs for a customer with the new customer information
 */
export async function PATCH(request: Request) {
  try {
    const { user } = await requireAuth()
    const supabase = await createClient()
    const adminClient = createAdminClient()

    const body = await request.json()
    const {
      old_customer_name,
      old_email,
      old_contact_number,
      customer_name,
      email,
      contact_number,
      address_street,
      address_area,
      address_city,
      address_state,
      address_pincode,
    } = body

    if (!old_customer_name || !customer_name) {
      return NextResponse.json(
        { error: 'Customer name is required' },
        { status: 400 }
      )
    }

    // Build the update object with only provided fields
    const updateData: JobUpdate = {
      updated_at: new Date().toISOString(),
    }

    if (email !== undefined) updateData.email = email
    if (contact_number !== undefined) updateData.contact_number = contact_number
    if (address_street !== undefined) updateData.address_street = address_street
    if (address_area !== undefined) updateData.address_area = address_area
    if (address_city !== undefined) updateData.address_city = address_city
    if (address_state !== undefined) updateData.address_state = address_state
    if (address_pincode !== undefined) updateData.address_pincode = address_pincode
    if (customer_name !== old_customer_name) updateData.customer_name = customer_name

    // Find all jobs for this customer
    // Match by customer_name, email, and contact_number to identify the customer
    // We need to match jobs where customer_name matches AND
    // (email matches OR both are null) AND (contact_number matches OR both are null)
    const { data: jobs, error: findError } = await supabase
      .from('jobs')
      .select('id, job_number, email, contact_number')
      .eq('customer_name', old_customer_name)
      .is('deleted_at', null)

    if (findError) {
      return NextResponse.json(
        { error: findError.message },
        { status: 400 }
      )
    }

    // Filter jobs to match the exact customer (same email and contact_number)
    const matchingJobs = jobs?.filter(job => {
      const emailMatch = old_email 
        ? job.email === old_email 
        : !job.email
      const contactMatch = old_contact_number
        ? job.contact_number === old_contact_number
        : !job.contact_number
      return emailMatch && contactMatch
    }) || []

    if (!matchingJobs || matchingJobs.length === 0) {
      return NextResponse.json(
        { error: 'No jobs found for this customer' },
        { status: 404 }
      )
    }

    // Update all jobs for this customer
    const { error: updateError } = await supabase
      .from('jobs')
      .update(updateData)
      .in('id', matchingJobs.map(j => j.id))

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 400 }
      )
    }

    // Log audit event
    const headersList = await headers()
    await adminClient.from('audit_log').insert({
      user_id: user.id,
      action: 'customer.updated',
      resource_type: 'customer',
      resource_id: null,
      details: {
        old_customer_name,
        new_customer_name: customer_name,
        updated_jobs: matchingJobs.length,
        changes: updateData,
      },
      ip_address: headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || null,
      user_agent: headersList.get('user-agent') || null,
    })

    return NextResponse.json(
      { 
        message: 'Customer data updated successfully',
        updated_jobs: matchingJobs.length 
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error updating customer:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

