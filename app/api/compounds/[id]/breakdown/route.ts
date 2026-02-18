import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { createSupabaseAdminClient } from '@/lib/supabase-admin'
import { callGrok } from '@/lib/grok'
import { parseBreakdownForDb } from '@/lib/compound-breakdown'

const CACHE_DAYS = 30

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    if (!id) {
      return NextResponse.json({ error: 'Compound ID required' }, { status: 400 })
    }

    const supabase = await createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const admin = createSupabaseAdminClient()

    const { data: compound, error: fetchError } = await admin
      .from('compounds')
      .select('id, name, full_breakdown_json, breakdown_updated_at')
      .eq('id', id)
      .single()

    if (fetchError || !compound) {
      return NextResponse.json({ error: 'Compound not found' }, { status: 404 })
    }

    const now = new Date()
    const cacheCutoff = new Date(now.getTime() - CACHE_DAYS * 24 * 60 * 60 * 1000)
    const breakdownUpdatedAt = compound.breakdown_updated_at
      ? new Date(compound.breakdown_updated_at)
      : null

    const cacheValid =
      compound.full_breakdown_json &&
      breakdownUpdatedAt &&
      breakdownUpdatedAt > cacheCutoff

    if (cacheValid && compound.full_breakdown_json) {
      // Record view for anonymized aggregation (fire-and-forget)
      supabase
        .from('compound_breakdown_views')
        .insert({ user_id: user.id, compound_id: id })
        .then(() => {})
        .catch(() => {})
      return NextResponse.json(compound.full_breakdown_json)
    }

    const grokResult = await callGrok({
      promptName: 'full_compound_breakdown',
      userId: user.id,
      feature: 'compound-breakdown',
      variables: { compoundName: compound.name },
    })

    if (!grokResult.success) {
      return NextResponse.json(
        { error: grokResult.error || 'Failed to generate breakdown' },
        { status: 500 }
      )
    }

    const breakdown = grokResult.data as Record<string, unknown>
    const row = parseBreakdownForDb(breakdown, compound.name)

    await admin
      .from('compounds')
      .update({
        full_breakdown_json: breakdown,
        breakdown_updated_at: now.toISOString(),
        key_monitoring_markers: row.key_monitoring_markers,
        affected_systems: row.affected_systems,
      })
      .eq('id', id)

    // Record view for anonymized aggregation (fire-and-forget)
    supabase
      .from('compound_breakdown_views')
      .insert({ user_id: user.id, compound_id: id })
      .then(() => {})
      .catch(() => {})

    return NextResponse.json(breakdown)
  } catch (err) {
    console.error('Compound breakdown API error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
