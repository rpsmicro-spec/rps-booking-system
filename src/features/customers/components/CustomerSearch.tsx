'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
    <div className="flex gap-2 items-center">
      <Input
        id="customers-search"
        type="search"
        placeholder="Search by name, email, or phone…"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        className="flex-1 min-w-0"
        aria-label="Search customers"
      />
      {hasSearch && (
        <Button variant="ghost" size="icon" onClick={onClear} aria-label="Clear search">
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}

