import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { callGrok } from '@/lib/grok'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: onboarding } = await supabase
      .from('user_onboarding_profiles')
      .select('age, sex, ped_experience_level, primary_goal')
      .eq('id', user.id)
      .single()

    const experienceLevel = onboarding?.ped_experience_level || 'intermediate'
    const ageBucket = onboarding?.age != null
      ? onboarding.age >= 40 ? 'age_40_plus' : onboarding.age >= 30 ? 'age_30_39' : 'age_18_29'
      : null
    const goalKey = onboarding?.primary_goal
      ? onboarding.primary_goal.toLowerCase().replace(/\s+/g, '_')
      : null

    const subgroups = [
      `${experienceLevel}_experience`,
      ...(ageBucket ? [ageBucket] : []),
      ...(goalKey ? [`goal_${goalKey}`] : []),
      null
    ].filter(Boolean)
    const orFilter = subgroups
      .map(s => s === null ? 'subgroup.is.null' : `subgroup.eq.${s}`)
      .join(',')

    const { data: trends, error } = await supabase
      .from('anonymized_trends')
      .select('*')
      .or(orFilter)
      .order('calculated_at', { ascending: false })
      .limit(10)

    if (error || !trends?.length) {
      return NextResponse.json({
        story: 'Be among the first to contribute anonymized insights — community risk stories require participation.',
        educational_note: 'Individual responses vary significantly.'
      })
    }

    const grokResult = await callGrok({
      promptName: 'community_risk_story_prompt',
      userId: user.id,
      feature: 'community-risk-stories',
      variables: { trendsJson: JSON.stringify(trends.slice(0, 5)) }
    })

    if (!grokResult.success) {
      return NextResponse.json({
        story: 'Community insights are being calculated. Check back later!',
        educational_note: 'Trends require minimum participation to maintain privacy.'
      })
    }

    const story = grokResult.data?.story ?? grokResult.data?.text ?? (typeof grokResult.data === 'string' ? grokResult.data : 'Community data is being analyzed.')

    return NextResponse.json({
      story: story.replace(/^["']|["']$/g, ''),
      educational_note: 'Individual responses vary. Discuss with your physician.'
    })
  } catch (error) {
    console.error('Community risk stories error:', error)
    return NextResponse.json({
      story: 'Community insights are being calculated.',
      educational_note: 'Check back later for anonymized risk stories.'
    })
  }
}
