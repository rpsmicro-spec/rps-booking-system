'use client'

import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { History } from 'lucide-react'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import type { User } from '@/types/types'

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

interface UserAuditLogDialogProps {
  user: User
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function UserAuditLogDialog({
  user,
  open,
  onOpenChange,
}: UserAuditLogDialogProps) {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (open && user.id) {
      fetchAuditLogs()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, user.id])

  const fetchAuditLogs = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/audit-log?user_id=${user.id}`)
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Audit Log - {user.name || user.email}
          </DialogTitle>
          <DialogDescription>
            Activity history for {user.name ? `${user.name} (${user.email})` : user.email}
          </DialogDescription>
        </DialogHeader>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date & Time</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Resource</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    Loading audit logs...
                  </TableCell>
                </TableRow>
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="p-0">
                    <div className="p-12">
                      <Empty>
                        <EmptyHeader>
                          <EmptyMedia variant="icon">
                            <History className="h-6 w-6" />
                          </EmptyMedia>
                          <EmptyTitle>No Audit Logs</EmptyTitle>
                          <EmptyDescription>
                            No activity has been recorded for this user yet.
                          </EmptyDescription>
                        </EmptyHeader>
                      </Empty>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      {new Date(log.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{formatAction(log.action)}</Badge>
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
      </DialogContent>
    </Dialog>
  )
}

