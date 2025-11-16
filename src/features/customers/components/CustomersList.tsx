'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CustomerSearch } from './CustomerSearch'
import { CustomersTable } from './CustomersTable'

export function CustomersList() {
  const [search, setSearch] = useState('')

  const handleClear = () => {
    setSearch('')
  }

  return (
    <div className="space-y-4">
      <CustomerSearch
        search={search}
        onSearchChange={setSearch}
        onClear={handleClear}
      />

      <Card>
        <CardHeader>
          <CardTitle>All Customers</CardTitle>
        </CardHeader>
        <CardContent className="min-h-[400px]">
          <CustomersTable search={search} />
        </CardContent>
      </Card>
    </div>
  )
}

