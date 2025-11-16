import { createClient } from '@/lib/supabase/server'
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
    await requireAuth()
    const supabase = await createClient()
    const { id } = await params

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
      return NextResponse.json(
        { error: error.message },
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
    const { user } = await requireAuth()
    const supabase = await createClient()
    const { id } = await params

    const body = await request.json()

    // Update job
    const { data, error } = await supabase
      .from('jobs')
      .update({
        ...body,
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
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
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
    const { user } = await requireAuth()
    const supabase = await createClient()
    const { id } = await params

    // Fetch job to get file paths and details before deletion
    const { data: job } = await supabase
      .from('jobs')
      .select('job_number, customer_name, before_photos, after_photos, invoice_file_path')
      .eq('id', id)
      .is('deleted_at', null)
      .single()

    // Soft delete
    const { error } = await supabase
      .from('jobs')
      .update({
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .is('deleted_at', null)

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Job not found' },
          { status: 404 }
        )
      }
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    // Delete associated files from storage (non-blocking)
    if (job) {
      const filesToDelete: string[] = []
      if (job.before_photos) filesToDelete.push(...job.before_photos)
      if (job.after_photos) filesToDelete.push(...job.after_photos)
      if (job.invoice_file_path) filesToDelete.push(job.invoice_file_path)

      // Delete photos
      if (job.before_photos?.length || job.after_photos?.length) {
        const allPhotos = [
          ...(job.before_photos || []),
          ...(job.after_photos || []),
        ]
        deleteStorageFiles(allPhotos, 'job-photos').catch((err) => {
          console.error('Failed to delete photos:', err)
        })
      }

      // Delete invoice file
      if (job.invoice_file_path) {
        deleteStorageFile(job.invoice_file_path, 'invoices').catch((err) => {
          console.error('Failed to delete invoice:', err)
        })
      }
    }

    // Log audit event (using admin client to bypass RLS)
    const adminClient = createAdminClient()
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

