import { requireAuth } from '@/lib/auth/helpers'
import { CustomersList } from '@/features/customers/components/CustomersList'

export default async function CustomersPage() {
  await requireAuth()

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold tracking-tight">Customers</h2>
        <p className="text-sm text-muted-foreground">
          View and manage all your customers and their job history.
        </p>
      </div>

      <CustomersList />
    </div>
  )
}

