import { requireAuth } from '@/lib/auth/helpers'
import { CustomersList } from '@/features/customers/components/CustomersList'
import { CustomersPageClient } from '@/features/customers/components/CustomersPageClient'
import { Users } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'

export default async function CustomersPage() {
  await requireAuth()

  return (
    <CustomersPageClient>
    <div className="flex-1 space-y-4 md:space-y-6">
      <PageHeader
        icon={Users}
        title="Customers"
        description="View and manage all your customers and their job history."
      />

      <CustomersList />
    </div>
    </CustomersPageClient>
  )
}

