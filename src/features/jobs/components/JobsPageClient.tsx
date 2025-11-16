'use client'

import { useState } from 'react'
import { JobsTable } from './JobsTable'
import { JobSearch } from './JobSearch'
import { JobFilters } from './JobFilters'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { Plus, Settings } from 'lucide-react'
import { JobNumberSettingsDialog } from './JobNumberSettingsDialog'

export function JobsPageClient() {
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [dateFrom, setDateFrom] = useState<string | null>(null)
  const [dateTo, setDateTo] = useState<string | null>(null)
  const [offset, setOffset] = useState(0)
  const [total, setTotal] = useState(0)
  const limit = 50

  const handleStatusChange = (newStatus: string | null) => {
    setStatus(newStatus)
    setOffset(0)
  }

  const handleSearchChange = (newSearch: string) => {
    setSearch(newSearch)
    setOffset(0)
  }

  const handleClearFilters = () => {
    setStatus(null)
    setDateFrom(null)
    setDateTo(null)
    setOffset(0)
  }

  const handleClearSearch = () => {
    setSearch('')
    setOffset(0)
  }

  return (
    <>
      <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold tracking-tight">Jobs</h2>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setSettingsDialogOpen(true)}
                title="Job Number Settings"
                className="hidden sm:flex"
              >
                <Settings className="h-4 w-4" />
              </Button>
              <Link href="/jobs/new">
                <Button className="hidden sm:flex">
                  <Plus className="mr-2 h-4 w-4" />
                  New Job
                </Button>
              </Link>
              <Link href="/jobs/new">
                <Button size="icon" className="sm:hidden">
                  <Plus className="h-4 w-4" />
                  <span className="sr-only">New Job</span>
                </Button>
              </Link>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Manage and track all your job orders, from collection to delivery.
          </p>
        </div>

        <div className="space-y-4">
          <JobSearch
            search={search}
            onSearchChange={handleSearchChange}
            onClear={handleClearSearch}
          />
          <JobFilters
            status={status}
            dateFrom={dateFrom}
            dateTo={dateTo}
            onStatusChange={handleStatusChange}
            onDateFromChange={(date) => {
              setDateFrom(date)
              setOffset(0)
            }}
            onDateToChange={(date) => {
              setDateTo(date)
              setOffset(0)
            }}
            onClear={handleClearFilters}
          />

          <Card>
            <CardHeader>
              <CardTitle>All Jobs</CardTitle>
            </CardHeader>
            <CardContent className="min-h-[400px]">
              <JobsTable
                status={status}
                search={search}
                dateFrom={dateFrom}
                dateTo={dateTo}
                limit={limit}
                offset={offset}
                onTotalChange={setTotal}
              />
            </CardContent>
          </Card>

          {/* Pagination */}
          {total > limit && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {offset + 1}-{Math.min(offset + limit, total)} of {total} jobs
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setOffset(Math.max(0, offset - limit))}
                  disabled={offset === 0}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setOffset(offset + limit)}
                  disabled={offset + limit >= total}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <JobNumberSettingsDialog
        open={settingsDialogOpen}
        onOpenChange={setSettingsDialogOpen}
      />
    </>
  )
}

