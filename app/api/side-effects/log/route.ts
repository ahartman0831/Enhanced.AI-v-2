import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

/**
 * POST: Save compounds + side effects to side_effect_logs WITHOUT running Grok.
 * Used by telehealth "Update Current Info" flow to record user's current state
 * before generating referral package.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { compounds, dosages, sideEffects } = body

    if (!compounds || !Array.isArray(compounds)) {
      return NextResponse.json(
        { error: 'compounds must be an array' },
        { status: 400 }
      )
    }
    if (!sideEffects || !Array.isArray(sideEffects) || sideEffects.length === 0) {
      return NextResponse.json(
        { error: 'At least one side effect is required' },
        { status: 400 }
      )
    }

    const { data: log, error } = await supabase
      .from('side_effect_logs')
      .insert({
        user_id: user.id,
        compounds,
        dosages: dosages || null,
        side_effects: sideEffects,
        analysis_result: null,
      })
      .select()
      .single()

    if (error) {
      console.error('Side effect log save error:', error)
      return NextResponse.json(
        { error: 'Failed to save log' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data: log })
  } catch (error) {
    console.error('Side effect log API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
