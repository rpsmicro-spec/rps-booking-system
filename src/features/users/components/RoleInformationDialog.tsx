'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { ROLE_LABELS, USER_ROLES } from '@/lib/constants/roles'
import { Shield, User, Crown } from 'lucide-react'

interface RoleInformationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RoleInformationDialog({
  open,
  onOpenChange,
}: RoleInformationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Role Information</DialogTitle>
          <DialogDescription>
            Understanding user roles and permissions in the system
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          {/* Owner Role */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-yellow-600 dark:text-yellow-500" />
              <h4 className="font-semibold text-lg">Owner</h4>
              <Badge variant="default">{ROLE_LABELS[USER_ROLES.OWNER]}</Badge>
            </div>
            <p className="text-sm text-muted-foreground pl-7">
              Full system access. Can invite and manage all users (including admins and owners),
              manage all jobs, view all data, and access all features. This role has complete
              control over the system.
            </p>
            <div className="pl-7 space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Permissions:</p>
              <ul className="text-xs text-muted-foreground list-disc list-inside space-y-0.5">
                <li>Invite and manage all users (Owner, Admin, Staff)</li>
                <li>Update user roles</li>
                <li>Delete any user account</li>
                <li>Manage all jobs</li>
                <li>View all system data</li>
                <li>Access audit logs</li>
              </ul>
            </div>
          </div>

          {/* Admin Role */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600 dark:text-blue-500" />
              <h4 className="font-semibold text-lg">Admin</h4>
              <Badge variant="secondary">{ROLE_LABELS[USER_ROLES.ADMIN]}</Badge>
            </div>
            <p className="text-sm text-muted-foreground pl-7">
              Can invite new users (Staff only), manage jobs, and view all jobs. Full access to
              user management features for Staff users only.
            </p>
            <div className="pl-7 space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Permissions:</p>
              <ul className="text-xs text-muted-foreground list-disc list-inside space-y-0.5">
                <li>Invite and manage Staff users</li>
                <li>Update Staff user roles</li>
                <li>Manage all jobs</li>
                <li>View all system data</li>
                <li>Cannot invite or manage Admin/Owner accounts</li>
              </ul>
            </div>
          </div>

          {/* Staff Role */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              <h4 className="font-semibold text-lg">Staff</h4>
              <Badge variant="outline">{ROLE_LABELS[USER_ROLES.STAFF]}</Badge>
            </div>
            <p className="text-sm text-muted-foreground pl-7">
              Can manage and view jobs. Cannot invite users or access user management features.
              Standard user role for day-to-day operations.
            </p>
            <div className="pl-7 space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Permissions:</p>
              <ul className="text-xs text-muted-foreground list-disc list-inside space-y-0.5">
                <li>Create, edit, and delete jobs</li>
                <li>View all jobs</li>
                <li>Update job statuses</li>
                <li>Upload photos and invoices</li>
                <li>Send notifications to customers</li>
                <li>Cannot access user management</li>
              </ul>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

