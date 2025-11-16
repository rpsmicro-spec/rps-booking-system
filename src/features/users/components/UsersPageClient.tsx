'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { UserPlus, Info } from 'lucide-react'
import { UsersTable } from './UsersTable'
import { PendingInvitations } from './PendingInvitations'
import { InviteUserDialog } from './InviteUserDialog'
import { RoleInformationDialog } from './RoleInformationDialog'

export function UsersPageClient() {
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  const [roleInfoDialogOpen, setRoleInfoDialogOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const handleInviteSuccess = () => {
    // Force UsersList to refresh by changing the key
    setRefreshKey((prev) => prev + 1)
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">User Management</h2>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setRoleInfoDialogOpen(true)}
              title="Role Information"
              className="hidden sm:flex"
            >
              <Info className="h-4 w-4" />
            </Button>
            <Button onClick={() => setInviteDialogOpen(true)} className="hidden sm:flex">
              <UserPlus className="mr-2 h-4 w-4" />
              Invite User
            </Button>
            <Button
              size="icon"
              onClick={() => setInviteDialogOpen(true)}
              className="sm:hidden"
            >
              <UserPlus className="h-4 w-4" />
              <span className="sr-only">Invite User</span>
            </Button>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Manage team members, roles, and permissions for your organization.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
        </CardHeader>
        <CardContent className="min-h-[400px]">
          <UsersTable refreshTrigger={refreshKey} />
        </CardContent>
      </Card>

      <PendingInvitations refreshTrigger={refreshKey} />

      <InviteUserDialog
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
        onSuccess={handleInviteSuccess}
      />

      <RoleInformationDialog
        open={roleInfoDialogOpen}
        onOpenChange={setRoleInfoDialogOpen}
      />
    </div>
  )
}

