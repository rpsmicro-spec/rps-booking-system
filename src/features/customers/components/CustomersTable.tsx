'use client'

import { useEffect, useState } from 'react'
import useSWR from 'swr'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Mail, Phone, MapPin, Briefcase, Users, Eye, Calendar } from 'lucide-react'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { ClientOnly } from '@/components/client-only'
import { CachedDataNote } from '@/components/offline/CachedDataNote'
import { useOnlineStatus } from '@/hooks/use-online-status'
import { CustomersListSkeleton } from './CustomersListSkeleton'
import { format } from 'date-fns'
import { formatPhoneDisplay } from '@/lib/utils/format-phone'
import { useIsMobile } from '@/hooks/use-mobile'
import { ChevronRight, Loader2 } from 'lucide-react'

interface Customer {
  customer_name: string
  email: string | null
  contact_number: string | null
  address_street: string | null
  address_area: string | null
  address_city: string | null
  address_state: string | null
  address_pincode: string | null
  contact_person_name: string | null
  contact_person_designation: string | null
  job_count: number
  last_job_date: string | null
  created_at: string | null
}

interface CustomersTableProps {
  search?: string
  limit?: number
  offset?: number
  onTotalChange?: (total: number) => void
}

interface CustomersResponse {
  customers: Customer[]
  total: number
}

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), value ? delayMs : 0)
    return () => clearTimeout(id)
  }, [value, delayMs])
  return debounced
}

/** Client-only so the persisted cache paints immediately (see JobsTable). */
export function CustomersTable(props: CustomersTableProps) {
  return (
    <ClientOnly fallback={<CustomersListSkeleton rows={props.limit ?? 10} />}>
      <CustomersTableInner {...props} />
    </ClientOnly>
  )
}

