import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

/**
 * Hidden route to toggle dev_mode_enabled for the current user.
 * Protected by secret query param: ?secret=DEV_TOGGLE_SECRET
 * Usage: POST /api/admin/dev-toggle?secret=your_secret
 */
export async function POST(request: NextRequest) {
  try {
    const secret = request.nextUrl.searchParams.get('secret')
    const expectedSecret = process.env.DEV_TOGGLE_SECRET

    if (!expectedSecret || secret !== expectedSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('dev_mode_enabled')
      .eq('id', user.id)
      .single()

    const current = profile?.dev_mode_enabled ?? false
    const next = !current

    const { error } = await supabase
      .from('profiles')
      .update({ dev_mode_enabled: next, updated_at: new Date().toISOString() })
      .eq('id', user.id)

    if (error) {
      return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
    }

    return NextResponse.json({
      dev_mode_enabled: next,
      message: `Dev mode ${next ? 'enabled' : 'disabled'}. Refresh the page.`,
    })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
