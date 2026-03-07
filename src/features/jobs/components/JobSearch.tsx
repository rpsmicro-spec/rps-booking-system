'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { X } from 'lucide-react'

interface JobSearchProps {
  search: string
  onSearchChange: (search: string) => void
  onClear: () => void
}

export function JobSearch({
  search,
  onSearchChange,
  onClear,
}: JobSearchProps) {
  const hasSearch = search

  return (
    <div className="flex gap-2 items-center">
      <Input
        id="jobs-search"
        type="search"
        placeholder="Search by job number, customer, email…"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        className="flex-1 min-w-0"
        aria-label="Search jobs"
      />
      {hasSearch && (
        <Button variant="ghost" size="icon" onClick={onClear} aria-label="Clear search">
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}

