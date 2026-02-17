import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase'
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
    const { goals, experience, riskTolerance, bloodwork } = body

    if (!goals || !experience || !riskTolerance) {
      return NextResponse.json(
        { error: 'Missing required fields: goals, experience, riskTolerance' },
        { status: 400 }
      )
    }

    // Load educational prompt template
    const promptPath = path.join(process.cwd(), 'prompts', 'educational_stack_explorer.txt')
    let promptTemplate: string

    try {
      promptTemplate = fs.readFileSync(promptPath, 'utf-8')
    } catch (error) {
      console.error('Error loading prompt template:', error)
      return NextResponse.json(
        { error: 'Failed to load educational prompt template' },
        { status: 500 }
      )
    }

    // Fill in the prompt template with user data
    const filledPrompt = promptTemplate
      .replace('{goals}', goals)
      .replace('{experience}', experience)
      .replace('{riskTolerance}', riskTolerance)
      .replace('{bloodwork}', bloodwork || 'No bloodwork summary provided')

    // Call Grok API
    const grokResult = await callGrok({
      prompt: filledPrompt,
      userId: user.id,
      feature: 'stack-explorer'
    })

    if (!grokResult.success) {
      return NextResponse.json(
        { error: grokResult.error || 'Failed to generate stack analysis' },
        { status: 500 }
      )
    }

    // Save to enhanced_protocols table
    const { data: protocolData, error: dbError } = await supabase
      .from('enhanced_protocols')
      .insert({
        user_id: user.id,
        stack_json: grokResult.data,
        nutrition_impact: grokResult.data?.nutritionImpact || grokResult.data?.nutrition_impact
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