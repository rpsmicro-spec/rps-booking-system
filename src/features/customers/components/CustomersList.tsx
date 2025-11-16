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
import { useIsMobile } from '@/hooks/use-mobile'

export function CustomersList() {
  const isMobile = useIsMobile()
  const [search, setSearch] = useState('')
  const [offset, setOffset] = useState(0)
  const [total, setTotal] = useState(0)
  const limit = isMobile ? 20 : 50

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
        <div className="flex flex-col gap-3 sm:gap-4">
          <p className="text-xs sm:text-sm text-muted-foreground text-center">
            Showing {offset + 1}-{Math.min(offset + limit, total)} of {total} customers
          </p>
          <Pagination>
            <PaginationContent className="flex-wrap">
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
                const maxPagesToShow = isMobile ? 3 : 7

                if (totalPages <= maxPagesToShow) {
                  // Show all pages
                  for (let i = 1; i <= totalPages; i++) {
                    pages.push(i)
                  }
                } else {
                  // Show first page
                  pages.push(1)

                  if (currentPage <= 4) {
                    // Show pages 2-5, then ellipsis, then last
                    const endPage = maxPagesToShow === 3 ? 3 : 5
                    for (let i = 2; i <= endPage; i++) {
                      pages.push(i)
                    }
                    if (maxPagesToShow > 3) {
                      pages.push('ellipsis')
                      pages.push(totalPages)
                    }
                  } else if (currentPage >= totalPages - 3) {
                    // Show first, ellipsis, then last pages
                    if (maxPagesToShow > 3) {
                      pages.push('ellipsis')
                    }
                    const startPage = maxPagesToShow === 3 
                      ? Math.max(2, totalPages - 1)
                      : totalPages - 4
                    for (let i = startPage; i <= totalPages; i++) {
                      pages.push(i)
                    }
                  } else {
                    // Show first, ellipsis, current-1, current, current+1, ellipsis, last
                    if (maxPagesToShow > 3) {
                      pages.push('ellipsis')
                    }
                    for (let i = currentPage - 1; i <= currentPage + 1; i++) {
                      pages.push(i)
                    }
                    if (maxPagesToShow > 3) {
                      pages.push('ellipsis')
                      pages.push(totalPages)
                    }
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
                        className="cursor-pointer text-xs sm:text-sm min-w-[2rem] sm:min-w-[2.5rem]"
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

