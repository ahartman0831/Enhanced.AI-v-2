import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { callGrok } from '@/lib/grok'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let body: { compounds?: string[]; bloodwork?: string } = {}
    try {
      const text = await request.text()
      body = text ? JSON.parse(text) : {}
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }
    const { compounds, bloodwork } = body

    const { data: onboarding } = await supabase
      .from('user_onboarding_profiles')
      .select('age, sex, ped_experience_level, primary_goal')
      .eq('id', user.id)
      .single()

    const variables: Record<string, string> = {
      age: String(onboarding?.age ?? 'Not provided'),
      sex: String(onboarding?.sex ?? 'Not provided'),
      pedExperience: String(onboarding?.ped_experience_level ?? 'Not provided'),
      goal: String(onboarding?.primary_goal ?? 'Not provided'),
      compounds: Array.isArray(compounds) ? compounds.join(', ') : String(compounds ?? ''),
      bloodwork: bloodwork || 'No bloodwork summary provided'
    }

    const grokResult = await callGrok({
      promptName: 'monitoring_plan_prompt',
      userId: user.id,
      feature: 'monitoring-plan',
      variables
    })

    if (!grokResult.success) {
      const status = grokResult._complianceBlocked ? 422 : 500
      return NextResponse.json(
        { error: grokResult.error || 'Failed to generate monitoring plan', flags: grokResult._complianceFlags },
        { status }
      )
    }

    return NextResponse.json({
      success: true,
      data: grokResult.data,
      tokensUsed: grokResult.tokensUsed
    })
  } catch (error) {
    console.error('Monitoring plan API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
