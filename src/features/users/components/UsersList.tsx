'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { USER_ROLES, ROLE_LABELS, type UserRole } from '@/lib/constants/roles'
import { Badge } from '@/components/ui/badge'
import type { User } from '@/types/types'

interface UsersListProps {
  refreshTrigger?: number
}

export function UsersList({ refreshTrigger }: UsersListProps) {
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [updatingRoles, setUpdatingRoles] = useState<Set<string>>(new Set())

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

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground">Loading users...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>All Users</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {users.length === 0 ? (
            <p className="text-sm text-muted-foreground">No users found</p>
          ) : (
            users.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{user.email}</p>
                    <Badge variant="secondary">
                      {user.role ? ROLE_LABELS[user.role as UserRole] : 'Staff'}
                    </Badge>
                  </div>
                  {user.name && (
                    <p className="text-sm text-muted-foreground">{user.name}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    Joined: {new Date(user.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
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
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}

