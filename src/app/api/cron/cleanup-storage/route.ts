import { NextResponse } from 'next/server'
import { runStorageCleanup } from '@/lib/storage/cleanup'

/**
 * Cron job endpoint for storage cleanup
 * Should be called daily via Vercel Cron
 */
export async function GET(request: Request) {
  // Verify request is from Vercel Cron or has valid secret
  const vercelCronHeader = request.headers.get('x-vercel-cron')
  const authHeader = request.headers.get('authorization')
  
  // Allow if it's from Vercel Cron (secure by default)
  const isVercelCron = vercelCronHeader === '1'
  
  // Or allow if it has valid CRON_SECRET (for manual testing)
  const hasValidSecret = process.env.CRON_SECRET && 
    authHeader === `Bearer ${process.env.CRON_SECRET}`
  
  if (!isVercelCron && !hasValidSecret && process.env.CRON_SECRET) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
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

