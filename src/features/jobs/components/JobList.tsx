'use client'

import { useState, useEffect } from 'react'
import { JobCard } from './JobCard'
import { JobFilters } from './JobFilters'
import { JobSearch } from './JobSearch'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Briefcase } from 'lucide-react'
import { CardsGridSkeleton, SearchAndFiltersSkeleton } from '@/components/ui/skeletons'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import Link from 'next/link'
import type { Job } from '@/types/types'

interface JobListResponse {
  jobs: Job[]
  total: number
  limit: number
  offset: number
}

export function JobList() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [dateFrom, setDateFrom] = useState<string | null>(null)
  const [dateTo, setDateTo] = useState<string | null>(null)
  const [offset, setOffset] = useState(0)
  const [total, setTotal] = useState(0)
  const limit = 12

  const fetchJobs = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (status) params.append('status', status)
      if (search) params.append('search', search)
      if (dateFrom) params.append('dateFrom', dateFrom)
      if (dateTo) params.append('dateTo', dateTo)
      params.append('limit', limit.toString())
      params.append('offset', offset.toString())

      const response = await fetch(`/api/jobs?${params.toString()}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error((result as { error?: string }).error || 'Failed to fetch jobs')
      }

      const data = result as JobListResponse
      setJobs(data.jobs)
      setTotal(data.total)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchJobs()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, search, dateFrom, dateTo, offset])

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

  if (isLoading && jobs.length === 0) {
    return (
      <div className="space-y-4">
        <SearchAndFiltersSkeleton />
        <CardsGridSkeleton count={6} />
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-red-500">{error}</p>
          <Button onClick={fetchJobs} className="mt-4" variant="outline">
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
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

      {jobs.length === 0 ? (
        <Card>
          <CardContent className="p-12">
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Briefcase className="h-6 w-6" />
                </EmptyMedia>
                <EmptyTitle>
                  {search || status || dateFrom || dateTo
                    ? 'No Jobs Found'
                    : 'No Jobs Yet'}
                </EmptyTitle>
                <EmptyDescription>
                  {search || status || dateFrom || dateTo
                    ? 'No jobs match your filters. Try adjusting your search criteria or clear filters to see all jobs.'
                    : 'Get started by creating your first job. Track customer orders, manage status, and upload photos.'}
                </EmptyDescription>
              </EmptyHeader>
              {!(search || status || dateFrom || dateTo) && (
                <EmptyContent>
                  <Button asChild>
                    <Link href="/jobs/new">
                      Create First Job
                    </Link>
                  </Button>
                </EmptyContent>
              )}
            </Empty>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>

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
                  disabled={offset === 0 || isLoading}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setOffset(offset + limit)}
                  disabled={offset + limit >= total || isLoading}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

