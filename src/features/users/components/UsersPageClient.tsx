'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { UserPlus, Info, Users } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
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
    <div className="flex-1 space-y-4 md:space-y-6">
      <PageHeader
        icon={Users}
        title="User Management"
        description="Manage team members, roles, and permissions for your organization."
        actions={
          <>
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
          </>
        }
      />

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

