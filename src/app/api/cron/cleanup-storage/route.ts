import { NextResponse } from 'next/server'
import { runStorageCleanup } from '@/lib/storage/cleanup'

/**
 * Cron job endpoint for storage cleanup
 * Should be called daily via Vercel Cron
 */
export async function GET(request: Request) {
  // Verify cron secret if set
  const authHeader = request.headers.get('authorization')
  if (process.env.CRON_SECRET) {
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
  }

  try {
    const result = await runStorageCleanup()

    return NextResponse.json(
      {
        success: true,
        message: 'Storage cleanup completed',
        result,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Storage cleanup failed:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

