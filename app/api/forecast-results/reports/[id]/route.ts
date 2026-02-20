import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { getSubscriptionTier, requireTier } from '@/lib/subscription-gate'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    if (!id) {
      return NextResponse.json({ error: 'Forecast ID required' }, { status: 400 })
    }

    const supabase = await createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { data: profile } = await supabase.from('profiles').select('dev_mode_enabled').eq('id', user.id).single()
    const devModeEnabled = profile?.dev_mode_enabled ?? false
    if (!devModeEnabled) {
      const tier = await getSubscriptionTier(supabase, user.id)
      const gate = requireTier(tier, 'pro')
      if (!gate.allowed) {
        return gate.response
      }
    }

    const { error } = await supabase
      .from('enhanced_protocols')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('Delete forecast error:', error)
      return NextResponse.json({ error: 'Failed to delete forecast' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Delete forecast API error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
