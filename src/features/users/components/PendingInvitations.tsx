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
import { Button } from '@/components/ui/button'
import { Mail, X } from 'lucide-react'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { TableSkeleton } from '@/components/ui/skeletons'
import { toast } from 'sonner'
import { ROLE_LABELS, type UserRole } from '@/lib/constants/roles'
import type { User } from '@/types/types'

interface PendingInvitationsProps {
  refreshTrigger?: number
}

export function PendingInvitations({ refreshTrigger }: PendingInvitationsProps) {
  const [pendingInvitations, setPendingInvitations] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchPendingInvitations()
  }, [refreshTrigger])

  const fetchPendingInvitations = async () => {
    try {
      const response = await fetch('/api/users')
      const result = await response.json()

      if (!response.ok) {
        toast.error(result.error || 'Failed to fetch pending invitations')
        return
      }

      // Filter for pending invitations
      const pending = (result.users || []).filter(
        (u: User) => u.invited_at && !u.invitation_accepted_at
      )
      setPendingInvitations(pending)
    } catch {
      toast.error('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleResendInvitation = async (_user: User) => {
    try {
      // TODO: Implement resend invitation API
      toast.info('Resend invitation feature coming soon')
    } catch {
      toast.error('Failed to resend invitation')
    }
  }

  const handleCancelInvitation = async (user: User) => {
    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (!response.ok) {
        toast.error(result.error || 'Failed to cancel invitation')
        return
      }

      toast.success('Invitation cancelled')
      await fetchPendingInvitations()
    } catch {
      toast.error('An unexpected error occurred')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pending Invitations</CardTitle>
        <CardDescription>Users who have been invited but haven&apos;t accepted yet</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <TableSkeleton rows={3} columns={5} />
        ) : pendingInvitations.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Mail className="h-6 w-6" />
              </EmptyMedia>
              <EmptyTitle>No Pending Invitations</EmptyTitle>
              <EmptyDescription>
                All invitations have been accepted or none have been sent yet.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Invited</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingInvitations.map((invitation) => (
                  <TableRow key={invitation.id}>
                    <TableCell className="font-medium">{invitation.email}</TableCell>
                    <TableCell>{invitation.name || '-'}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {ROLE_LABELS[invitation.role as UserRole]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {invitation.invited_at
                        ? new Date(invitation.invited_at).toLocaleDateString()
                        : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleResendInvitation(invitation)}
                        >
                          <Mail className="h-4 w-4 mr-2" />
                          Resend
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCancelInvitation(invitation)}
                        >
                          <X className="h-4 w-4 mr-2" />
                          Cancel
                        </Button>
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
  )
}

