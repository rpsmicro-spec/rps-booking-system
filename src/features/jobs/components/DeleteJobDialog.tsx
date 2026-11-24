'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useOnlineStatus } from '@/hooks/use-online-status'
import { removeJobFromCaches } from '@/lib/swr/job-cache'

interface DeleteJobDialogProps {
  jobId: string
  jobNumber: string
  triggerClassName?: string
}

export function DeleteJobDialog({ jobId, jobNumber, triggerClassName }: DeleteJobDialogProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  // Deletes are online-only (never queued): too risky to replay later.
  const isOnline = useOnlineStatus()

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/jobs/${jobId}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (!response.ok) {
        toast.error(result.error || 'Failed to delete job')
        return
      }

      toast.success('Job deleted successfully')
      await removeJobFromCaches(jobId)
      router.push('/jobs')
      router.refresh()
    } catch {
      toast.error('An unexpected error occurred')
    } finally {
      setIsDeleting(false)
      setIsOpen(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="destructive"
          size="sm"
          className={cn(triggerClassName)}
          disabled={!isOnline}
          title={isOnline ? undefined : "You're offline — deleting needs a connection"}
        >
          {isOnline ? 'Delete Job' : "Delete (offline)"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Job</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete job <strong>{jobNumber}</strong>? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting || !isOnline}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

