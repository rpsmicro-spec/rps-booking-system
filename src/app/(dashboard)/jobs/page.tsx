import { requireAuth } from '@/lib/auth/helpers'
import { JobList } from '@/features/jobs/components/JobList'
import { JobsPageClient } from '@/features/jobs/components/JobsPageClient'

export default async function JobsPage() {
  await requireAuth()

  return <JobsPageClient />
}

