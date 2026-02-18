import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { createSupabaseAdminClient } from '@/lib/supabase-admin'
import { callGrok } from '@/lib/grok'
import { parseBreakdownForDb } from '@/lib/compound-breakdown'

const CACHE_DAYS = 30

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const name = typeof body?.name === 'string' ? body.name.trim() : ''

    if (!name) {
      return NextResponse.json({ error: 'Compound name required' }, { status: 400 })
    }

    const admin = createSupabaseAdminClient()

    const { data: existing } = await admin
      .from('compounds')
      .select('id, name, full_breakdown_json, breakdown_updated_at')
      .ilike('name', name)
      .limit(1)
      .maybeSingle()

    const now = new Date()
    const cacheCutoff = new Date(now.getTime() - CACHE_DAYS * 24 * 60 * 60 * 1000)

    if (existing) {
      const breakdownUpdatedAt = existing.breakdown_updated_at
        ? new Date(existing.breakdown_updated_at)
        : null
      const cacheValid =
        existing.full_breakdown_json &&
        breakdownUpdatedAt &&
        breakdownUpdatedAt > cacheCutoff

      if (cacheValid && existing.full_breakdown_json) {
        return NextResponse.json(existing.full_breakdown_json)
      }

      const grokResult = await callGrok({
        promptName: 'full_compound_breakdown',
        userId: user.id,
        feature: 'compound-breakdown',
        variables: { compoundName: existing.name },
      })

      if (!grokResult.success) {
        return NextResponse.json(
          { error: grokResult.error || 'Failed to generate breakdown' },
          { status: 500 }
        )
      }

      const breakdown = grokResult.data as Record<string, unknown>
      const row = parseBreakdownForDb(breakdown, existing.name)

      await admin
        .from('compounds')
        .update({
          full_breakdown_json: breakdown,
          breakdown_updated_at: now.toISOString(),
          key_monitoring_markers: row.key_monitoring_markers,
          affected_systems: row.affected_systems,
        })
        .eq('id', existing.id)

      return NextResponse.json(breakdown)
    }

    const grokResult = await callGrok({
      promptName: 'full_compound_breakdown',
      userId: user.id,
      feature: 'compound-breakdown',
      variables: { compoundName: name },
    })

    if (!grokResult.success) {
      return NextResponse.json(
        { error: grokResult.error || 'Failed to generate breakdown' },
        { status: 500 }
      )
    }

    const breakdown = grokResult.data as Record<string, unknown>
    const row = parseBreakdownForDb(breakdown, name)

    await admin.from('compounds').insert({
      name: row.name,
      category: row.category,
      risk_score: row.risk_score,
      affected_systems: row.affected_systems,
      key_monitoring_markers: row.key_monitoring_markers,
      full_breakdown_json: row.full_breakdown_json,
      breakdown_updated_at: row.breakdown_updated_at,
    })

    return NextResponse.json(breakdown)
  } catch (err) {
    console.error('Compound breakdown-by-name API error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
