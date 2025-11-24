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
import { Activity, FileText, Clock, User, FileCheck, Info } from 'lucide-react'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { Skeleton } from '@/components/ui/skeleton'
import { ActivityFilters } from './ActivityFilters'
import { useIsMobile } from '@/hooks/use-mobile'
import { format } from 'date-fns'
import { utcToIstDateObject } from '@/lib/utils/date-ist'

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
  const isMobile = useIsMobile()
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

  const emptyState = (
    <div className="p-8 sm:p-12">
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
  )

  return (
    <div className="flex-1 space-y-4 sm:space-y-6 p-4 md:p-8 pt-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Activity Log</h2>
        <p className="text-xs sm:text-sm text-muted-foreground">
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
        <CardHeader className="pb-3 sm:pb-6">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
            <CardTitle className="text-base sm:text-lg">All Activities</CardTitle>
          </div>
          <CardDescription className="text-xs sm:text-sm">
            Complete history of user actions and system events
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4 sm:pt-6">
          {isLoading ? (
            isMobile ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="pt-4">
                      <div className="space-y-2">
                        <Skeleton className="h-3 w-2/3" />
                        <Skeleton className="h-3 w-1/2" />
                        <Skeleton className="h-3 w-3/4" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableBody>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )
          ) : filteredLogs.length === 0 ? (
            emptyState
          ) : isMobile ? (
            // Mobile Card View
            <div className="space-y-3">
              {filteredLogs.map((log) => (
                <Card key={log.id} className="border-l-4 border-l-primary/20">
                  <CardContent className="pt-4">
                    <div className="space-y-2.5">
                      {/* Date & Time */}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                        <span className="truncate">
                          {(() => {
                            const istDate = utcToIstDateObject(log.created_at);
                            return istDate ? format(istDate, 'MMM dd, yyyy HH:mm') : '';
                          })()}
                        </span>
                      </div>

                      {/* User */}
                      <div className="flex items-center gap-2">
                        <User className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          {log.user ? (
                            <div>
                              <div className="text-xs sm:text-sm font-medium truncate">
                                {log.user.name || log.user.email}
                              </div>
                              {log.user.name && (
                                <div className="text-xs text-muted-foreground truncate">
                                  {log.user.email}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs sm:text-sm text-muted-foreground">System</span>
                          )}
                        </div>
                      </div>

                      {/* Action */}
                      <div className="flex items-center gap-2">
                        <FileCheck className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                        <Badge variant={getActionColor(log.action)} className="text-xs">
                          {formatAction(log.action)}
                        </Badge>
                      </div>

                      {/* Resource */}
                      {log.resource_type && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Info className="h-3.5 w-3.5 flex-shrink-0" />
                          <span className="truncate">Resource: {log.resource_type}</span>
                        </div>
                      )}

                      {/* Details */}
                      {log.details && Object.keys(log.details).length > 0 && (
                        <div className="pt-2 border-t">
                          <p className="text-[10px] font-medium text-muted-foreground mb-1">Details</p>
                          <div className="text-xs text-muted-foreground break-words font-mono bg-muted/50 p-2 rounded">
                            {JSON.stringify(log.details, null, 2)}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            // Desktop Table View
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
                  {filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        {(() => {
                          const istDate = utcToIstDateObject(log.created_at);
                          return istDate ? format(istDate, 'MMM dd, yyyy HH:mm') : '';
                        })()}
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
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

