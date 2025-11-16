import { requireAuth } from '@/lib/auth/helpers'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { NewJobFormClient } from '@/features/jobs/components/NewJobFormClient'

export default async function NewJobPage() {
  await requireAuth()

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <h2 className="text-3xl font-bold tracking-tight">Create New Job</h2>
      <Card>
        <CardHeader>
          <CardTitle>Job Information</CardTitle>
        </CardHeader>
        <CardContent>
          <NewJobFormClient />
        </CardContent>
      </Card>
    </div>
  )
}
