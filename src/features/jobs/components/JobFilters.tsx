'use client'

import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { JOB_STATUS, STATUS_LABELS } from '@/lib/constants'
import { X, Filter } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { useState } from 'react'
import { SimpleDatePicker } from './SimpleDatePicker'

interface JobFiltersProps {
  status: string | null
  dateFrom: string | null
  dateTo: string | null
  onStatusChange: (status: string | null) => void
  onDateFromChange: (date: string | null) => void
  onDateToChange: (date: string | null) => void
  onClear: () => void
}

export function JobFilters({
  status,
  dateFrom,
  dateTo,
  onStatusChange,
  onDateFromChange,
  onDateToChange,
  onClear,
}: JobFiltersProps) {
  const [isOpen, setIsOpen] = useState(false)
  const hasFilters = status || dateFrom || dateTo

  return (
    <>
      {/* Desktop Filters */}
      <div className="hidden md:block">
        <div className="rounded-lg border bg-card p-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <Label htmlFor="status" className="mb-2 block text-sm font-medium">
                Status
              </Label>
              <Select
                value={status || 'all'}
                onValueChange={(value) => onStatusChange(value === 'all' ? null : value)}
              >
                <SelectTrigger id="status" className="w-full">
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
              <Label htmlFor="dateFrom" className="mb-2 block text-sm font-medium">
                From Date
              </Label>
              <SimpleDatePicker
                id="dateFrom"
                value={dateFrom || undefined}
                onChange={(date) => onDateFromChange(date || null)}
                placeholder="Select from date"
              />
            </div>
            <div>
              <Label htmlFor="dateTo" className="mb-2 block text-sm font-medium">
                To Date
              </Label>
              <SimpleDatePicker
                id="dateTo"
                value={dateTo || undefined}
                onChange={(date) => onDateToChange(date || null)}
                placeholder="Select to date"
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
                Filters {hasFilters && `(${[status, dateFrom, dateTo].filter(Boolean).length})`}
              </span>
              <Filter className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="w-full max-h-[85vh] overflow-y-auto pb-6">
            <SheetHeader className="px-4 pb-4 border-b">
              <SheetTitle>Filter Jobs</SheetTitle>
            </SheetHeader>
            <div className="pt-6 pb-2 px-4 space-y-5">
              <div className="space-y-2.5">
                <Label htmlFor="mobile-status" className="text-sm font-medium">
                  Status
                </Label>
                <Select
                  value={status || 'all'}
                  onValueChange={(value) => {
                    onStatusChange(value === 'all' ? null : value)
                  }}
                >
                  <SelectTrigger id="mobile-status" className="w-full">
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
              <div className="space-y-2.5">
                <Label htmlFor="mobile-dateFrom" className="text-sm font-medium">
                  From Date
                </Label>
                <SimpleDatePicker
                  id="mobile-dateFrom"
                  value={dateFrom || undefined}
                  onChange={(date) => onDateFromChange(date || null)}
                  placeholder="Select from date"
                />
              </div>
              <div className="space-y-2.5">
                <Label htmlFor="mobile-dateTo" className="text-sm font-medium">
                  To Date
                </Label>
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

