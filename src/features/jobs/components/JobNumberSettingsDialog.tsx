'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'

const settingsSchema = z.object({
  prefix: z.string().max(20, 'Prefix must be less than 20 characters').optional().or(z.literal('')),
  number_base: z.enum(['sequence', 'year']),
  next_number: z.number().int().min(1, 'Next number must be at least 1'),
})

type SettingsFormValues = z.infer<typeof settingsSchema>

interface JobNumberSettings {
  id: string
  prefix: string
  number_base: 'sequence' | 'year'
  next_number: number
  year?: number
}

interface JobNumberSettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function JobNumberSettingsDialog({
  open,
  onOpenChange,
}: JobNumberSettingsDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      prefix: '',
      number_base: 'sequence',
      next_number: 1,
    },
  })

  const numberBase = watch('number_base')

  // Fetch current settings
  useEffect(() => {
    if (open) {
      fetchSettings()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const fetchSettings = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/jobs/settings')
      if (!response.ok) {
        throw new Error('Failed to fetch settings')
      }
      const data = await response.json()
      const settings: JobNumberSettings = data.settings

      reset({
        prefix: settings.prefix || '',
        number_base: settings.number_base,
        next_number: settings.next_number,
      })
    } catch (error) {
      console.error('Error fetching settings:', error)
      toast.error('Failed to load settings')
    } finally {
      setIsLoading(false)
    }
  }

  const onSubmit = async (data: SettingsFormValues) => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/jobs/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save settings')
      }

      toast.success('Job number settings updated successfully')
      onOpenChange(false)
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to save settings')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Job Number Settings</DialogTitle>
          <DialogDescription>
            Configure how job numbers are auto-generated. These settings will be used when creating new jobs.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="prefix">Prefix (Optional)</Label>
              <Input
                id="prefix"
                {...register('prefix')}
                placeholder="e.g., JOB, RPS, CNC"
                maxLength={20}
              />
              {errors.prefix && (
                <p className="text-sm text-destructive">{errors.prefix.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                A prefix to add before the number (e.g., JOB-001, RPS-2024-001)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="number_base">Number Base</Label>
              <Select
                value={numberBase}
                onValueChange={(value: 'sequence' | 'year') => setValue('number_base', value)}
              >
                <SelectTrigger id="number_base">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sequence">Sequence (1, 2, 3...)</SelectItem>
                  <SelectItem value="year">Year-based (2024-001, 2024-002...)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {numberBase === 'sequence'
                  ? 'Numbers will increment sequentially: 1, 2, 3...'
                  : 'Numbers will include the year and reset each year: 2024-001, 2024-002...'}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="next_number">Next Number</Label>
              <Input
                id="next_number"
                type="number"
                min="1"
                {...register('next_number', { valueAsNumber: true })}
              />
              {errors.next_number && (
                <p className="text-sm text-destructive">{errors.next_number.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                The next number to use when generating a new job number. This will automatically increment after each job is created.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Settings
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}

