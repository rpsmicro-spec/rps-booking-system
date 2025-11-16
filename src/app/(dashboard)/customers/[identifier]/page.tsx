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

  const customerInfo = {
    customer_name: jobs[0].customer_name,
    email: jobs[0].email,
    contact_number: jobs[0].contact_number,
    address_street: jobs[0].address_street,
    address_area: jobs[0].address_area,
    address_city: jobs[0].address_city,
    address_state: jobs[0].address_state,
    address_pincode: jobs[0].address_pincode,
    address: jobs[0].address, // Legacy field
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <CustomerDetail customer={customerInfo} jobs={jobs} />
    </div>
  )
}

