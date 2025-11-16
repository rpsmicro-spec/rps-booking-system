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
    contact_person_name?: string
    contact_person_designation?: string
    address_street?: string
    address_area?: string
    address_city?: string
    address_state?: string
    address_pincode?: string
    address?: string
    contact_number?: string
    email?: string
    material_type?: string
    booking_date: string
    delivery_date?: string
    special_requirements?: string
    notes?: string
    before_photos?: (string | File)[]
    after_photos?: (string | File)[]
    invoice_file_path?: string | File | null
  }) => {
    try {
      // Prepare the update data - exclude job_number as it cannot be changed
      // Photos are already uploaded and converted to URLs by JobForm, so include them
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { job_number: _job_number, ...updateData } = data

      const response = await fetch(`/api/jobs/${job.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      })

      const result = await response.json()

      if (!response.ok) {
        toast.error(result.error || 'Failed to update job')
        return
      }

      toast.success('Job updated successfully!')
      router.push(`/jobs/${job.id}`)
      router.refresh()
    } catch (error) {
      console.error('Error updating job:', error)
      toast.error('An unexpected error occurred')
    }
  }

  return <JobForm job={job} onSubmit={handleSubmit} />
}

