import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/helpers'
import { deleteStorageFiles, deleteStorageFile } from '@/lib/storage/delete'
import { headers } from 'next/headers'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authPromise = requireAuth()
    const paramsPromise = params
    const { supabase } = await authPromise
    const { id } = await paramsPromise

    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Job not found' },
          { status: 404 }
        )
      }
      console.error('Job fetch error:', error.message)
      return NextResponse.json(
        { error: 'Failed to fetch job' },
        { status: 400 }
      )
    }

    return NextResponse.json({ job: data }, { status: 200 })
  } catch {
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authPromise = requireAuth()
    const paramsPromise = params
    const { user, supabase } = await authPromise
    const { id } = await paramsPromise

    const body = await request.json()

    // Prevent job_number from being changed - it's auto-generated and must remain unique
    const { job_number, ...updateData } = body
    if (job_number !== undefined) {
      return NextResponse.json(
        { error: 'Job number cannot be changed. It is auto-generated and must remain unique.' },
        { status: 400 }
      )
    }

    // If photos or invoice are being updated, fetch current values to clean up removed files
    const isUpdatingPhotos =
      'before_photos' in updateData || 'after_photos' in updateData
    const isUpdatingInvoice = 'invoice_file_path' in updateData
    let oldBeforePhotos: string[] = []
    let oldAfterPhotos: string[] = []
    let oldInvoicePath: string | null = null

    if (isUpdatingPhotos || isUpdatingInvoice) {
      const { data: current } = await supabase
        .from('jobs')
        .select('before_photos, after_photos, invoice_file_path')
        .eq('id', id)
        .is('deleted_at', null)
        .single()

      if (current) {
        oldBeforePhotos = current.before_photos || []
        oldAfterPhotos = current.after_photos || []
        oldInvoicePath = current.invoice_file_path || null
      }
    }

    // Update job
    const { data, error } = await supabase
      .from('jobs')
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .is('deleted_at', null)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Job not found' },
          { status: 404 }
        )
      }
      console.error('Job update error:', error.message)
      return NextResponse.json(
        { error: 'Failed to update job' },
        { status: 400 }
      )
    }

    // Delete removed photos from storage (fire-and-forget so it doesn't slow down the response)
    if (isUpdatingPhotos) {
      const newBeforePhotos: string[] = updateData.before_photos || []
      const newAfterPhotos: string[] = updateData.after_photos || []
      const newPhotosSet = new Set([...newBeforePhotos, ...newAfterPhotos])

      const removedPhotos = [
        ...oldBeforePhotos.filter((url) => !newPhotosSet.has(url)),
        ...oldAfterPhotos.filter((url) => !newPhotosSet.has(url)),
      ]

      if (removedPhotos.length > 0) {
        deleteStorageFiles(removedPhotos, 'job-photos').catch((err) =>
          console.error('Failed to delete removed photos from storage:', err)
        )
      }
    }

    // Delete old invoice from storage when replaced or removed
    if (isUpdatingInvoice && oldInvoicePath) {
      const newInvoicePath = updateData.invoice_file_path || null
      if (newInvoicePath !== oldInvoicePath) {
        deleteStorageFile(oldInvoicePath, 'invoices').catch((err) =>
          console.error('Failed to delete old invoice from storage:', err)
        )
      }
    }

    // Log audit event (using admin client to bypass RLS)
    const adminClient = createAdminClient()
    const headersList = await headers()
    await adminClient.from('audit_log').insert({
      user_id: user.id,
      action: 'job.updated',
      resource_type: 'job',
      resource_id: id,
      details: {
        job_number: data.job_number,
        customer_name: data.customer_name,
        changes: body,
      },
      ip_address: headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || null,
      user_agent: headersList.get('user-agent') || null,
    })

    return NextResponse.json({ job: data }, { status: 200 })
  } catch {
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authPromise = requireAuth()
    const paramsPromise = params
    const { user, supabase } = await authPromise
    const { id } = await paramsPromise

    // Fetch job to get file paths and details before deletion
    const { data: job } = await supabase
      .from('jobs')
      .select('job_number, customer_name, before_photos, after_photos, invoice_file_path')
      .eq('id', id)
      .is('deleted_at', null)
      .single()

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      )
    }

    // Use admin client for storage deletion to bypass RLS (user session can be stale)
    const adminClient = createAdminClient()

    // Delete associated files from storage BEFORE deleting the DB record
    // so that if file cleanup fails, we still have the references
    try {
      if (job.before_photos?.length || job.after_photos?.length) {
        const allPhotos = [
          ...(job.before_photos || []),
          ...(job.after_photos || []),
        ]
        await deleteStorageFiles(allPhotos, 'job-photos', adminClient)
      }

      if (job.invoice_file_path) {
        await deleteStorageFile(job.invoice_file_path, 'invoices', adminClient)
      }
    } catch (err) {
      console.error('Failed to delete storage files (proceeding with job deletion):', err)
    }

    // Hard delete - permanently remove the job from the database
    const { error } = await supabase
      .from('jobs')
      .delete()
      .eq('id', id)

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Job not found' },
          { status: 404 }
        )
      }
      return NextResponse.json(
        { error: 'Failed to delete job' },
        { status: 400 }
      )
    }

    const headersList = await headers()
    await adminClient.from('audit_log').insert({
      user_id: user.id,
      action: 'job.deleted',
      resource_type: 'job',
      resource_id: id,
      details: {
        job_number: job?.job_number,
        customer_name: job?.customer_name,
      },
      ip_address: headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || null,
      user_agent: headersList.get('user-agent') || null,
    })

    return NextResponse.json(
      { message: 'Job deleted successfully' },
      { status: 200 }
    )
  } catch {
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

