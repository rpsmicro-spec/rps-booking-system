import { requireAuth } from '@/lib/auth/helpers'
import { CustomersList } from '@/features/customers/components/CustomersList'
import { CustomersPageClient } from '@/features/customers/components/CustomersPageClient'
import { Users } from 'lucide-react'

export default async function CustomersPage() {
  await requireAuth()

  return (
    <CustomersPageClient>
    <div className="flex-1 space-y-6">
      <div className="flex flex-col gap-2 pt-2 md:pt-4">
        <div className="flex items-center gap-3">
          <Users className="h-6 w-6 md:h-7 md:w-7 text-muted-foreground" />
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Customers</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          View and manage all your customers and their job history.
        </p>
      </div>

      <CustomersList />
    </div>
    </CustomersPageClient>
  )
}

