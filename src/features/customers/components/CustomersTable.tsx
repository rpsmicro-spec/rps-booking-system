'use client'

import { useEffect, useState } from 'react'
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
import { TableSkeleton } from '@/components/ui/skeletons'
import { format } from 'date-fns'
import { useIsMobile } from '@/hooks/use-mobile'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

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

export function CustomersTable({ search, limit = 50, offset = 0, onTotalChange }: CustomersTableProps) {
  const router = useRouter()
  const isMobile = useIsMobile()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const handleRowClick = (customerName: string) => {
    const customerKey = encodeURIComponent(customerName)
    router.push(`/customers/${customerKey}`)
  }

  useEffect(() => {
    fetchCustomers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, limit, offset])

  const fetchCustomers = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      params.append('limit', limit.toString())
      params.append('offset', offset.toString())

      const response = await fetch(`/api/customers?${params.toString()}`)
      const result = await response.json()

      if (!response.ok) {
        console.error('Failed to fetch customers:', result.error)
        return
      }

      setCustomers(result.customers || [])
      onTotalChange?.(result.total || 0)
    } catch (error) {
      console.error('Error fetching customers:', error)
    } finally {
      setIsLoading(false)
    }
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

  if (isLoading) {
    return isMobile ? (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-muted rounded w-1/3"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-3 bg-muted rounded w-2/3"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    ) : (
      <TableSkeleton rows={5} columns={5} />
    )
  }

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
        {customers.length === 0 ? (
          emptyState
        ) : (
          customers.map((customer, index) => {
            const customerKey = encodeURIComponent(customer.customer_name)
            return (
              <Card
                key={`${customer.customer_name}-${index}`}
                className="cursor-pointer transition-all active:scale-[0.98] active:opacity-90 active:shadow-md"
                onClick={() => handleRowClick(customer.customer_name)}
              >
                <CardHeader className="pb-3 space-y-2">
                  {/* Header: Customer Name + Job Count */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-base text-foreground truncate">
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
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/50 shrink-0 ml-2">
                      <Briefcase className="h-3 w-3 text-muted-foreground shrink-0" />
                      <span className="font-medium text-xs">{customer.job_count}</span>
                      <span className="text-muted-foreground text-xs">
                        {customer.job_count === 1 ? 'job' : 'jobs'}
                      </span>
                    </div>
                  </div>

                  {/* Quick Info Row */}
                  <div className="space-y-1.5 pt-1">
                    {formatAddress(customer) !== '-' && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3 shrink-0" />
                        <span className="wrap-break-word">{formatAddress(customer)}</span>
                      </div>
                    )}
                    {customer.created_at && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3 shrink-0" />
                        <span>Created {format(new Date(customer.created_at), 'MMM dd, yyyy')}</span>
                      </div>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-3 pt-0">
                  {/* Contact Info */}
                  {(customer.contact_number || customer.email) && (
                    <div className="flex items-center gap-3 flex-wrap pt-3 border-t">
                      {customer.contact_number && (
                        <a
                          href={`tel:${customer.contact_number}`}
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1.5 text-xs text-primary hover:underline"
                        >
                          <Phone className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{customer.contact_number}</span>
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

                  {/* Actions */}
                  <div
                    className="flex items-center gap-2 pt-2 border-t"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-xs h-8"
                      asChild
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Link href={`/customers/${customerKey}`}>
                        <Eye className="mr-1.5 h-3.5 w-3.5" />
                        View Jobs
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    )
  }

  // Desktop Table View
  return (
    <div className="rounded-md border">
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
                        <div className="text-xs text-muted-foreground mt-0.5">
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
                          <span>{customer.contact_number}</span>
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
                      <span className="font-medium">{customer.job_count}</span>
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
  )
}

