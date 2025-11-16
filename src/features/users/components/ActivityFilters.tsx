'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { X, Filter } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { useState } from 'react'

interface ActivityFiltersProps {
  search: string
  dateFrom: string | null
  dateTo: string | null
  onSearchChange: (search: string) => void
  onDateFromChange: (date: string | null) => void
  onDateToChange: (date: string | null) => void
  onClear: () => void
}

export function ActivityFilters({
  search,
  dateFrom,
  dateTo,
  onSearchChange,
  onDateFromChange,
  onDateToChange,
  onClear,
}: ActivityFiltersProps) {
  const [isOpen, setIsOpen] = useState(false)
  const hasFilters = search || dateFrom || dateTo

  return (
    <>
      {/* Desktop Filters */}
      <div className="hidden md:block">
        <div className="rounded-lg border bg-card p-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="sm:col-span-2">
              <Label htmlFor="search" className="mb-2 block text-sm font-medium">
                Search
              </Label>
              <Input
                id="search"
                placeholder="Search by user, action, or resource..."
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <Label htmlFor="dateFrom" className="mb-2 block text-sm font-medium">
                From Date
              </Label>
              <Input
                id="dateFrom"
                type="date"
                value={dateFrom || ''}
                onChange={(e) => onDateFromChange(e.target.value || null)}
                className="w-full"
              />
            </div>
            <div>
              <Label htmlFor="dateTo" className="mb-2 block text-sm font-medium">
                To Date
              </Label>
              <Input
                id="dateTo"
                type="date"
                value={dateTo || ''}
                onChange={(e) => onDateToChange(e.target.value || null)}
                className="w-full"
              />
            </div>
          </div>
          {hasFilters && (
            <div className="mt-4 flex justify-end">
              <Button variant="outline" size="sm" onClick={onClear}>
                <X className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Filters */}
      <div className="md:hidden">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="w-full justify-between">
              <span>
                Filters {hasFilters && `(${[search, dateFrom, dateTo].filter(Boolean).length})`}
              </span>
              <Filter className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="w-full max-h-[85vh] overflow-y-auto pb-6">
            <SheetHeader className="px-4 pb-4 border-b">
              <SheetTitle>Filter Activity</SheetTitle>
            </SheetHeader>
            <div className="pt-6 pb-2 px-4 space-y-5">
              <div className="space-y-2.5">
                <Label htmlFor="mobile-search" className="text-sm font-medium">
                  Search
                </Label>
                <Input
                  id="mobile-search"
                  placeholder="Search by user, action, or resource..."
                  value={search}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="space-y-2.5">
                <Label htmlFor="mobile-dateFrom" className="text-sm font-medium">
                  From Date
                </Label>
                <Input
                  id="mobile-dateFrom"
                  type="date"
                  value={dateFrom || ''}
                  onChange={(e) => onDateFromChange(e.target.value || null)}
                  className="w-full"
                />
              </div>
              <div className="space-y-2.5">
                <Label htmlFor="mobile-dateTo" className="text-sm font-medium">
                  To Date
                </Label>
                <Input
                  id="mobile-dateTo"
                  type="date"
                  value={dateTo || ''}
                  onChange={(e) => onDateToChange(e.target.value || null)}
                  className="w-full"
                />
              </div>
              {hasFilters && (
                <div className="pt-2">
                  <Button variant="outline" onClick={onClear} className="w-full">
                    <X className="h-4 w-4 mr-2" />
                    Clear All Filters
                  </Button>
                </div>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  )
}

