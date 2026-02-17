import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { callGrok } from '@/lib/grok'

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
    const { frontUrl, sideUrl, backUrl, metadata } = body

    if (!frontUrl || !sideUrl || !backUrl) {
      return NextResponse.json(
        { error: 'Missing required photo URLs: frontUrl, sideUrl, backUrl' },
        { status: 400 }
      )
    }

    // Create analysis prompt for photo progress
    const analysisPrompt = `Analyze these progress photos for body composition changes:

Front View: ${frontUrl}
Side View: ${sideUrl}
Back View: ${backUrl}

Metadata: ${metadata || 'No additional metadata provided'}

Please provide an educational analysis of:
1. General body composition observations
2. Symmetry assessment
3. Areas of potential improvement
4. Educational monitoring recommendations

Format as JSON with structure:
{
  "bodyComposition": {
    "generalObservations": ["observation1", "observation2"],
    "symmetryAssessment": "assessment description",
    "improvementAreas": ["area1", "area2"]
  },
  "monitoringRecommendations": ["recommendation1", "recommendation2"],
  "educationalNotes": "General educational reminders about photo analysis limitations"
}

Remember: This is educational analysis only, not medical advice.`

    // Call Grok API for photo analysis
    const grokResult = await callGrok({
      prompt: analysisPrompt,
      userId: user.id,
      feature: 'photo-analysis'
    })

    if (!grokResult.success) {
      return NextResponse.json(
        { error: grokResult.error || 'Failed to analyze photos' },
        { status: 500 }
      )
    }

    // Save photo report to database
    const { data: photoReport, error: dbError } = await supabase
      .from('photo_reports')
      .insert({
        user_id: user.id,
        front_url: frontUrl,
        side_url: sideUrl,
        back_url: backUrl,
        analysis: grokResult.data
      })
      .select()
      .single()

    if (dbError) {
      console.error('Error saving photo report:', dbError)
      // Don't fail if DB save fails
    }

    // Return the analysis result
    return NextResponse.json({
      success: true,
      data: grokResult.data,
      reportId: photoReport?.id,
      tokensUsed: grokResult.tokensUsed
    })

  } catch (error) {
    console.error('Photo analysis API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}