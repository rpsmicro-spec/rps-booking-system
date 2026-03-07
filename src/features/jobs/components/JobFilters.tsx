'use client'

import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { JOB_STATUS, STATUS_LABELS } from '@/lib/constants'
import { X, Filter } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { useState } from 'react'
import { SimpleDatePicker } from './SimpleDatePicker'
import { JobSearch } from './JobSearch'

interface JobFiltersProps {
  status: string | null
  dateFrom: string | null
  dateTo: string | null
  onStatusChange: (status: string | null) => void
  onDateFromChange: (date: string | null) => void
  onDateToChange: (date: string | null) => void
  onClear: () => void
  /** When provided, mobile sheet is controlled and no trigger is rendered (parent puts trigger elsewhere, e.g. next to search). */
  mobileSheetOpen?: boolean
  onMobileSheetOpenChange?: (open: boolean) => void
  /** When provided, desktop card shows search and filters in the same card (search above filters). */
  search?: string
  onSearchChange?: (search: string) => void
  onClearSearch?: () => void
}

export function JobFilters({
  status,
  dateFrom,
  dateTo,
  onStatusChange,
  onDateFromChange,
  onDateToChange,
  onClear,
  mobileSheetOpen,
  onMobileSheetOpenChange,
  search,
  onSearchChange,
  onClearSearch,
}: JobFiltersProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = mobileSheetOpen !== undefined && onMobileSheetOpenChange !== undefined
  const isOpen = isControlled ? mobileSheetOpen : internalOpen
  const setIsOpen = isControlled ? onMobileSheetOpenChange : setInternalOpen
  const hasFilters = status || dateFrom || dateTo

  return (
    <>
      {/* Desktop: search + filters, no card (consistency with other pages) */}
      <div className="hidden md:block space-y-4">
        {search !== undefined && onSearchChange && onClearSearch && (
          <JobSearch
            search={search}
            onSearchChange={onSearchChange}
            onClear={onClearSearch}
          />
        )}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <Select
                value={status || 'all'}
                onValueChange={(value) => onStatusChange(value === 'all' ? null : value)}
              >
                <SelectTrigger id="status" className="w-full" aria-label="Status">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {Object.values(JOB_STATUS).map((statusValue) => (
                    <SelectItem key={statusValue} value={statusValue}>
                      {STATUS_LABELS[statusValue]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <SimpleDatePicker
                id="dateFrom"
                value={dateFrom || undefined}
                onChange={(date) => onDateFromChange(date || null)}
                placeholder="Select from date"
              />
            </div>
            <div>
              <SimpleDatePicker
                id="dateTo"
                value={dateTo || undefined}
                onChange={(date) => onDateToChange(date || null)}
                placeholder="Select to date"
              />
            </div>
          </div>
        {hasFilters && (
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={onClear}>
              <X className="h-4 w-4 mr-2" />
              Clear Filters
            </Button>
          </div>
        )}
      </div>

      {/* Mobile Filters - sheet only when controlled (trigger is in parent row with search); otherwise sheet + trigger */}
      <div className="md:hidden">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          {!isControlled && (
            <SheetTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                <span>
                  Filters {hasFilters && `(${[status, dateFrom, dateTo].filter(Boolean).length})`}
                </span>
                <Filter className="h-4 w-4" />
              </Button>
            </SheetTrigger>
          )}
          <SheetContent side="bottom" className="w-full max-h-[85vh] overflow-y-auto pb-6">
            <SheetHeader className="px-4 pb-4 border-b">
              <SheetTitle>Filter Jobs</SheetTitle>
            </SheetHeader>
            <div className="pt-6 pb-2 px-4 space-y-5">
              <div>
                <Select
                  value={status || 'all'}
                  onValueChange={(value) => {
                    onStatusChange(value === 'all' ? null : value)
                  }}
                >
                  <SelectTrigger id="mobile-status" className="w-full" aria-label="Status">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    {Object.values(JOB_STATUS).map((statusValue) => (
                      <SelectItem key={statusValue} value={statusValue}>
                        {STATUS_LABELS[statusValue]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <SimpleDatePicker
                  id="mobile-dateFrom"
                  value={dateFrom || undefined}
                  onChange={(date) => onDateFromChange(date || null)}
                  placeholder="Select from date"
                />
              </div>
              <div>
                <SimpleDatePicker
                  id="mobile-dateTo"
                  value={dateTo || undefined}
                  onChange={(date) => onDateToChange(date || null)}
                  placeholder="Select to date"
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

