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
    const { bloodworkData, testDate, source } = body

    if (!bloodworkData) {
      return NextResponse.json(
        { error: 'Bloodwork data is required' },
        { status: 400 }
      )
    }

    // Load bloodwork parser prompt template
    const promptPath = path.join(process.cwd(), 'prompts', 'bloodwork_parser.txt')
    let promptTemplate: string

    try {
      promptTemplate = fs.readFileSync(promptPath, 'utf-8')
    } catch (error) {
      console.error('Error loading prompt template:', error)
      return NextResponse.json(
        { error: 'Failed to load bloodwork analysis template' },
        { status: 500 }
      )
    }

    // Prepare the analysis prompt with user data
    const analysisPrompt = `${promptTemplate}

## User Bloodwork Data
Test Date: ${testDate || 'Not specified'}
Source: ${source || 'User provided'}
Data: ${JSON.stringify(bloodworkData, null, 2)}

Please analyze this bloodwork data and provide the educational analysis in the specified JSON format.`

    // Call Grok API for bloodwork analysis
    const grokResult = await callGrok({
      prompt: analysisPrompt,
      userId: user.id,
      feature: 'bloodwork-analysis'
    })

    if (!grokResult.success) {
      return NextResponse.json(
        { error: grokResult.error || 'Failed to analyze bloodwork' },
        { status: 500 }
      )
    }

    // Save bloodwork report to database
    const { data: bloodworkReport, error: dbError } = await supabase
      .from('bloodwork_reports')
      .insert({
        user_id: user.id,
        report_date: testDate || new Date().toISOString().split('T')[0],
        raw_json: bloodworkData,
        flags: grokResult.data?.flags || [],
        projection: grokResult.data?.projections || {}
      })
      .select()
      .single()

    if (dbError) {
      console.error('Error saving bloodwork report:', dbError)
      // Don't fail if DB save fails
    }

    // Return the analysis result
    return NextResponse.json({
      success: true,
      data: grokResult.data,
      reportId: bloodworkReport?.id,
      tokensUsed: grokResult.tokensUsed
    })

  } catch (error) {
    console.error('Bloodwork analysis API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}