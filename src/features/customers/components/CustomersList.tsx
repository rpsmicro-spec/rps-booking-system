'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CustomerSearch } from './CustomerSearch'
import { CustomersTable } from './CustomersTable'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'

export function CustomersList() {
  const [search, setSearch] = useState('')
  const [offset, setOffset] = useState(0)
  const [total, setTotal] = useState(0)
  const limit = 50

  const handleClear = () => {
    setSearch('')
    setOffset(0)
  }

  const handleSearchChange = (newSearch: string) => {
    setSearch(newSearch)
    setOffset(0)
  }

  const totalPages = Math.ceil(total / limit)
  const currentPage = Math.floor(offset / limit) + 1

  const handlePageChange = (page: number) => {
    setOffset((page - 1) * limit)
  }

  return (
    <div className="space-y-4">
      <CustomerSearch
        search={search}
        onSearchChange={handleSearchChange}
        onClear={handleClear}
      />

      <Card>
        <CardHeader>
          <CardTitle>All Customers</CardTitle>
        </CardHeader>
        <CardContent className="min-h-[400px]">
          <CustomersTable
            search={search}
            limit={limit}
            offset={offset}
            onTotalChange={setTotal}
          />
        </CardContent>
      </Card>

      {/* Pagination */}
      {total > limit && (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground text-center">
            Showing {offset + 1}-{Math.min(offset + limit, total)} of {total} customers
          </p>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault()
                    if (offset > 0) {
                      handlePageChange(currentPage - 1)
                    }
                  }}
                  className={offset === 0 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>

              {(() => {
                const pages: (number | 'ellipsis')[] = []

                if (totalPages <= 7) {
                  // Show all pages
                  for (let i = 1; i <= totalPages; i++) {
                    pages.push(i)
                  }
                } else {
                  // Show first page
                  pages.push(1)

                  if (currentPage <= 4) {
                    // Show pages 2-5, then ellipsis, then last
                    for (let i = 2; i <= 5; i++) {
                      pages.push(i)
                    }
                    pages.push('ellipsis')
                    pages.push(totalPages)
                  } else if (currentPage >= totalPages - 3) {
                    // Show first, ellipsis, then last 5 pages
                    pages.push('ellipsis')
                    for (let i = totalPages - 4; i <= totalPages; i++) {
                      pages.push(i)
                    }
                  } else {
                    // Show first, ellipsis, current-1, current, current+1, ellipsis, last
                    pages.push('ellipsis')
                    for (let i = currentPage - 1; i <= currentPage + 1; i++) {
                      pages.push(i)
                    }
                    pages.push('ellipsis')
                    pages.push(totalPages)
                  }
                }

                return pages.map((page, index) => {
                  if (page === 'ellipsis') {
                    return (
                      <PaginationItem key={`ellipsis-${index}`}>
                        <PaginationEllipsis />
                      </PaginationItem>
                    )
                  }

                  return (
                    <PaginationItem key={page}>
                      <PaginationLink
                        href="#"
                        onClick={(e) => {
                          e.preventDefault()
                          handlePageChange(page)
                        }}
                        isActive={currentPage === page}
                        className="cursor-pointer"
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  )
                })
              })()}

              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault()
                    if (offset + limit < total) {
                      handlePageChange(currentPage + 1)
                    }
                  }}
                  className={offset + limit >= total ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  )
}

