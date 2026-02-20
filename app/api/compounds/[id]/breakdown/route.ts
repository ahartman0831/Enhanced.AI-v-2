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
      .select('id, name, full_breakdown_json, breakdown_updated_at, aa_ratio, aromatization_score, aromatization_notes')
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
      // Merge scientific_metrics from aa_ratio and aromatization when returning cached breakdown
      let response = compound.full_breakdown_json as Record<string, unknown>
      const sciMetrics = (response.scientific_metrics as Record<string, unknown>) || {}
      if (compound.aa_ratio && !sciMetrics.aa_ratio) {
        sciMetrics.aa_ratio = compound.aa_ratio
        sciMetrics.display_text = 'Historical rodent bioassay data only — see disclaimer below'
        sciMetrics.disclaimer = (compound.aa_ratio as { disclaimer?: string })?.disclaimer ?? 'Historical rodent bioassay data (1950s–1980s) or modern in-vitro selectivity only. Does NOT predict real human muscle growth, side effects, metabolism, dose-response, aromatization, or safety. Ratios vary widely by assay method and are NOT reliable for modern compounds like SARMs. Individual variability is extreme. Educational reference only — not a ranking, recommendation, or prediction of outcomes.'
      }
      if (compound.aromatization_score != null || compound.aromatization_notes) {
        sciMetrics.aromatization = {
          score: compound.aromatization_score,
          notes: compound.aromatization_notes,
          disclaimer: 'Generalized community/literature observation only — individual responses vary dramatically. Not predictive or medical advice.',
        }
      }
      if (Object.keys(sciMetrics).length > 0) {
        response = { ...response, scientific_metrics: sciMetrics }
      }
      // Record view for anonymized aggregation (fire-and-forget)
      void supabase
        .from('compound_breakdown_views')
        .insert({ user_id: user.id, compound_id: id })
        .then(() => {}, () => {})
      return NextResponse.json(response)
    }

    const grokResult = await callGrok({
      promptName: 'full_compound_breakdown',
      userId: user.id,
      feature: 'compound-breakdown',
      variables: {
        compoundName: compound.name,
        aaRatioJson: compound.aa_ratio ? JSON.stringify(compound.aa_ratio) : 'null',
      },
    })

    if (!grokResult.success) {
      const status = grokResult._complianceBlocked ? 422 : 500
      return NextResponse.json(
        { error: grokResult.error || 'Failed to generate breakdown', flags: grokResult._complianceFlags },
        { status }
      )
    }

    const breakdown = grokResult.data as Record<string, unknown>
    const row = parseBreakdownForDb(breakdown, compound.name)

    // Merge aromatization from DB into response
    if (compound.aromatization_score != null || compound.aromatization_notes) {
      const sciMetrics = (breakdown.scientific_metrics as Record<string, unknown>) || {}
      sciMetrics.aromatization = {
        score: compound.aromatization_score,
        notes: compound.aromatization_notes,
        disclaimer: 'Generalized community/literature observation only — individual responses vary dramatically. Not predictive or medical advice.',
      }
      breakdown.scientific_metrics = sciMetrics
    }

    await admin
      .from('compounds')
      .update({
        full_breakdown_json: breakdown,
        breakdown_updated_at: now.toISOString(),
        key_monitoring_markers: row.key_monitoring_markers,
        affected_systems: row.affected_systems,
        what_it_is: row.what_it_is,
        common_uses: row.common_uses,
        nutrition_impact_summary: row.nutrition_impact_summary,
        side_effects: row.side_effects,
      })
      .eq('id', id)

    // Record view for anonymized aggregation (fire-and-forget)
    void supabase
      .from('compound_breakdown_views')
      .insert({ user_id: user.id, compound_id: id })
      .then(() => {}, () => {})

    return NextResponse.json(breakdown)
  } catch (err) {
    console.error('Compound breakdown API error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
