import { requireAuth } from '@/lib/auth/helpers'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Pencil } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
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
    <div className="flex-1 space-y-4 md:space-y-6">
      <PageHeader
        icon={Pencil}
        title="Edit Job"
        description="Update the details of this repair job."
      />
      <EditJobFormClient job={job} />
    </div>
  )
}
