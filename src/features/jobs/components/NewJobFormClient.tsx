'use client'

import { useRouter } from 'next/navigation'
import { JobForm } from './JobForm'
import { toast } from 'sonner'
import type { JobFormValues } from './JobForm'
import { fetchWithTimeout, readJson } from '@/lib/offline/network'
import { revalidateJobLists } from '@/lib/swr/job-cache'
import type { Job } from '@/types/types'

export function NewJobFormClient() {
  const router = useRouter()

  const handleSubmit = async (data: JobFormValues) => {
    // fetchWithTimeout / readJson throw NetworkError on a failed, timed-out
    // or cut-off request; JobForm catches that and saves the job offline
    // under the same client_ref (already in `data`), so a request that did
    // reach the server is deduplicated when the offline copy syncs.
    const response = await fetchWithTimeout('/api/jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    const result = await readJson<{ job?: Job; error?: string }>(response)

    if (!response.ok || !result?.job) {
      // Throw instead of returning normally: JobForm clears the saved
      // draft after onSubmit resolves, and a failed create must keep it.
      throw new Error(result?.error || 'Failed to create job')
    }

    toast.success('Job created successfully!')
    void revalidateJobLists()
    router.push(`/jobs/${result.job.id}`)
  }

  return <JobForm onSubmit={handleSubmit} />
}
