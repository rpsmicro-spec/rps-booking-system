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
  
  const isVercelCron = vercelCronHeader === '1'

  const hasValidSecret =
    Boolean(process.env.CRON_SECRET) &&
    authHeader === `Bearer ${process.env.CRON_SECRET}`

  // When CRON_SECRET is configured, require it — the x-vercel-cron header is
  // not a proven-unspoofable signal, and this endpoint deletes files. The
  // header alone is accepted only when no secret is configured (Vercel sends
  // the bearer token automatically once the CRON_SECRET env var is set).
  const isAuthorized = process.env.CRON_SECRET ? hasValidSecret : isVercelCron

  if (!isAuthorized) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    const result = await runStorageCleanup()

    // Log so it shows in Vercel Dashboard → Logs
    console.log('[cron/cleanup-storage]', {
      success: true,
      deletedFiles: result.deletedFiles,
      errors: result.errors,
      details: result.details,
    })

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

