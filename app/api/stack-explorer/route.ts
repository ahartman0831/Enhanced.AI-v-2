import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { createSupabaseAdminClient } from '@/lib/supabase-admin'
import { callGrok } from '@/lib/grok'

function riskToleranceToMaxScore(risk: string): number {
  const r = String(risk).toLowerCase()
  if (r === 'low') return 4
  if (r === 'medium') return 6
  if (r === 'high') return 10
  const num = parseInt(risk, 10)
  return !isNaN(num) ? Math.min(10, Math.max(1, num)) : 6
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
      .select('age, sex, ped_experience_level, primary_goal')
      .eq('id', user.id)
      .single()

    if (onboarding) {
      userProfile = `Age: ${onboarding.age}, Sex: ${onboarding.sex}, PED experience: ${onboarding.ped_experience_level}, Primary goal: ${onboarding.primary_goal}`
    }

    const maxRisk = riskToleranceToMaxScore(riskTolerance)
    const goalKeywords = String(goals).toLowerCase().replace(/\s+/g, ' ').split(' ').filter(Boolean)

    const admin = createSupabaseAdminClient()
    const { data: compounds } = await admin
      .from('compounds')
      .select('name, category, risk_score, common_uses, affected_systems, key_monitoring_markers')
      .lte('risk_score', maxRisk)
      .order('risk_score', { ascending: true })
      .limit(25)

    const filteredCompounds = (compounds || []).filter((c) => {
      if (!goalKeywords.length) return true
      const uses = (c.common_uses || '').toLowerCase()
      const cat = (c.category || '').toLowerCase()
      return goalKeywords.some((kw) => uses.includes(kw) || cat.includes(kw) || c.name.toLowerCase().includes(kw))
    })

    const availableCompounds = (filteredCompounds.length > 0 ? filteredCompounds : compounds || []).slice(0, 20)
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

    const variables: Record<string, string> = {
      goals: String(goals),
      experience: String(experience),
      riskTolerance: String(riskTolerance),
      bloodwork: bloodwork || 'No bloodwork summary provided',
      userProfile: userProfile || 'Not provided',
      available_compounds: availableCompoundsJson
    }

    let promptName = 'educational_stack_explorer'
    if (isWhatIf) {
      promptName = 'educational_stack_explorer_whatif'
      variables.compoundTweak = String(compoundTweak)
      variables.approachIndex = String(approachIndex ?? 0)
      variables.previousResult = typeof previousResult === 'string' ? previousResult : JSON.stringify(previousResult)
    }

    // Call Grok API
    const grokResult = await callGrok({
      promptName,
      userId: user.id,
      feature: 'stack-explorer',
      variables
    })

    if (!grokResult.success) {
      return NextResponse.json(
        { error: grokResult.error || 'Failed to generate stack analysis' },
        { status: 500 }
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