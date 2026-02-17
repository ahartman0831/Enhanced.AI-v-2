import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { callGrok } from '@/lib/grok'
import fs from 'fs'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const supabase = createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { compounds, dosages, sideEffects } = body

    if (!compounds || compounds.length === 0 || !sideEffects || sideEffects.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: compounds and sideEffects' },
        { status: 400 }
      )
    }


    // Prepare variables for prompt template
    const variables = {
      compounds: compounds.join(', '),
      dosages: dosages || 'No dosage information provided',
      sideEffects: sideEffects.join(', ')
    }

    // Call Grok API
    const grokResult = await callGrok({
      promptName: 'side-effect-explainer',
      userId: user.id,
      variables,
      feature: 'side-effects'
    })

    if (!grokResult.success) {
      return NextResponse.json(
        { error: grokResult.error || 'Failed to analyze side effects' },
        { status: 500 }
      )
    }

    // Save analysis to side_effect_logs table
    const { data: sideEffectLog, error: dbError } = await supabase
      .from('side_effect_logs')
      .insert({
        user_id: user.id,
        compounds: compounds,
        dosages: dosages,
        side_effects: sideEffects,
        analysis_result: grokResult.data
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
      data: grokResult.data,
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