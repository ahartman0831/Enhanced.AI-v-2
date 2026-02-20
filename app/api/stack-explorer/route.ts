import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { getSubscriptionTier, requireTier } from '@/lib/subscription-gate'
import { createSupabaseAdminClient } from '@/lib/supabase-admin'
import { callGrok } from '@/lib/grok'

const STACK_EXPLORER_BANNED_COMPOUNDS = [
  'halotestin', 'fluoxymesterone', 'anadrol', 'oxymetholone',
  'methyltrienolone', 'metribolone', 'cheque drops', 'mibolerone',
  'superdrol', 'methasterone', 'dmz', 'dimethazine',
  'm1t', 'methyl-1-testosterone', 'trenbolone'
]

function riskToleranceToMaxScore(risk: string): number {
  const r = String(risk).toLowerCase()
  if (r === 'low') return 4
  if (r === 'medium') return 6
  if (r === 'high') return 10
  const num = parseInt(risk, 10)
  return !isNaN(num) ? Math.min(10, Math.max(1, num)) : 6
}

/** Map primary goal to search keywords for compound filtering. Ensures every goal returns applicable compounds. */
function goalToKeywords(goal: string): string[] {
  const g = String(goal).toLowerCase().trim()
  const mapping: Record<string, string[]> = {
    'cut': ['cut', 'cutting', 'fat loss', 'fat', 'deficit', 'recomp', 'lean', 'dryness', 'vascularity'],
    'lean bulk': ['lean', 'bulk', 'mass', 'partitioning', 'glycogen', 'surplus'],
    'dirty bulk': ['bulk', 'mass', 'appetite', 'surplus', 'glycogen'],
    'contest prep': ['contest', 'prep', 'conditioning', 'dryness', 'peak', 'cutting'],
    'strength gains': ['strength', 'power', 'cns', 'explosive'],
    'strength density': ['strength', 'density', 'power', 'bone'],
    'trt optimization': ['trt', 'testosterone', 'hormone', 'replacement', 'optimization'],
    'general health optimization': ['health', 'metabolic', 'recovery', 'longevity'],
    'recovery enhancement': ['recovery', 'repair', 'inflammation', 'sleep', 'tissue'],
    'endurance improvement': ['endurance', 'stamina', 'vo2', 'aerobic', 'fat oxidation'],
    'body recomposition': ['recomp', 'lean', 'fat loss', 'muscle', 'partitioning', 'deficit'],
    'other': []
  }
  for (const [key, keywords] of Object.entries(mapping)) {
    if (g.includes(key) || key.includes(g)) return keywords
  }
  return g ? [g, ...g.split(/\s+/).filter(Boolean)] : []
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
    let { goals, experience, riskTolerance, bloodwork, compoundTweak, approachIndex, previousResult } = body

    // For What If: fallback to previousResult.input_metadata when loading saved reports
    const prev = typeof previousResult === 'string' ? (() => { try { return JSON.parse(previousResult || '{}') } catch { return {} } })() : (previousResult || {})
    const meta = prev?.input_metadata
    if (compoundTweak && prev && (!goals || !experience || !riskTolerance) && meta) {
      goals = goals || meta.goals
      experience = experience || meta.experience
      riskTolerance = riskTolerance || meta.riskTolerance
      bloodwork = bloodwork ?? meta.bloodwork
    }

    if (!goals || !experience || !riskTolerance) {
      return NextResponse.json(
        { error: 'Missing required fields: goals, experience, riskTolerance' },
        { status: 400 }
      )
    }

    const isWhatIf = compoundTweak && typeof compoundTweak === 'string' && previousResult

    // Fetch onboarding profile for tailoring
    let userProfile = ''
    const { data: onboarding } = await supabase
      .from('user_onboarding_profiles')
      .select('age, sex, ped_experience_level, primary_goal, risk_tolerance')
      .eq('id', user.id)
      .single()

    if (onboarding) {
      userProfile = `Age: ${onboarding.age}, Sex: ${onboarding.sex}, PED experience: ${onboarding.ped_experience_level}, Primary goal: ${onboarding.primary_goal}, Risk tolerance: ${onboarding.risk_tolerance || 'not set'}`
    }

    const maxRisk = riskToleranceToMaxScore(riskTolerance)
    const goalKeywords = goalToKeywords(goals)
    const isHighRisk = String(riskTolerance).toLowerCase() === 'high'
    const isAdvanced = String(experience).toLowerCase() === 'advanced'
    const massGoals = ['lean bulk', 'dirty bulk', 'mass', 'contest prep', 'strength', 'cut', 'recomp']
    const goalLower = String(goals).toLowerCase()
    const wantsBolderCompounds = isHighRisk || (isAdvanced && massGoals.some((g) => goalLower.includes(g)))

    const admin = createSupabaseAdminClient()
    let { data: compounds, error: compoundsError } = await admin
      .from('compounds')
      .select('name, category, risk_score, common_uses, affected_systems, key_monitoring_markers')
      .lte('risk_score', maxRisk)
      .order('risk_score', { ascending: !wantsBolderCompounds })
      .limit(30)

    if (compoundsError) {
      console.error('[Stack Explorer] Compounds fetch error:', compoundsError)
      return NextResponse.json(
        { error: 'Failed to load compound database. Please try again.' },
        { status: 500 }
      )
    }

    // Fallback: if risk filter returns empty, fetch without risk filter (e.g. compounds may have null risk_score)
    if (!compounds?.length) {
      console.warn('[Stack Explorer] Risk filter returned 0 compounds (maxRisk:', maxRisk, '), trying unfiltered fetch')
      const { data: fallback } = await admin
        .from('compounds')
        .select('name, category, risk_score, common_uses, affected_systems, key_monitoring_markers')
        .order('name')
        .limit(30)
      compounds = fallback || []
    }

    const filteredCompounds = (compounds || []).filter((c) => {
      if (!goalKeywords.length) return true
      const uses = (c.common_uses || '').toLowerCase()
      const cat = (c.category || '').toLowerCase()
      const name = (c.name || '').toLowerCase()
      return goalKeywords.some((kw) => uses.includes(kw) || cat.includes(kw) || name.includes(kw))
    })

    const excludeBanned = (list: typeof compounds) =>
      (list || []).filter((c) => {
        const n = (c?.name || '').toLowerCase()
        return !STACK_EXPLORER_BANNED_COMPOUNDS.some((b) => n.includes(b) || n === b.trim())
      })

    let pool = excludeBanned(filteredCompounds.length > 0 ? filteredCompounds : compounds || [])

    // Fallback: if goal filtering or banned-exclusion left pool empty, use full compound list (minus banned)
    if (pool.length === 0) {
      pool = excludeBanned(compounds || [])
    }

    if (pool.length === 0) {
      console.error('[Stack Explorer] No compounds available after filtering. Raw count:', compounds?.length ?? 0)
      return NextResponse.json(
        { error: 'No compounds available for your profile. The compound database may be empty—please contact support.' },
        { status: 503 }
      )
    }

    const availableCompounds = wantsBolderCompounds
      ? [...pool].sort((a, b) => (b.risk_score || 0) - (a.risk_score || 0)).slice(0, 22)
      : pool.slice(0, 22)
    const availableCompoundsJson = JSON.stringify(
      availableCompounds.map((c) => ({
        name: c.name,
        category: c.category,
        risk_score: c.risk_score,
        common_uses: c.common_uses,
        affected_systems: c.affected_systems,
        key_monitoring_markers: c.key_monitoring_markers
      })),
      null,
      2
    )

    const profileEmphasis = wantsBolderCompounds
      ? 'CRITICAL: User is ADVANCED/HIGH-RISK with a mass/performance goal. You MUST select bolder compounds from the list (e.g. Boldenone, Masteron, MK-677, Dianabol) — NOT default to Ostarine or low-risk SARMs. Amplify risks and monitoring in your descriptions. Never include compounds from the HARD NEVER LIST.'
      : ''

    const variables: Record<string, string> = {
      goals: String(goals),
      experience: String(experience),
      riskTolerance: String(riskTolerance),
      bloodwork: bloodwork || 'No bloodwork summary provided',
      userProfile: userProfile || 'Not provided',
      available_compounds: availableCompoundsJson,
      profile_emphasis: profileEmphasis
    }

    let promptName = 'educational_stack_explorer'
    if (isWhatIf) {
      promptName = 'educational_stack_explorer_whatif'
      variables.compoundTweak = String(compoundTweak)
      variables.approachIndex = String(approachIndex ?? 0)
      variables.previousResult = typeof previousResult === 'string' ? previousResult : JSON.stringify(previousResult)
    }

    // Diagnostic: log what compounds are being injected
    const compoundNames = availableCompounds.map((c: { name: string }) => c.name)
    console.log('[Stack Explorer] Available compounds being injected:', {
      count: compoundNames.length,
      names: compoundNames,
      wantsBolderCompounds,
      goals,
      experience,
      riskTolerance
    })

    // Call Grok API (slightly higher temp for creative, vivid output)
    const grokResult = await callGrok({
      promptName,
      userId: user.id,
      feature: 'stack-explorer',
      variables,
      temperature: 0.45
    })

    if (!grokResult.success) {
      const status = grokResult._complianceBlocked ? 422 : 500
      return NextResponse.json(
        { error: grokResult.error || 'Failed to generate stack analysis' },
        { status }
      )
    }

    // Save to enhanced_protocols table (include input_metadata for What If / saved report restore)
    const nutritionImpact = grokResult.data?.nutrition_impact ?? grokResult.data?.nutritionImpact
    const stackJsonWithMeta = {
      ...grokResult.data,
      input_metadata: {
        goals: String(goals),
        experience: String(experience),
        riskTolerance: String(riskTolerance),
        bloodwork: bloodwork || ''
      }
    }
    const { data: protocolData, error: dbError } = await supabase
      .from('enhanced_protocols')
      .insert({
        user_id: user.id,
        stack_json: stackJsonWithMeta,
        nutrition_impact: nutritionImpact
      })
      .select()
      .single()

    if (dbError) {
      console.error('Error saving to database:', dbError)
      // Don't fail the request if DB save fails, but log it
    }

    // Persist survey preferences to user_onboarding_profiles when row exists
    const { data: existingOnboarding } = await supabase
      .from('user_onboarding_profiles')
      .select('id')
      .eq('id', user.id)
      .single()

    if (existingOnboarding) {
      await supabase
        .from('user_onboarding_profiles')
        .update({
          primary_goal: String(goals),
          ped_experience_level: String(experience),
          risk_tolerance: String(riskTolerance),
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)
    }

    // Return the analysis result (with input_metadata for client)
    return NextResponse.json({
      success: true,
      data: stackJsonWithMeta,
      protocolId: protocolData?.id,
      tokensUsed: grokResult.tokensUsed
    })

  } catch (error) {
    console.error('Stack explorer API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}