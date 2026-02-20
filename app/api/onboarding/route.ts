import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('user_onboarding_profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Onboarding fetch Supabase error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch onboarding', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(data || null)
  } catch (err) {
    console.error('Onboarding fetch error:', err)
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json(
      { error: 'Internal server error', details: message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { age, sex, ped_experience_level, primary_goal, risk_tolerance, allow_anonymized_insights } = body

    if (!age || !sex || !ped_experience_level || !primary_goal || !risk_tolerance) {
      return NextResponse.json(
        { error: 'Missing required fields: age, sex, ped_experience_level, primary_goal, risk_tolerance' },
        { status: 400 }
      )
    }

    const validRisk = ['low', 'medium', 'high']
    if (!validRisk.includes(risk_tolerance)) {
      return NextResponse.json({ error: 'Invalid risk_tolerance value' }, { status: 400 })
    }

    const ageNum = Number(age)
    if (isNaN(ageNum) || ageNum < 18 || ageNum > 120) {
      return NextResponse.json({ error: 'Age must be between 18 and 120' }, { status: 400 })
    }

    const validSex = ['male', 'female', 'other', 'prefer_not_to_say']
    if (!validSex.includes(sex)) {
      return NextResponse.json({ error: 'Invalid sex value' }, { status: 400 })
    }

    const validExp = ['none', 'beginner', 'intermediate', 'advanced']
    if (!validExp.includes(ped_experience_level)) {
      return NextResponse.json({ error: 'Invalid ped_experience_level' }, { status: 400 })
    }

    const { error: onboardingError } = await supabase
      .from('user_onboarding_profiles')
      .upsert({
        id: user.id,
        age: ageNum,
        sex,
        ped_experience_level,
        primary_goal,
        risk_tolerance,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' })

    if (onboardingError) {
      console.error('Onboarding save Supabase error:', onboardingError)
      return NextResponse.json(
        { error: 'Failed to save onboarding', details: onboardingError.message },
        { status: 500 }
      )
    }

    // Sync to profiles so age, sex, goals, experience_level, risk_tolerance are available
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        age: ageNum,
        sex,
        goals: primary_goal,
        experience_level: ped_experience_level,
        risk_tolerance,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' })
    if (profileError) {
      console.error('Profile sync error (onboarding):', profileError)
      // Don't fail the request - onboarding was saved successfully
    }

    if (allow_anonymized_insights === true) {
      await supabase
        .from('user_data_consent')
        .upsert({
          user_id: user.id,
          consent_type: 'anonymized_insights',
          consented_at: new Date().toISOString(),
          revoked_at: null
        }, { onConflict: 'user_id,consent_type' })
    } else if (allow_anonymized_insights === false) {
      await supabase
        .from('user_data_consent')
        .update({ revoked_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('consent_type', 'anonymized_insights')
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Onboarding save error:', err)
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json(
      { error: 'Internal server error', details: message },
      { status: 500 }
    )
  }
}
