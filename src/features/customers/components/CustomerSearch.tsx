'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { X } from 'lucide-react'

interface CustomerSearchProps {
  search: string
  onSearchChange: (search: string) => void
  onClear: () => void
}

export function CustomerSearch({
  search,
  onSearchChange,
  onClear,
}: CustomerSearchProps) {
  const hasSearch = search

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex gap-4 items-end">
        <div className="flex-1">
          <Label htmlFor="search" className="mb-2 block text-sm font-medium">
            Search
          </Label>
          <Input
            id="search"
            placeholder="Search by name, email, or phone..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full"
          />
        </div>
        {hasSearch && (
          <Button variant="outline" size="sm" onClick={onClear}>
            <X className="h-4 w-4 mr-2" />
            Clear
          </Button>
        )}
      </div>
    </div>
  )
}

