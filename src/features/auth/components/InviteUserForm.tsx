'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { USER_ROLES, ROLE_LABELS } from '@/lib/constants/roles'

const inviteSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z
    .string()
    .optional()
    .refine(
      (val) => !val || val.trim().length >= 2,
      'Name must be at least 2 characters'
    )
    .refine(
      (val) => !val || val.trim().split(/\s+/).length >= 2,
      'Please enter full name (first and last name)'
    )
    .refine(
      (val) => !val || val.trim().split(/\s+/).every((part) => part.length >= 2),
      'Each name part must be at least 2 characters'
    )
    .refine(
      (val) => !val || val.trim().length <= 100,
      'Name must be less than 100 characters'
    ),
  role: z.enum([USER_ROLES.ADMIN, USER_ROLES.STAFF]),
})

type InviteFormValues = z.infer<typeof inviteSchema>

export function InviteUserForm() {
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<InviteFormValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      role: USER_ROLES.STAFF,
    },
  })

  const selectedRole = watch('role')

  const onSubmit = async (data: InviteFormValues) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/auth/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: data.email,
          name: data.name,
          role: data.role,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        toast.error(result.error || 'Failed to send invitation')
        return
      }

      toast.success('Invitation sent successfully!')
      reset()
    } catch {
      toast.error('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email *</Label>
        <Input
          id="email"
          type="email"
          placeholder="user@example.com"
          {...register('email')}
          disabled={isLoading}
        />
        {errors.email && (
          <p className="text-sm text-red-500">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">Full Name (Optional)</Label>
        <Input
          id="name"
          type="text"
          placeholder="First and Last Name"
          {...register('name')}
          disabled={isLoading}
        />
        {errors.name && (
          <p className="text-sm text-red-500">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="role">Role *</Label>
        <Select
          value={selectedRole}
          onValueChange={(value) => setValue('role', value as typeof USER_ROLES.ADMIN | typeof USER_ROLES.STAFF)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={USER_ROLES.STAFF}>
              {ROLE_LABELS[USER_ROLES.STAFF]}
            </SelectItem>
            <SelectItem value={USER_ROLES.ADMIN}>
              {ROLE_LABELS[USER_ROLES.ADMIN]}
            </SelectItem>
          </SelectContent>
        </Select>
        {errors.role && (
          <p className="text-sm text-red-500">{errors.role.message}</p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? 'Sending...' : 'Send Invitation'}
      </Button>
    </form>
  )
}

