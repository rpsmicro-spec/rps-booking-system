'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import { useState } from 'react'
import { SimpleDatePicker } from '@/features/jobs/components/SimpleDatePicker'
import { ACTION_OPTIONS } from './activity-format'

interface ActivityFiltersProps {
  search: string
  dateFrom: string | null
  dateTo: string | null
  action: string | null
  onSearchChange: (search: string) => void
  onDateFromChange: (date: string | null) => void
  onDateToChange: (date: string | null) => void
  onActionChange: (action: string | null) => void
  onClear: () => void
}

function SearchField({
  id,
  search,
  onSearchChange,
}: {
  id: string
  search: string
  onSearchChange: (search: string) => void
}) {
  return (
    <div className="relative min-w-0 flex-1">
      <Search
        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      />
      <Input
        id={id}
        type="search"
        placeholder="Search activity…"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        className="w-full pl-9"
        aria-label="Search activity"
      />
    </div>
  )
}

function ActionSelect({
  id,
  action,
  onActionChange,
  className,
}: {
  id: string
  action: string | null
  onActionChange: (action: string | null) => void
  className?: string
}) {
  return (
    <Select
      value={action || 'all'}
      onValueChange={(value) => onActionChange(value === 'all' ? null : value)}
    >
      <SelectTrigger id={id} className={className} aria-label="Action type">
        <SelectValue placeholder="All actions" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All actions</SelectItem>
        {ACTION_OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export function ActivityFilters({
  search,
  dateFrom,
  dateTo,
  action,
  onSearchChange,
  onDateFromChange,
  onDateToChange,
  onActionChange,
  onClear,
}: ActivityFiltersProps) {
  const [isOpen, setIsOpen] = useState(false)
  const hasFilters = !!(search || dateFrom || dateTo || action)
  const sheetFilterCount = [dateFrom, dateTo, action].filter(Boolean).length

  return (
    <>
      {/* Desktop: one row on wide screens; search on its own row on narrow tablets */}
      <div className="hidden md:grid md:grid-cols-[repeat(3,minmax(0,1fr))_auto] md:gap-2 xl:grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))_auto]">
        <div className="flex min-w-0 md:col-span-4 xl:col-span-1">
          <SearchField id="activity-search" search={search} onSearchChange={onSearchChange} />
        </div>
        <ActionSelect
          id="activity-action"
          action={action}
          onActionChange={onActionChange}
          className="w-full min-w-0"
        />
        <SimpleDatePicker
          id="activity-dateFrom"
          value={dateFrom || undefined}
          onChange={(date) => onDateFromChange(date || null)}
          placeholder="From date"
          className="min-w-0"
        />
        <SimpleDatePicker
          id="activity-dateTo"
          value={dateTo || undefined}
          onChange={(date) => onDateToChange(date || null)}
          placeholder="To date"
          className="min-w-0"
        />
        {hasFilters ? (
          <Button variant="ghost" onClick={onClear} className="shrink-0 text-muted-foreground">
            <X />
            Clear
          </Button>
        ) : (
          <span aria-hidden />
        )}
      </div>

      {/* Mobile: search + filter icon button; other filters in a bottom sheet */}
      <div className="flex items-center gap-2 md:hidden">
        <SearchField id="activity-search-mobile" search={search} onSearchChange={onSearchChange} />
        <Button
          variant="outline"
          size="icon"
          className="relative shrink-0"
          onClick={() => setIsOpen(true)}
          aria-label={
            sheetFilterCount > 0 ? `Open filters (${sheetFilterCount} active)` : 'Open filters'
          }
          title="Filters"
        >
          <SlidersHorizontal />
          {sheetFilterCount > 0 && (
            <span
              aria-hidden
              className="absolute -right-1 -top-1 flex min-w-4 items-center justify-center rounded-full bg-primary px-1 py-0.5 text-xs leading-none font-medium tabular-nums text-primary-foreground"
            >
              {sheetFilterCount}
            </span>
          )}
        </Button>
      </div>

      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="bottom" className="w-full max-h-[85vh] overflow-y-auto pb-6 md:hidden">
          <SheetHeader className="px-4 pb-4 border-b">
            <SheetTitle>Filter activity</SheetTitle>
          </SheetHeader>
          <div className="pt-6 pb-2 px-4 space-y-5">
            <ActionSelect
              id="activity-action-mobile"
              action={action}
              onActionChange={onActionChange}
              className="w-full"
            />
            <SimpleDatePicker
              id="activity-dateFrom-mobile"
              value={dateFrom || undefined}
              onChange={(date) => onDateFromChange(date || null)}
              placeholder="From date"
            />
            <SimpleDatePicker
              id="activity-dateTo-mobile"
              value={dateTo || undefined}
              onChange={(date) => onDateToChange(date || null)}
              placeholder="To date"
            />
            {hasFilters && (
              <div className="pt-2">
                <Button variant="outline" onClick={onClear} className="w-full">
                  <X className="h-4 w-4 mr-2" />
                  Clear all filters
                </Button>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
