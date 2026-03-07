'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { CustomerSearch } from './CustomerSearch'
import { CustomersTable } from './CustomersTable'

export function CustomersList() {
  const [search, setSearch] = useState('')
  const [offset, setOffset] = useState(0)
  const [total, setTotal] = useState(0)
  const limit = 10

  const handleClear = () => {
    setSearch('')
    setOffset(0)
  }

  const handleSearchChange = (newSearch: string) => {
    setSearch(newSearch)
    setOffset(0)
  }

  return (
    <div className="space-y-4">
      <div className="space-y-4">
        <h3 className="text-lg md:text-xl font-semibold tracking-tight">
          All Customers
        </h3>
        <CustomerSearch
          search={search}
          onSearchChange={handleSearchChange}
          onClear={handleClear}
        />
        <div className="min-h-[400px]">
          <CustomersTable
            search={search}
            limit={limit}
            offset={offset}
            onTotalChange={setTotal}
          />
        </div>
      </div>

      {/* Pagination - same UI as Activity page */}
      {total > limit && (
        <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {offset + 1}-{Math.min(offset + limit, total)} of {total} customers
          </p>
          <div className="flex w-full gap-2 sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 min-w-0 sm:flex-initial"
              onClick={() => setOffset(Math.max(0, offset - limit))}
              disabled={offset === 0}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 min-w-0 sm:flex-initial"
              onClick={() => setOffset(offset + limit)}
              disabled={offset + limit >= total}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

