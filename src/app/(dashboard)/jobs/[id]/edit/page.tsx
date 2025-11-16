import { requireAuth } from '@/lib/auth/helpers'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EditJobFormClient } from '@/features/jobs/components/EditJobFormClient'

export default async function EditJobPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireAuth()
  const supabase = await createClient()
  const { id } = await params

  const { data: job, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (error || !job) {
    notFound()
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <h2 className="text-3xl font-bold tracking-tight">Edit Job</h2>
      <Card>
        <CardHeader>
          <CardTitle>Job Information</CardTitle>
        </CardHeader>
        <CardContent>
          <EditJobFormClient job={job} />
        </CardContent>
      </Card>
    </div>
  )
}

