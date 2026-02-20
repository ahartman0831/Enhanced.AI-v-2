import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase-admin'
import { createSupabaseServerClient } from '@/lib/supabase-server'

/**
 * PATCH /api/admin/compliance-flags/[id]
 * Mark as acknowledged. Protected by: session + dev_mode_enabled, OR ADMIN_SECRET.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const secret = request.nextUrl.searchParams.get('secret') || request.headers.get('x-admin-secret')
    const expectedSecret = process.env.ADMIN_SECRET || process.env.DEV_TOGGLE_SECRET
    const useSecret = expectedSecret && secret === expectedSecret

    if (!useSecret) {
      const supabase = await createSupabaseServerClient()
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }
      const { data: profile } = await supabase.from('profiles').select('dev_mode_enabled').eq('id', user.id).single()
      if (!profile?.dev_mode_enabled) {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
      }
    }

    const { id } = await params
    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 })
    }

    const supabase = createSupabaseAdminClient()
    const { data, error } = await supabase
      .from('compliance_flags')
      .update({
        acknowledged: true,
        acknowledged_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('[Compliance] Update error:', error)
      return NextResponse.json({ error: 'Failed to update flag' }, { status: 500 })
    }

    return NextResponse.json({ success: true, flag: data })
  } catch (err) {
    console.error('[Compliance] Admin PATCH error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
