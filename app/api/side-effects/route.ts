import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { getSubscriptionTier, requireTier } from '@/lib/subscription-gate'
import { createSupabaseAdminClient } from '@/lib/supabase-admin'
import { callGrok } from '@/lib/grok'
import { validateSideEffectAnalysis } from '@/lib/side-effect-schema'
import {
  containsHighRiskSynergy,
  dosesAppearElevated,
  computeHarmReductionContext,
} from '@/lib/harm-reduction'
import { computeCycleAwarenessContext } from '@/lib/cycle-awareness'
import { computeHptaSuppressionContext } from '@/lib/hpta-suppression'

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const tier = await getSubscriptionTier(supabase, user.id)
    const gate = requireTier(tier, 'pro')
    if (!gate.allowed) {
      return gate.response
    }

    const { data, error } = await supabase
      .from('side_effect_logs')
      .select('id, compounds, dosages, side_effects, additional_supplements, analysis_result, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      console.error('Error fetching side effect logs:', error)
      return NextResponse.json(
        { error: 'Failed to fetch analyses' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: data ?? [] })
  } catch (error) {
    console.error('Side effects GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function matchesCompound(searchName: string, compoundName: string): boolean {
  const s = searchName.toLowerCase().trim()
  const c = compoundName.toLowerCase()
  if (s === c) return true
  if (c.includes(s)) return true
  if (s.includes(c)) return true
  const cBase = c.split(/[(\[]/)[0].trim()
  return s === cBase || cBase.includes(s) || s.includes(cBase)
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const supabase = await createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const tier = await getSubscriptionTier(supabase, user.id)
    const gate = requireTier(tier, 'pro')
    if (!gate.allowed) {
      return gate.response
    }

    // Parse request body
    const body = await request.json()
    const { compounds, dosages, sideEffects, additionalSupplements } = body

    if (!compounds || compounds.length === 0 || !sideEffects || sideEffects.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: compounds and sideEffects' },
        { status: 400 }
      )
    }

    const admin = createSupabaseAdminClient()

    // Determine which compounds are NOT in the database + fetch risk scores for harm-reduction
    let compoundsNotInDb: string[] = []
    const compoundRiskScores = new Map<string, number>()
    try {
      const { data: allCompounds } = await admin
        .from('compounds')
        .select('id, name, risk_score')
      const used = new Set<string>()
      for (const searchName of compounds) {
        if (!searchName || typeof searchName !== 'string') continue
        const found = allCompounds?.find(
          (c: { id: string; name: string; risk_score?: number }) =>
            matchesCompound(searchName, c.name) && !used.has(c.id)
        )
        if (found) {
          used.add(found.id)
          compoundRiskScores.set(searchName, (found as { risk_score?: number }).risk_score ?? 5)
        } else {
          compoundsNotInDb.push(searchName)
          compoundRiskScores.set(searchName, 5) // assume mid-range for unknown
        }
      }
    } catch {
      compoundsNotInDb = compounds
      compounds.forEach((c: string) => compoundRiskScores.set(c, 5))
    }

    // Harm-reduction: detect elevated patterns (never blocks, only enriches context)
    let riskScore = 0
    for (const c of compounds as string[]) {
      riskScore += compoundRiskScores.get(c) ?? 5
    }
    if (containsHighRiskSynergy(compounds as string[])) riskScore += 8
    if (dosesAppearElevated(dosages, (compounds as string[]).length)) riskScore += 6
    const isElevated = riskScore > 20
    const harmReductionContext = computeHarmReductionContext({
      compounds: compounds as string[],
      compoundRiskScores,
      dosages,
      isElevated,
    })

    // Cycle awareness: auto-include prolactin/estrogen ancillaries based on compound patterns
    const cycleAwarenessContext = computeCycleAwarenessContext(compounds as string[])

    // HPTA suppression: educational observations when suppressors present without Test base
    const hptaSuppressionContext = computeHptaSuppressionContext(compounds as string[])

    // Pre-filter relevant ancillaries from DB based on reported side effects + cycle patterns
    const SIDE_EFFECT_SEARCH_TERMS: Record<string, string[]> = {
      'hair loss': ['hair', 'dht', 'finasteride', 'minoxidil', 'dutasteride', 'ru58841', 'ketoconazole'],
      'gynecomastia': ['estrogen', 'gyno', 'aromatase', 'nolvadex', 'clomid', 'arimidex', 'letrozole', 'dim'],
      'gyno': ['estrogen', 'gyno', 'aromatase', 'nolvadex', 'clomid', 'arimidex', 'letrozole', 'dim'],
      'insomnia': ['sleep', 'melatonin', 'cortisol'],
      'acne': ['acne', 'androgen', 'dht', 'dermatological'],
      'lethargy': ['fatigue', 'thyroid', 't3', 't4', 'energy', 'rhodiola'],
      'fatigue': ['fatigue', 'thyroid', 't3', 't4', 'energy', 'rhodiola', 'b-vitamin'],
      'high blood pressure': ['blood pressure', 'cardiovascular', 'hawthorn'],
      'night sweats': ['estrogen', 'hormone', 'prolactin', 'sage', 'cabergoline'],
      'mood changes': ['mood', 'estrogen', 'cortisol', 'ashwagandha', 'omega', 'arimidex', 'letrozole'],
      'joint pain': ['joint', 'aromatase', 'glucosamine', 'turmeric'],
      'headaches': ['headache', 'magnesium', 'blood pressure'],
      'nausea': ['nausea', 'cabergoline', 'ginger', 'prolactin'],
      'appetite changes': ['appetite', 'thyroid', 'chromium'],
      'testicle shrinkage': ['fertility', 'hcg', 'clomid', 'zinc'],
      'erectile dysfunction': ['erectile', 'cialis', 'viagra', 'levitra', 'l-arginine'],
      'libido changes': ['libido', 'prolactin', 'cabergoline', 'zinc', 'maca'],
      'increased aggression': ['mood', 'cortisol', 'ashwagandha', 'prolactin', 'cabergoline'],
      'water retention': ['estrogen', 'water', 'dandelion', 'potassium', 'arimidex', 'letrozole'],
      'liver strain': ['liver', 'milk thistle', 'nac', 'tudca', 'hepatic'],
      'cholesterol changes': ['lipid', 'cholesterol', 'niacin', 'fish oil'],
      'sleep apnea': ['sleep', 'cpap'],
    }

    let dbAncillariesContext = 'None in database for these side effects.'
    try {
      const searchTerms = new Set<string>()
      for (const se of (sideEffects as string[])) {
        const key = se.toLowerCase().trim().replace(/\s*\/.*$/, '')
        const terms = SIDE_EFFECT_SEARCH_TERMS[key] ?? Object.entries(SIDE_EFFECT_SEARCH_TERMS).find(([k]) => key.includes(k))?.[1]
        if (terms) terms.forEach((t) => searchTerms.add(t))
      }
      // Add prolactin/estrogen terms when cycle patterns suggest them
      if (cycleAwarenessContext.includes('19-nor')) searchTerms.add('prolactin').add('cabergoline')
      if (cycleAwarenessContext.includes('aromatizing')) searchTerms.add('estrogen').add('arimidex').add('letrozole')
      const { data: allAncillaries } = await admin
        .from('compounds')
        .select('name, common_uses, affected_systems, side_effects')
        .eq('category', 'Ancillary')
      if (allAncillaries && searchTerms.size > 0) {
        const combined = (a: { name?: string; common_uses?: string; side_effects?: string }) =>
          [a.name, a.common_uses, a.side_effects].join(' ').toLowerCase()
        const ancillaries = allAncillaries.filter((a) =>
          [...searchTerms].some((t) => combined(a).includes(t))
        ).slice(0, 15)
        if (ancillaries.length > 0) {
          const names = ancillaries.map((a: { name: string }) => a.name).join(', ')
          dbAncillariesContext = `PRIORITIZE these DB ancillaries in commonlyDiscussedSupports: ${names}. Use their affected_systems from: ${ancillaries
            .map((a: { name: string; common_uses?: string; affected_systems?: string[] }) =>
              `${a.name}: ${a.common_uses || 'N/A'} | Systems: ${(a.affected_systems || []).join(', ')}`
            )
            .join(' | ')}`
        }
      }
    } catch {
      // Fallback if query fails
    }

    // Prepare variables for prompt template
    const variables = {
      compounds: compounds.join(', '),
      dosages: dosages || 'No dosage information provided',
      sideEffects: sideEffects.join(', '),
      compoundsNotInDb: compoundsNotInDb.length > 0
        ? `The following compounds are NOT in our database and may be custom/experimental substances: ${compoundsNotInDb.join(', ')}. For these, use EXTRA disclaimers. Emphasize that information is general and may not apply. Always recommend professional consultation.`
        : 'All compounds are in our database.',
      dbAncillariesContext,
      harmReductionContext,
      cycleAwarenessContext,
      hptaSuppressionContext: hptaSuppressionContext || 'No HPTA suppression pattern detected.',
    }

    // Call Grok API
    const grokResult = await callGrok({
      promptName: 'side-effect-explainer',
      userId: user.id,
      variables,
      feature: 'side-effects'
    })

    if (!grokResult.success) {
      const status = grokResult._complianceBlocked ? 422 : 500
      return NextResponse.json(
        { error: grokResult.error || 'Failed to analyze side effects' },
        { status }
      )
    }

    // Validate JSON structure and block forbidden content (doses, cycles, protocols)
    const validation = validateSideEffectAnalysis(grokResult.data)
    if (!validation.success) {
      console.warn('[SideEffects] Validation failed:', validation.error)
      return NextResponse.json(
        { error: validation.error || 'Invalid analysis response' },
        { status: 500 }
      )
    }
    const validatedData = validation.data!

    // Ensure commonlyDiscussedSupports has entries (prompt requests 4–6)
    const supports = validatedData.commonlyDiscussedSupports || []
    if (supports.length < 2 && (sideEffects as string[]).length > 0) {
      console.warn('[SideEffects] Few commonlyDiscussedSupports in response – expected 4–6')
    }

    // Save analysis to side_effect_logs table
    const { data: sideEffectLog, error: dbError } = await supabase
      .from('side_effect_logs')
      .insert({
        user_id: user.id,
        compounds: compounds,
        dosages: dosages,
        side_effects: sideEffects,
        additional_supplements: additionalSupplements?.trim() || null,
        analysis_result: validatedData
      })
      .select()
      .single()

    if (dbError) {
      console.error('Error saving to database:', dbError)
      // Don't fail the request if DB save fails, but log it
    }

    // Return the analysis result
    return NextResponse.json({
      success: true,
      data: validatedData,
      analysisId: sideEffectLog?.id,
      tokensUsed: grokResult.tokensUsed
    })

  } catch (error) {
    console.error('Side effects API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}