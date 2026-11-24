'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Briefcase, Eye, MoreHorizontal, Edit, Trash2, User, Mail, Phone, MapPin, BarChart3, CheckCircle2, Package, Truck, UserCircle } from 'lucide-react'
import { useIsMobile } from '@/hooks/use-mobile'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import Link from 'next/link'
import type { Job } from '@/types/types'
import { formatAddress } from '@/lib/utils/address'
import { format } from 'date-fns'
import { utcToIstDateObject } from "@/lib/utils/date-ist";
import { JobCardMobile } from '@/features/jobs/components/JobCardMobile'
import type { JobStatus } from '@/types/types'
import { toast } from 'sonner'
import { formatPhoneDisplay } from '@/lib/utils/format-phone'
import { JOB_STATUS, STATUS_LABELS, getStatusBadgeCustomClasses } from '@/lib/constants'

interface CustomerDetailProps {
  customer: {
    customer_name: string
    email: string | null
    contact_number: string | null
    address_street?: string | null
    address_area?: string | null
    address_city?: string | null
    address_state?: string | null
    address_pincode?: string | null
    contact_person_name?: string | null
    contact_person_designation?: string | null
    notes?: string | null
  }
  jobs: Job[]
}

export function CustomerDetail({ customer, jobs }: CustomerDetailProps) {
  const router = useRouter()
  const isMobile = useIsMobile()
  const address = formatAddress(customer)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [jobToDelete, setJobToDelete] = useState<Job | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  
  // Get contact person info from first job (since customer data comes from jobs)
  const firstJob = jobs[0] as Job & { contact_person_name?: string; contact_person_designation?: string; notes?: string }
  const contactPersonName = customer.contact_person_name || firstJob?.contact_person_name
  const contactPersonDesignation = customer.contact_person_designation || firstJob?.contact_person_designation
  const customerNotes = customer.notes || firstJob?.notes

  // Calculate stats
  const totalJobs = jobs.length
  const activeJobs = jobs.filter(
    (job) => job.status === JOB_STATUS.COLLECTED || job.status === JOB_STATUS.IN_PROGRESS
  ).length
  const completedJobs = jobs.filter((job) => job.status === JOB_STATUS.COMPLETED).length
  const deliveredJobs = jobs.filter((job) => job.status === JOB_STATUS.DELIVERED).length

  // Phone and email links
  const phoneLink = customer.contact_number ? `tel:${customer.contact_number.replace(/[^\d+]/g, '')}` : null
  const emailLink = customer.email ? `mailto:${customer.email}` : null

  const handleDeleteClick = (e: React.MouseEvent, job: Job) => {
    e.stopPropagation()
    setJobToDelete(job)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!jobToDelete) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/jobs/${jobToDelete.id}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (!response.ok) {
        toast.error(result.error || 'Failed to delete job')
        return
      }

      toast.success('Job deleted successfully')
      setDeleteDialogOpen(false)
      setJobToDelete(null)
      router.refresh()
    } catch {
      toast.error('An unexpected error occurred')
    } finally {
      setIsDeleting(false)
    }
  }

  const hasContactInfo = contactPersonName || customer.email || customer.contact_number || address
  const hasNotes = customerNotes != null && customerNotes !== ''

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header: name + quick actions (no card) */}
      <header className="flex flex-col gap-3 sm:gap-4 pt-1 md:pt-2">
        <div className="flex flex-col gap-2 min-w-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="rounded-full bg-muted/80 p-2 sm:p-2.5 shrink-0">
              <User className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight truncate">
                {customer.customer_name}
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5 sm:text-sm">
                Customer details and job history
              </p>
            </div>
          </div>
        </div>
        {(phoneLink || emailLink) && (
          <div className="flex flex-wrap items-center gap-2">
            {phoneLink && (
              <Button variant="outline" size="sm" className="h-9 text-xs sm:text-sm shrink-0" asChild>
                <a href={phoneLink}>
                  <Phone className="mr-1.5 h-3.5 w-3.5 sm:mr-2 sm:h-4 sm:w-4" />
                  Call
                </a>
              </Button>
            )}
            {emailLink && (
              <Button variant="outline" size="sm" className="h-9 text-xs sm:text-sm shrink-0" asChild>
                <a href={emailLink}>
                  <Mail className="mr-1.5 h-3.5 w-3.5 sm:mr-2 sm:h-4 sm:w-4" />
                  Email
                </a>
              </Button>
            )}
          </div>
        )}
      </header>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <Card className="overflow-hidden">
          <CardContent className="flex items-center gap-3 p-3 sm:p-4">
            <div className="rounded-full bg-muted/60 p-1.5">
              <BarChart3 className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-lg font-bold tabular-nums leading-tight">{totalJobs}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="overflow-hidden">
          <CardContent className="flex items-center gap-3 p-3 sm:p-4">
            <div className="rounded-full bg-muted/60 p-1.5">
              <Package className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Active</p>
              <p className="text-lg font-bold tabular-nums leading-tight">{activeJobs}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="overflow-hidden">
          <CardContent className="flex items-center gap-3 p-3 sm:p-4">
            <div className="rounded-full bg-muted/60 p-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Completed</p>
              <p className="text-lg font-bold tabular-nums leading-tight">{completedJobs}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="overflow-hidden">
          <CardContent className="flex items-center gap-3 p-3 sm:p-4">
            <div className="rounded-full bg-muted/60 p-1.5">
              <Truck className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Delivered</p>
              <p className="text-lg font-bold tabular-nums leading-tight">{deliveredJobs}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Customer details */}
      {(hasContactInfo || hasNotes) && (
        <Card className="overflow-hidden">
          <CardContent className="p-4 sm:p-5 md:p-6">
            <div className="flex flex-col gap-4 sm:gap-5 md:flex-row md:gap-8">
              {hasContactInfo && (
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Contact & address</p>
                  <dl className="grid gap-3 sm:grid-cols-2">
                    {contactPersonName && (
                      <div className="flex gap-3 min-w-0">
                        <UserCircle className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <dt className="text-xs text-muted-foreground">Contact</dt>
                          <dd className="text-sm font-medium wrap-break-word">
                            {contactPersonName}
                            {contactPersonDesignation && (
                              <span className="font-normal text-muted-foreground"> · {contactPersonDesignation}</span>
                            )}
                          </dd>
                        </div>
                      </div>
                    )}
                    {customer.contact_number && (
                      <div className="flex gap-3 min-w-0">
                        <Phone className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <dt className="text-xs text-muted-foreground">Phone</dt>
                          <dd className="text-sm font-medium tabular-nums wrap-break-word">{formatPhoneDisplay(customer.contact_number)}</dd>
                        </div>
                      </div>
                    )}
                    {customer.email && (
                      <div className="flex gap-3 min-w-0">
                        <Mail className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                        <div className="min-w-0 break-all">
                          <dt className="text-xs text-muted-foreground">Email</dt>
                          <dd className="text-sm font-medium">{customer.email}</dd>
                        </div>
                      </div>
                    )}
                    {address && (
                      <div className="flex gap-3 min-w-0">
                        <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <dt className="text-xs text-muted-foreground">Address</dt>
                          <dd className="text-sm whitespace-pre-line leading-relaxed wrap-break-word text-foreground/90">{address}</dd>
                        </div>
                      </div>
                    )}
                  </dl>
                </div>
              )}
              {hasNotes && (
                <>
                  {hasContactInfo && <Separator orientation="vertical" className="hidden md:block" />}
                  {hasContactInfo && <Separator className="md:hidden" />}
                  <div className="md:w-1/3 min-w-0">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">Notes</p>
                    <p className="text-xs sm:text-sm whitespace-pre-wrap leading-relaxed wrap-break-word text-foreground/90">{customerNotes}</p>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Jobs */}
      <div className="space-y-4">
        <h3 className="text-lg md:text-xl font-semibold tracking-tight">
          All Jobs <span className="tabular-nums">({jobs.length})</span>
        </h3>
        {jobs.length === 0 ? (
            <div className="p-8 sm:p-12">
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <Briefcase className="h-6 w-6" />
                  </EmptyMedia>
                  <EmptyTitle>No Jobs Found</EmptyTitle>
                  <EmptyDescription>
                    This customer doesn&apos;t have any jobs yet. Create a new job to get started.
                  </EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                  <Button size="sm" asChild>
                    <Link href="/jobs/new">
                      Create New Job
                    </Link>
                  </Button>
                </EmptyContent>
              </Empty>
            </div>
          ) : isMobile ? (
            // Mobile Card View
            <div className="space-y-3">
              {jobs.map((job) => (
                <JobCardMobile
                  key={job.id}
                  job={job}
                  onCardClick={(jobId) => router.push(`/jobs/${jobId}`)}
                  showActions={true}
                  onEdit={(jobId) => router.push(`/jobs/${jobId}/edit`)}
                  onDelete={(job) => {
                    const e = { stopPropagation: () => {} } as React.MouseEvent
                    handleDeleteClick(e, job)
                  }}
                />
              ))}
            </div>
          ) : (
            // Desktop Table View
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Job Number</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Booking Date</TableHead>
                    <TableHead>Delivery Date</TableHead>
                    <TableHead>Material Type</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobs.map((job) => (
                    <TableRow key={job.id}>
                      <TableCell className="font-medium tabular-nums">
                        <Link
                          href={`/jobs/${job.id}`}
                          className="hover:underline"
                        >
                          {job.job_number}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusBadgeCustomClasses(job.status as JobStatus)}>
                          {job.status ? (STATUS_LABELS[job.status as JobStatus] || 'Unknown') : 'Unknown'}
                        </Badge>
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {job.booking_date
                          ? (() => {
                              const istDate = utcToIstDateObject(job.booking_date);
                              return istDate ? format(istDate, 'MMM dd, yyyy') : '-';
                            })()
                          : '-'}
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {job.delivery_date
                          ? (() => {
                              const istDate = utcToIstDateObject(job.delivery_date);
                              return istDate ? format(istDate, 'MMM dd, yyyy') : '-';
                            })()
                          : '-'}
                      </TableCell>
                      <TableCell>
                        {job.material_type || '-'}
                      </TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/jobs/${job.id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/jobs/${job.id}/edit`}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={(e) => handleDeleteClick(e, job)}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Job</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete job <strong>{jobToDelete?.job_number}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

