import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { getSubscriptionTier, requireTier } from '@/lib/subscription-gate'

export const dynamic = 'force-dynamic'

/**
 * Returns latest protocol, bloodwork, and photos for Results Forecaster modal prefill.
 * Used alongside /api/side-effects for compounds/dosages/side effects.
 */
export async function GET() {
  try {
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const tier = await getSubscriptionTier(supabase, user.id)
    const gate = requireTier(tier, 'pro')
    if (!gate.allowed) {
      return gate.response
    }

    const [latestBloodwork, latestPhotos] = await Promise.all([
      supabase
        .from('bloodwork_reports')
        .select('id, report_date, raw_json')
        .eq('user_id', user.id)
        .order('report_date', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('photo_reports')
        .select('id, front_url, side_url, back_url, analysis, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ])

    return NextResponse.json({
      bloodwork: latestBloodwork.data ?? null,
      photos: latestPhotos.data ?? null,
    })
  } catch (error) {
    console.error('[forecast-data] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
