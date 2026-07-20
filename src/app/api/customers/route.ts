import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/helpers'

type CustomersResult = {
  customers: unknown[]
  total: number
}

export async function GET(request: Request) {
  try {
    const { supabase } = await requireAuth()

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const limitRaw = parseInt(searchParams.get('limit') || '50', 10)
    const offsetRaw = parseInt(searchParams.get('offset') || '0', 10)
    const limit = Number.isNaN(limitRaw) ? 50 : Math.max(1, Math.min(limitRaw, 100))
    const offset = Number.isNaN(offsetRaw) ? 0 : Math.max(0, offsetRaw)

    const sanitized = search ? search.replace(/[%_,.()"'\\]/g, '') : ''

    // Grouping, search, and pagination happen in Postgres so the result is not
    // capped by PostgREST's 1000-row response limit.
    const { data, error } = await supabase.rpc('get_customers_grouped', {
      p_search: sanitized || undefined,
      p_limit: limit,
      p_offset: offset,
    })

    if (error) {
      console.error('Customers query error:', error.message)
      return NextResponse.json(
        { error: 'Failed to fetch customers' },
        { status: 400 }
      )
    }

    const result = (data ?? { customers: [], total: 0 }) as CustomersResult

    return NextResponse.json(
      {
        customers: result.customers ?? [],
        total: result.total ?? 0,
        limit,
        offset,
      },
      { status: 200 }
    )
  } catch {
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
