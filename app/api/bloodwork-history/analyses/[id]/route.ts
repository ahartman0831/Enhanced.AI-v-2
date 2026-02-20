import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { getSubscriptionTier, requireTier } from '@/lib/subscription-gate'

export const dynamic = 'force-dynamic'

/** Get a single saved analysis */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Analysis not found' }, { status: 404 })
    }

    return NextResponse.json({
      id: data.id,
      trendSummary: data.trend_summary ?? '',
      patternNotes: Array.isArray(data.pattern_notes) ? data.pattern_notes : [],
      markerInsights: Array.isArray(data.marker_insights) ? data.marker_insights : [],
      createdAt: data.created_at,
      disclaimer: 'Educational only—not medical advice. Individual variability high. Consult a physician.',
    })
  } catch (err) {
    console.error('[BloodworkHistoryAnalysis] GET Error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/** Delete a saved analysis */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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

    const { error } = await supabase
      .from('bloodwork_history_analyses')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('[BloodworkHistoryAnalysis] Delete error:', error)
      return NextResponse.json({ error: 'Failed to delete analysis' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[BloodworkHistoryAnalysis] DELETE Error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
