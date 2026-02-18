import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { callGrok } from '@/lib/grok'
import fs from 'fs'
import path from 'path'

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

    // Get user's latest protocol and bloodwork
    const { data: latestProtocol } = await supabase
      .from('enhanced_protocols')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    const { data: latestBloodwork } = await supabase
      .from('bloodwork_reports')
      .select('*')
      .eq('user_id', user.id)
      .order('report_date', { ascending: false })
      .limit(1)
      .single()

    // Load recovery model prompt template
    const promptPath = path.join(process.cwd(), 'prompts', 'recovery_model_prompt.txt')
    let promptTemplate: string

    try {
      promptTemplate = fs.readFileSync(promptPath, 'utf-8')
    } catch (error) {
      console.error('Error loading prompt template:', error)
      return NextResponse.json(
        { error: 'Failed to load recovery model template' },
        { status: 500 }
      )
    }

    // Fill in the prompt template with user data
    const filledPrompt = promptTemplate
      .replace('{protocolData}', latestProtocol ? JSON.stringify(latestProtocol, null, 2) : 'No protocol data available')
      .replace('{bloodworkData}', latestBloodwork ? JSON.stringify(latestBloodwork, null, 2) : 'No bloodwork data available')

    // Call Grok API for recovery timeline analysis
    const grokResult = await callGrok({
      prompt: filledPrompt,
      userId: user.id,
      feature: 'recovery-timeline'
    })

    if (!grokResult.success) {
      return NextResponse.json(
        { error: grokResult.error || 'Failed to generate recovery timeline' },
        { status: 500 }
      )
    }

    // Save recovery analysis to enhanced_protocols (as a special recovery analysis)
    const { data: recoveryAnalysis, error: dbError } = await supabase
      .from('enhanced_protocols')
      .insert({
        user_id: user.id,
        stack_json: {
          analysisType: 'recovery-timeline',
          recoveryAnalysis: grokResult.data,
          basedOnProtocol: latestProtocol?.id,
          basedOnBloodwork: latestBloodwork?.id
        },
        nutrition_impact: grokResult.data?.pctConsiderations || null
      })
      .select()
      .single()

    if (dbError) {
      console.error('Error saving recovery analysis:', dbError)
      // Don't fail if DB save fails
    }

    // Return the recovery timeline analysis
    return NextResponse.json({
      success: true,
      data: grokResult.data,
      analysisId: recoveryAnalysis?.id,
      tokensUsed: grokResult.tokensUsed,
      basedOn: {
        protocolId: latestProtocol?.id,
        bloodworkId: latestBloodwork?.id
      }
    })

  } catch (error) {
    console.error('Recovery timeline API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}