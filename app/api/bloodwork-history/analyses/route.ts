import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { getSubscriptionTier, requireTier } from '@/lib/subscription-gate'

export const dynamic = 'force-dynamic'

/** List saved bloodwork history analyses */
export async function GET() {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const tier = await getSubscriptionTier(supabase, user.id)
    const gate = requireTier(tier, 'elite')
    if (!gate.allowed) {
      return gate.response
    }

    const { data, error } = await supabase
      .from('bloodwork_history_analyses')
      .select('id, trend_summary, pattern_notes, marker_insights, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      console.error('[BloodworkHistoryAnalyses] Fetch error:', error)
      return NextResponse.json({ error: 'Failed to fetch analyses' }, { status: 500 })
    }

    const analyses = (data || []).map((row) => ({
      id: row.id,
      trendSummary: row.trend_summary ?? '',
      patternNotes: Array.isArray(row.pattern_notes) ? row.pattern_notes : [],
      markerInsights: Array.isArray(row.marker_insights) ? row.marker_insights : [],
      createdAt: row.created_at,
    }))

    return NextResponse.json({ analyses })
  } catch (err) {
    console.error('[BloodworkHistoryAnalyses] Error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