function CustomersTableInner({ search, limit = 50, offset = 0, onTotalChange }: CustomersTableProps) {
  const router = useRouter()
  const isMobile = useIsMobile()
  const isOnline = useOnlineStatus()

  const debouncedSearch = useDebouncedValue(search ?? '', 300)
  const params = new URLSearchParams()
  if (debouncedSearch) params.append('search', debouncedSearch)
  params.append('limit', limit.toString())
  params.append('offset', offset.toString())
  const swrKey = `/api/customers?${params.toString()}`
  const { data, error, isLoading, mutate } = useSWR<CustomersResponse>(swrKey)
  const customers = data?.customers ?? []
  const showingPrevious = isLoading && !!data

  useEffect(() => {
    if (data && !showingPrevious) onTotalChange?.(data.total || 0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, showingPrevious])

  const handleRowClick = (customerName: string) => {
    const customerKey = encodeURIComponent(customerName)
    router.push(`/customers/${customerKey}`)
  }

  const formatAddress = (customer: Customer): string => {
    const parts = [
      customer.address_street,
      customer.address_area,
      customer.address_city,
      customer.address_state,
      customer.address_pincode,
    ].filter(Boolean)
    return parts.length > 0 ? parts.join(', ') : '-'
  }

  if (!data) {
    if (error) {
      return (
        <div className="p-8 sm:p-12 text-center">
          <p className="text-sm text-destructive">
            {!isOnline
              ? "You're offline and this list hasn't been loaded on this phone yet."
              : 'Failed to load customers. Please check your connection.'}
          </p>
          <Button variant="outline" size="sm" className="mt-4" onClick={() => void mutate()}>
            Try Again
          </Button>
        </div>
      )
    }
    return <CustomersListSkeleton rows={limit} />
  }

  const statusLine = (
    <div className="flex min-h-4 items-center gap-2 empty:hidden">
      <CachedDataNote swrKey={swrKey} error={error} hasData={!!data} />
      {showingPrevious && (
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground" role="status">
          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
          Loading…
        </span>
      )}
    </div>
  )

  const emptyState = (
    <div className="p-8 sm:p-12">
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Users className="h-6 w-6" />
          </EmptyMedia>
          <EmptyTitle>
            {search ? 'No Customers Found' : 'No Customers Yet'}
          </EmptyTitle>
          <EmptyDescription>
            {search
              ? 'No customers match your search criteria. Try adjusting your search terms.'
              : 'Get started by creating your first job. Customers will be automatically added when you create jobs.'}
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    </div>
  )

  // Mobile Card View
  if (isMobile) {
    return (
      <div className="space-y-3">
        {statusLine}
        <div className={`space-y-3 transition-opacity ${showingPrevious ? 'opacity-60' : ''}`}>
        {customers.length === 0 ? (
          emptyState
        ) : (
          customers.map((customer, index) => {
            const customerKey = encodeURIComponent(customer.customer_name)
            return (
              <article
                key={`${customer.customer_name}-${index}`}
                role="button"
                tabIndex={0}
                onClick={() => handleRowClick(customer.customer_name)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    handleRowClick(customer.customer_name)
                  }
                }}
                className="rounded-xl border border-border/80 bg-card overflow-hidden cursor-pointer transition-colors hover:bg-muted/30 active:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <div className="p-4 space-y-3">
                  {/* Header: Name + Job count chip + Chevron */}
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-base text-foreground truncate">
                        {customer.customer_name}
                      </h3>
                      {customer.contact_person_name && (
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {customer.contact_person_name}
                          {customer.contact_person_designation && (
                            <span className="ml-1 text-muted-foreground/70">
                              • {customer.contact_person_designation}
                            </span>
                          )}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/60 text-xs font-medium tabular-nums">
                        <Briefcase className="h-3 w-3 text-muted-foreground" />
                        {customer.job_count} {customer.job_count === 1 ? 'job' : 'jobs'}
                      </span>
                      <ChevronRight className="h-5 w-5 text-muted-foreground/60" aria-hidden />
                    </div>
                  </div>

                  {/* Quick Info */}
                  <div className="space-y-1.5">
                    {formatAddress(customer) !== '-' && (
                      <div className="flex items-start gap-2 text-xs text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5 text-muted-foreground/70" />
                        <span className="wrap-break-word">{formatAddress(customer)}</span>
                      </div>
                    )}
                    {customer.created_at && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70" />
                        <span className="tabular-nums">Created {format(new Date(customer.created_at), 'MMM dd, yyyy')}</span>
                      </div>
                    )}
                  </div>

                  {/* Contact + Action */}
                  <div className="space-y-3 pt-2 border-t border-border/60">
                    {(customer.contact_number || customer.email) && (
                      <div className="flex items-center gap-4 flex-wrap">
                        {customer.contact_number && (
                          <a
                            href={`tel:${customer.contact_number}`}
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-1.5 text-xs text-primary hover:underline"
                          >
                            <Phone className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate tabular-nums">{formatPhoneDisplay(customer.contact_number)}</span>
                          </a>
                        )}
                        {customer.email && (
                          <a
                            href={`mailto:${customer.email}`}
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-1.5 text-xs text-primary hover:underline"
                          >
                            <Mail className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">{customer.email}</span>
                          </a>
                        )}
                      </div>
                    )}
                    <div onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-xs h-8"
                        asChild
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Link href={`/customers/${customerKey}`}>
                          <Eye className="mr-1.5 h-3.5 w-3.5" />
                          View Jobs
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </article>
            )
          })
        )}
        </div>
      </div>
    )
  }

  // Desktop Table View
  return (
    <div className="space-y-2">
    {statusLine}
    <div className={`rounded-md border transition-opacity ${showingPrevious ? 'opacity-60' : ''}`}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Customer Name</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Address</TableHead>
            <TableHead>Jobs</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {customers.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="p-0">
                {emptyState}
              </TableCell>
            </TableRow>
          ) : (
            customers.map((customer, index) => {
              const customerKey = encodeURIComponent(customer.customer_name)
              return (
                <TableRow
                  key={`${customer.customer_name}-${index}`}
                  className="cursor-pointer"
                  onClick={() => handleRowClick(customer.customer_name)}
                >
                  <TableCell>
                    <div>
                      <div className="font-medium">{customer.customer_name}</div>
                      {customer.created_at && (
                        <div className="text-xs text-muted-foreground tabular-nums mt-0.5">
                          Created {format(new Date(customer.created_at), 'MMM dd, yyyy')}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1 text-sm">
                      {customer.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-3 w-3 text-muted-foreground" />
                          <span className="truncate max-w-[200px]">{customer.email}</span>
                        </div>
                      )}
                      {customer.contact_number && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          <span className="tabular-nums">{formatPhoneDisplay(customer.contact_number)}</span>
                        </div>
                      )}
                      {!customer.email && !customer.contact_number && <span className="text-muted-foreground">-</span>}
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-normal">
                    <div className="flex items-start gap-2 text-sm max-w-[300px]">
                      <MapPin className="h-3 w-3 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <span className="break-words">{formatAddress(customer)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium tabular-nums">{customer.job_count}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/customers/${customerKey}`}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Jobs
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              )
            })
          )}
        </TableBody>
      </Table>
    </div>
    </div>
  )
}
