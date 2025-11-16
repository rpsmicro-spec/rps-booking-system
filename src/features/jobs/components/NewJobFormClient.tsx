'use client'

import { useRouter } from 'next/navigation'
import { JobForm } from './JobForm'
import { toast } from 'sonner'

export function NewJobFormClient() {
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
      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        toast.error(result.error || 'Failed to create job')
        return
      }

      toast.success('Job created successfully!')
      router.push(`/jobs/${result.job.id}`)
    } catch {
      toast.error('An unexpected error occurred')
    }
  }

  return <JobForm onSubmit={handleSubmit} />
}

