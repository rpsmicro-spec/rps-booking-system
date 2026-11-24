import { requireAuth } from '@/lib/auth/helpers'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { CustomerDetail } from '@/features/customers/components/CustomerDetail'

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ identifier: string }>
}) {
  await requireAuth()
  const { identifier } = await params
  const customerName = decodeURIComponent(identifier)
  const supabase = await createClient()

  // Fetch customer jobs
  const { data: jobs, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('customer_name', customerName)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (error || !jobs || jobs.length === 0) {
    notFound()
  }

  const firstJob = jobs[0] as typeof jobs[0] & { 
    contact_person_name?: string | null
    contact_person_designation?: string | null
    notes?: string | null
  }
  
  const customerInfo = {
    customer_name: firstJob.customer_name,
    email: firstJob.email,
    contact_number: firstJob.contact_number,
    address_street: firstJob.address_street,
    address_area: firstJob.address_area,
    address_city: firstJob.address_city,
    address_state: firstJob.address_state,
    address_pincode: firstJob.address_pincode,
    address: firstJob.address, // Legacy field
    contact_person_name: firstJob.contact_person_name,
    contact_person_designation: firstJob.contact_person_designation,
    notes: firstJob.notes,
  }

  return (
    <div className="flex-1 space-y-4 md:space-y-6">
      <CustomerDetail customer={customerInfo} jobs={jobs} />
    </div>
  )
}

