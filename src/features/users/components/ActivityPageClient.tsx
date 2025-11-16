'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Activity, FileText } from 'lucide-react'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { TableSkeleton, SearchAndFiltersSkeleton } from '@/components/ui/skeletons'
import { Skeleton } from '@/components/ui/skeleton'
import { ActivityFilters } from './ActivityFilters'

interface AuditLog {
  id: string
  user_id: string | null
  action: string
  resource_type: string | null
  resource_id: string | null
  details: Record<string, unknown>
  created_at: string
  user: {
    id: string
    email: string
    name: string | null
  } | null
}

export function ActivityPageClient() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [dateFrom, setDateFrom] = useState<string | null>(null)
  const [dateTo, setDateTo] = useState<string | null>(null)

  useEffect(() => {
    fetchAuditLogs()
  }, [])

  useEffect(() => {
    let filtered = logs

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase()
      filtered = filtered.filter(
        (log) =>
          log.user?.email?.toLowerCase().includes(searchLower) ||
          log.user?.name?.toLowerCase().includes(searchLower) ||
          log.action.toLowerCase().includes(searchLower) ||
          log.resource_type?.toLowerCase().includes(searchLower) ||
          JSON.stringify(log.details).toLowerCase().includes(searchLower)
      )
    }

    // Apply date filters
    if (dateFrom) {
      const fromDate = new Date(dateFrom)
      fromDate.setHours(0, 0, 0, 0)
      filtered = filtered.filter((log) => new Date(log.created_at) >= fromDate)
    }

    if (dateTo) {
      const toDate = new Date(dateTo)
      toDate.setHours(23, 59, 59, 999)
      filtered = filtered.filter((log) => new Date(log.created_at) <= toDate)
    }

    setFilteredLogs(filtered)
  }, [logs, search, dateFrom, dateTo])

  const fetchAuditLogs = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/audit-log')
      const result = await response.json()

      if (!response.ok) {
        console.error(result.error || 'Failed to fetch audit logs')
        return
      }

      setLogs(result.logs || [])
    } catch (error) {
      console.error('An unexpected error occurred', error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatAction = (action: string) => {
    return action
      .split('.')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  const getActionColor = (action: string) => {
    if (action.includes('created')) return 'default'
    if (action.includes('updated')) return 'secondary'
    if (action.includes('deleted')) return 'destructive'
    if (action.includes('invite')) return 'outline'
    return 'outline'
  }

  const handleClear = () => {
    setSearch('')
    setDateFrom(null)
    setDateTo(null)
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold tracking-tight">Activity Log</h2>
        <p className="text-sm text-muted-foreground">
          View and track all system activities and user actions.
        </p>
      </div>

      <ActivityFilters
        search={search}
        dateFrom={dateFrom}
        dateTo={dateTo}
        onSearchChange={setSearch}
        onDateFromChange={setDateFrom}
        onDateToChange={setDateTo}
        onClear={handleClear}
      />

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-muted-foreground" />
            <CardTitle>All Activities</CardTitle>
          </div>
          <CardDescription>
            Complete history of user actions and system events
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Resource</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                      </TableRow>
                    ))}
                  </>
                ) : filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="p-0">
                      <div className="p-12">
                        <Empty>
                          <EmptyHeader>
                            <EmptyMedia variant="icon">
                              <FileText className="h-6 w-6" />
                            </EmptyMedia>
                            <EmptyTitle>No Activity Logs</EmptyTitle>
                            <EmptyDescription>
                              No system activity has been recorded yet. Activity will appear here as users interact with the system.
                            </EmptyDescription>
                          </EmptyHeader>
                        </Empty>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        {new Date(log.created_at).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {log.user ? (
                          <div>
                            <div className="font-medium">
                              {log.user.name || log.user.email}
                            </div>
                            {log.user.name && (
                              <div className="text-sm text-muted-foreground">
                                {log.user.email}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">System</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getActionColor(log.action)}>
                          {formatAction(log.action)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {log.resource_type ? (
                          <span className="text-sm text-muted-foreground">
                            {log.resource_type}
                          </span>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground max-w-md truncate">
                          {log.details ? JSON.stringify(log.details) : '-'}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

