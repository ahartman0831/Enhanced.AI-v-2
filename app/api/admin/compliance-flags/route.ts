import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase-admin'
import { createSupabaseServerClient } from '@/lib/supabase-server'

/**
 * GET /api/admin/compliance-flags
 * Protected by: (a) session + dev_mode_enabled, OR (b) ADMIN_SECRET query param.
 */
export async function GET(request: NextRequest) {
  try {
    const secret = request.nextUrl.searchParams.get('secret')
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

    const limit = Math.min(parseInt(request.nextUrl.searchParams.get('limit') || '100', 10), 200)
    const offset = parseInt(request.nextUrl.searchParams.get('offset') || '0', 10)

    const supabase = createSupabaseAdminClient()
    const { data, error } = await supabase
      .from('compliance_flags')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('[Compliance] Fetch error:', error)
      return NextResponse.json({ error: 'Failed to fetch flags' }, { status: 500 })
    }

    return NextResponse.json({ flags: data, limit, offset })
  } catch (err) {
    console.error('[Compliance] Admin API error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
