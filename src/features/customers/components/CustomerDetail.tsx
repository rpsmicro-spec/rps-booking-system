'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { Briefcase, Eye, MoreHorizontal, Edit, Trash2, User, Mail, Phone, MapPin, BarChart3, CheckCircle2, Package, Truck } from 'lucide-react'
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
import { StatusBadge } from '@/features/jobs/components/StatusBadge'
import type { JobStatus } from '@/types/types'
import { toast } from 'sonner'
import { JOB_STATUS } from '@/lib/constants'

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
  }
  jobs: Job[]
}

export function CustomerDetail({ customer, jobs }: CustomerDetailProps) {
  const router = useRouter()
  const address = formatAddress(customer)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [jobToDelete, setJobToDelete] = useState<Job | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

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

  return (
    <div className="space-y-6">
      {/* Customer Information and Stats - Side by Side on Desktop */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Left Column: Customer Info and Quick Actions (on mobile) */}
        <div className="space-y-4 flex flex-col lg:space-y-0 lg:h-full">
          {/* Customer Information Card */}
          <Card className="lg:h-full">
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">Customer Info</CardTitle>
            </CardHeader>
            <Separator />
            <CardContent className="pt-6">
              <div className="grid gap-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-0.5">
                    <div className="rounded-full bg-muted p-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-muted-foreground mb-1.5">Customer Name</p>
                    <p className="text-base font-semibold">{customer.customer_name}</p>
                  </div>
                </div>
                {customer.email && (
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 mt-0.5">
                      <div className="rounded-full bg-muted p-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-muted-foreground mb-1.5">Email Address</p>
                      <p className="text-sm font-medium break-all">{customer.email}</p>
                    </div>
                  </div>
                )}
                {customer.contact_number && (
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 mt-0.5">
                      <div className="rounded-full bg-muted p-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-muted-foreground mb-1.5">Contact Number</p>
                      <p className="text-sm font-medium">{customer.contact_number}</p>
                    </div>
                  </div>
                )}
                {address && (
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 mt-0.5">
                      <div className="rounded-full bg-muted p-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-muted-foreground mb-1.5">Address</p>
                      <p className="text-sm whitespace-pre-line leading-relaxed">{address}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions - Below Customer Info on mobile, in right column on desktop */}
          {(phoneLink || emailLink) && (
            <Card className="lg:hidden">
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <Separator />
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row gap-2">
                  {phoneLink && (
                    <Button variant="outline" className="flex-1" asChild>
                      <a href={phoneLink}>
                        <Phone className="mr-2 h-4 w-4" />
                        Call Customer
                      </a>
                    </Button>
                  )}
                  {emailLink && (
                    <Button variant="outline" className="flex-1" asChild>
                      <a href={emailLink}>
                        <Mail className="mr-2 h-4 w-4" />
                        Send Email
                      </a>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column: Quick Actions and Stats (on desktop) */}
        <div className="space-y-4 flex flex-col lg:h-full lg:justify-start">
          {/* Action Buttons - Only visible on desktop */}
          {(phoneLink || emailLink) && (
            <Card className="hidden lg:block">
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <Separator />
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row gap-2">
                  {phoneLink && (
                    <Button variant="outline" className="flex-1" asChild>
                      <a href={phoneLink}>
                        <Phone className="mr-2 h-4 w-4" />
                        Call Customer
                      </a>
                    </Button>
                  )}
                  {emailLink && (
                    <Button variant="outline" className="flex-1" asChild>
                      <a href={emailLink}>
                        <Mail className="mr-2 h-4 w-4" />
                        Send Email
                      </a>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-4 flex-1">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-muted p-2">
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Total Jobs</p>
                    <p className="text-2xl font-bold">{totalJobs}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-muted p-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Active Jobs</p>
                    <p className="text-2xl font-bold">{activeJobs}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-muted p-2">
                    <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Completed</p>
                    <p className="text-2xl font-bold">{completedJobs}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-muted p-2">
                    <Truck className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Delivered</p>
                    <p className="text-2xl font-bold">{deliveredJobs}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Jobs Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Jobs ({jobs.length})</CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className="pt-6">
          {jobs.length === 0 ? (
            <div className="p-12">
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
                  <Button asChild>
                    <Link href="/jobs/new">
                      Create New Job
                    </Link>
                  </Button>
                </EmptyContent>
              </Empty>
            </div>
          ) : (
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
                      <TableCell className="font-medium">
                        <Link
                          href={`/jobs/${job.id}`}
                          className="hover:underline"
                        >
                          {job.job_number}
                        </Link>
                      </TableCell>
                      <TableCell>
                        {job.status ? (
                          <StatusBadge status={job.status as JobStatus} />
                        ) : (
                          <Badge variant="default">Unknown</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {job.booking_date
                          ? format(new Date(job.booking_date), 'MMM dd, yyyy')
                          : '-'}
                      </TableCell>
                      <TableCell>
                        {job.delivery_date
                          ? format(new Date(job.delivery_date), 'MMM dd, yyyy')
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
        </CardContent>
      </Card>

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

