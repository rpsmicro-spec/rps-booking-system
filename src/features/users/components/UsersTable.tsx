'use client'

import { useEffect, useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { USER_ROLES, ROLE_LABELS, type UserRole } from '@/lib/constants/roles'
import type { User } from '@/types/types'
import { MoreHorizontal, Edit, Trash2, History, Mail, Users } from 'lucide-react'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { TableSkeleton } from '@/components/ui/skeletons'
import { UserAuditLogDialog } from './UserAuditLogDialog'

interface UsersTableProps {
  refreshTrigger?: number
}

export function UsersTable({ refreshTrigger }: UsersTableProps) {
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [updatingRoles, setUpdatingRoles] = useState<Set<string>>(new Set())
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [deleteUser, setDeleteUser] = useState<User | null>(null)
  const [auditLogUser, setAuditLogUser] = useState<User | null>(null)

  useEffect(() => {
    fetchUsers()
  }, [refreshTrigger])

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users')
      const result = await response.json()

      if (!response.ok) {
        toast.error(result.error || 'Failed to fetch users')
        return
      }

      setUsers(result.users)
    } catch {
      toast.error('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const updateUserRole = async (userId: string, newRole: UserRole) => {
    setUpdatingRoles((prev) => new Set(prev).add(userId))

    try {
      const response = await fetch(`/api/users/${userId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      })

      const result = await response.json()

      if (!response.ok) {
        toast.error(result.error || 'Failed to update user role')
        return
      }

      toast.success('User role updated successfully')
      await fetchUsers()
    } catch {
      toast.error('An unexpected error occurred')
    } finally {
      setUpdatingRoles((prev) => {
        const next = new Set(prev)
        next.delete(userId)
        return next
      })
    }
  }

  const handleEditUser = async (user: User, updates: { name?: string; email?: string }) => {
    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })

      const result = await response.json()

      if (!response.ok) {
        toast.error(result.error || 'Failed to update user')
        return
      }

      toast.success('User updated successfully')
      setEditingUser(null)
      await fetchUsers()
    } catch {
      toast.error('An unexpected error occurred')
    }
  }

  const handleDeleteUser = async (user: User) => {
    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (!response.ok) {
        toast.error(result.error || 'Failed to delete user')
        return
      }

      toast.success('User deleted successfully')
      setDeleteUser(null)
      await fetchUsers()
    } catch {
      toast.error('An unexpected error occurred')
    }
  }

  if (isLoading) {
    return <TableSkeleton rows={5} columns={6} />
  }

  const activeUsers = users.filter((u) => u.invitation_accepted_at !== null || !u.invited_at)
  const pendingInvitations = users.filter((u) => u.invited_at && !u.invitation_accepted_at)

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {activeUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="p-0">
                  <div className="p-12">
                    <Empty>
                      <EmptyHeader>
                        <EmptyMedia variant="icon">
                          <Users className="h-6 w-6" />
                        </EmptyMedia>
                        <EmptyTitle>No Users Found</EmptyTitle>
                        <EmptyDescription>
                          No active users in the system. Invite users to get started.
                        </EmptyDescription>
                      </EmptyHeader>
                    </Empty>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              activeUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.email}</TableCell>
                  <TableCell>{user.name || '-'}</TableCell>
                  <TableCell>
                    <Select
                      value={user.role || USER_ROLES.STAFF}
                      onValueChange={(value) =>
                        updateUserRole(user.id, value as UserRole)
                      }
                      disabled={updatingRoles.has(user.id)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(USER_ROLES).map((role) => (
                          <SelectItem key={role} value={role}>
                            {ROLE_LABELS[role]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">Active</Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(user.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditingUser(user)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setAuditLogUser(user)}>
                          <History className="mr-2 h-4 w-4" />
                          View Audit Log
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setDeleteUser(user)}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Remove
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit User Dialog */}
      {editingUser && (
        <EditUserDialog
          user={editingUser}
          open={!!editingUser}
          onOpenChange={(open) => !open && setEditingUser(null)}
          onSave={handleEditUser}
        />
      )}

      {/* Delete User Dialog */}
      {deleteUser && (
        <DeleteUserDialog
          user={deleteUser}
          open={!!deleteUser}
          onOpenChange={(open) => !open && setDeleteUser(null)}
          onConfirm={handleDeleteUser}
        />
      )}

      {/* Audit Log Dialog */}
      {auditLogUser && (
        <UserAuditLogDialog
          user={auditLogUser}
          open={!!auditLogUser}
          onOpenChange={(open) => !open && setAuditLogUser(null)}
        />
      )}
    </>
  )
}

function EditUserDialog({
  user,
  open,
  onOpenChange,
  onSave,
}: {
  user: User
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (user: User, updates: { name?: string; email?: string }) => void
}) {
  const [name, setName] = useState(user.name || '')
  const [email, setEmail] = useState(user.email || '')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    await onSave(user, { name, email })
    setIsLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>Update user information</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              disabled={isLoading}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function DeleteUserDialog({
  user,
  open,
  onOpenChange,
  onConfirm,
}: {
  user: User
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (user: User) => void
}) {
  const [isLoading, setIsLoading] = useState(false)

  const handleConfirm = async () => {
    setIsLoading(true)
    await onConfirm(user)
    setIsLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Remove User</DialogTitle>
          <DialogDescription>
            Are you sure you want to remove <strong>{user.email}</strong> from the organization?
            This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Removing...' : 'Remove User'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

