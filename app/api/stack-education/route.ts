// STACK_EDUCATION_FEATURE START
import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { getSubscriptionTier, requireTier } from '@/lib/subscription-gate'
import { createSupabaseAdminClient } from '@/lib/supabase-admin'
import { callGrok } from '@/lib/grok'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const tier = await getSubscriptionTier(supabase, user.id)
    const gate = requireTier(tier, 'pro')
    if (!gate.allowed) {
      return gate.response
    }

    const body = await request.json().catch(() => ({}))
    const { goals, experience, riskTolerance, bloodwork, selectedCompounds } = body

    const selected = Array.isArray(selectedCompounds) ? selectedCompounds : []
    if (selected.length === 0) {
      return NextResponse.json(
        { error: 'Select at least one compound to analyze' },
        { status: 400 }
      )
    }

    const admin = createSupabaseAdminClient()
    const { data: dbCompounds, error: compoundsError } = await admin
      .from('compounds')
      .select('name')
      .order('name')

    if (compoundsError) {
      console.error('[Stack Education] Compounds fetch error:', compoundsError)
      return NextResponse.json(
        { error: 'Failed to load compound database' },
        { status: 500 }
      )
    }

    const validNames = new Set((dbCompounds || []).map((c) => c.name))
    const invalid = selected.filter((n) => typeof n === 'string' && !validNames.has(n))
    if (invalid.length > 0) {
      return NextResponse.json(
        { error: `Compounds not found in database: ${invalid.join(', ')}` },
        { status: 400 }
      )
    }

    const selectedNames = selected.filter((n): n is string => typeof n === 'string' && validNames.has(n))
    const selectedCompoundsJson = JSON.stringify(selectedNames)

    // Fetch educational compound summaries from DB (order preserved by selection)
    const { data: compoundRows } = await admin
      .from('compounds')
      .select('id, name, category, common_uses, risk_score, affected_systems, key_monitoring_markers, nutrition_impact_summary, what_it_is, side_effects, sources, aromatization_score, aromatization_notes, aa_ratio, created_at, updated_at, breakdown_updated_at')
      .in('name', selectedNames)

    const compoundSummaries = (compoundRows || [])
      .sort((a, b) => selectedNames.indexOf(a.name) - selectedNames.indexOf(b.name))
      .map((c) => ({
        id: c.id,
        name: c.name,
        category: c.category ?? '',
        common_uses: c.common_uses ?? null,
        risk_score: c.risk_score ?? 0,
        affected_systems: c.affected_systems ?? [],
        key_monitoring_markers: c.key_monitoring_markers ?? [],
        nutrition_impact_summary: c.nutrition_impact_summary ?? null,
        what_it_is: c.what_it_is ?? null,
        side_effects: c.side_effects ?? null,
        sources: c.sources ?? null,
        aromatization_score: c.aromatization_score ?? null,
        aromatization_notes: c.aromatization_notes ?? null,
        aa_ratio: c.aa_ratio ?? null,
        created_at: c.created_at ?? null,
        updated_at: c.updated_at ?? null,
        breakdown_updated_at: c.breakdown_updated_at ?? null,
        notes: 'Generalized patterns from database. Individual risks/responses vary dramatically — not medical advice.',
      }))

    const compoundSummariesJson = JSON.stringify(compoundSummaries)

    const variables: Record<string, string> = {
      goals: goals ? String(goals) : 'Not provided',
      experience: experience ? String(experience) : 'Not provided',
      riskTolerance: riskTolerance ? String(riskTolerance) : 'Not provided',
      selected_compounds: selectedCompoundsJson,
      bloodwork: bloodwork || 'Not provided',
      compound_summaries_json: compoundSummariesJson,
    }

    const grokResult = await callGrok({
      promptName: 'stack_education',
      userId: user.id,
      feature: 'stack-education',
      variables,
      temperature: 0.45
    })

    if (!grokResult.success) {
      const status = grokResult._complianceBlocked ? 422 : 500
      return NextResponse.json(
        { error: grokResult.error || 'Failed to generate analysis', flags: grokResult._complianceFlags },
        { status }
      )
    }

    // Inject compound_summaries from DB (authoritative, before Grok output)
    const data = grokResult.data as Record<string, unknown>
    const merged = {
      ...data,
      compound_summaries: compoundSummaries,
      user_responsibility:
        'You selected this combination. This output provides educational patterns only. You are solely responsible for any health decisions. Never use this information as medical advice or a substitute for professional care.',
    }

    return NextResponse.json({
      success: true,
      data: merged,
      tokensUsed: grokResult.tokensUsed
    })
  } catch (error) {
    console.error('[Stack Education] API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
// STACK_EDUCATION_FEATURE END
