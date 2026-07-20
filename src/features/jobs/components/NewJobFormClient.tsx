'use client'

import { useRouter } from 'next/navigation'
import { JobForm } from './JobForm'
import { toast } from 'sonner'
import type { JobFormValues } from './JobForm'

export function NewJobFormClient() {
  const router = useRouter()

  const handleSubmit = async (data: JobFormValues) => {
    try {
      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        // Throw instead of returning normally: JobForm clears the saved
        // draft after onSubmit resolves, and a failed create must keep it.
        throw new Error(result.error || 'Failed to create job')
      }

      toast.success('Job created successfully!')
      router.push(`/jobs/${result.job.id}`)
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('An unexpected error occurred')
    }
  }

  return <JobForm onSubmit={handleSubmit} />
}

