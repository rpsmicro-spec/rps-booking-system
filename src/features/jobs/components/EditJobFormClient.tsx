'use client'

import { useRouter } from 'next/navigation'
import { JobForm } from './JobForm'
import { toast } from 'sonner'
import type { Job } from '@/types/types'

interface EditJobFormClientProps {
  job: Job
}

export function EditJobFormClient({ job }: EditJobFormClientProps) {
  const router = useRouter()

  const handleSubmit = async (data: {
    customer_name: string
    job_number: string
    address?: string
    contact_number?: string
    email?: string
    material_type?: string
    booking_date: string
    delivery_date?: string
    special_requirements?: string
    invoice_url?: string
  }) => {
    try {
      const response = await fetch(`/api/jobs/${job.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        toast.error(result.error || 'Failed to update job')
        return
      }

      toast.success('Job updated successfully!')
      router.push(`/jobs/${job.id}`)
    } catch {
      toast.error('An unexpected error occurred')
    }
  }

  return <JobForm job={job} onSubmit={handleSubmit} />
}

