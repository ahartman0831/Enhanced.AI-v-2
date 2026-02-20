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
      .select('id, name, full_breakdown_json, breakdown_updated_at, aa_ratio, aromatization_score, aromatization_notes')
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
        // Merge scientific_metrics from aa_ratio and aromatization when returning cached breakdown
        let response = existing.full_breakdown_json as Record<string, unknown>
        const sciMetrics = (response.scientific_metrics as Record<string, unknown>) || {}
        if (existing.aa_ratio && !sciMetrics.aa_ratio) {
          sciMetrics.aa_ratio = existing.aa_ratio
          sciMetrics.display_text = 'Historical rodent bioassay data only — see disclaimer below'
          sciMetrics.disclaimer = (existing.aa_ratio as { disclaimer?: string })?.disclaimer ?? 'Historical rodent bioassay data (1950s–1980s) or modern in-vitro selectivity only. Does NOT predict real human muscle growth, side effects, metabolism, dose-response, aromatization, or safety. Ratios vary widely by assay method and are NOT reliable for modern compounds like SARMs. Individual variability is extreme. Educational reference only — not a ranking, recommendation, or prediction of outcomes.'
        }
        if (existing.aromatization_score != null || existing.aromatization_notes) {
          sciMetrics.aromatization = {
            score: existing.aromatization_score,
            notes: existing.aromatization_notes,
            disclaimer: 'Generalized community/literature observation only — individual responses vary dramatically. Not predictive or medical advice.',
          }
        }
        if (Object.keys(sciMetrics).length > 0) {
          response = { ...response, scientific_metrics: sciMetrics }
        }
        return NextResponse.json(response)
      }

      const grokResult = await callGrok({
        promptName: 'full_compound_breakdown',
        userId: user.id,
        feature: 'compound-breakdown',
        variables: {
          compoundName: existing.name,
          aaRatioJson: existing.aa_ratio ? JSON.stringify(existing.aa_ratio) : 'null',
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
      const row = parseBreakdownForDb(breakdown, existing.name)

      // Merge aromatization from DB into response
      if (existing.aromatization_score != null || existing.aromatization_notes) {
        const sciMetrics = (breakdown.scientific_metrics as Record<string, unknown>) || {}
        sciMetrics.aromatization = {
          score: existing.aromatization_score,
          notes: existing.aromatization_notes,
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
        .eq('id', existing.id)

      return NextResponse.json(breakdown)
    }

    const grokResult = await callGrok({
      promptName: 'full_compound_breakdown',
      userId: user.id,
      feature: 'compound-breakdown',
      variables: {
        compoundName: name,
        aaRatioJson: 'null',
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
    const row = parseBreakdownForDb(breakdown, name)

    await admin.from('compounds').insert({
      name: row.name,
      category: row.category,
      risk_score: row.risk_score,
      affected_systems: row.affected_systems,
      key_monitoring_markers: row.key_monitoring_markers,
      what_it_is: row.what_it_is,
      common_uses: row.common_uses,
      nutrition_impact_summary: row.nutrition_impact_summary,
      side_effects: row.side_effects,
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
