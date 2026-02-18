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

    // Get user's latest protocol, bloodwork, and photos (maybeSingle = no error when 0 rows)
    const [latestProtocol, latestBloodwork, latestPhotos] = await Promise.all([
      supabase.from('enhanced_protocols')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase.from('bloodwork_reports')
        .select('*')
        .eq('user_id', user.id)
        .order('report_date', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase.from('photo_reports')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
    ])

    // Load results forecast prompt template
    const promptPath = path.join(process.cwd(), 'prompts', 'results_forecast_prompt.txt')
    let promptTemplate: string

    try {
      promptTemplate = fs.readFileSync(promptPath, 'utf-8')
    } catch (error) {
      console.error('Error loading prompt template:', error)
      return NextResponse.json(
        { error: 'Failed to load results forecast template' },
        { status: 500 }
      )
    }

    // Prepare comprehensive data for forecasting
    const forecastData = {
      currentProtocol: latestProtocol.data ?? null,
      currentBloodwork: latestBloodwork.data ?? null,
      currentPhotos: latestPhotos.data ?? null,
      analysisDate: new Date().toISOString()
    }

    // Fill in the prompt template
    const filledPrompt = promptTemplate
      .replace('{protocolData}', JSON.stringify(forecastData.currentProtocol, null, 2))
      .replace('{bloodworkData}', JSON.stringify(forecastData.currentBloodwork, null, 2))
      .replace('{photoData}', JSON.stringify(forecastData.currentPhotos, null, 2))

    // Call Grok API for results forecasting
    const grokResult = await callGrok({
      prompt: filledPrompt,
      userId: user.id,
      feature: 'results-forecast'
    })

    if (!grokResult.success) {
      console.error('Grok forecast error:', grokResult.error)
      return NextResponse.json(
        { error: grokResult.error || 'Failed to generate forecast' },
        { status: 500 }
      )
    }

    // Save forecast analysis
    const { data: forecastRecord, error: dbError } = await supabase
      .from('enhanced_protocols')
      .insert({
        user_id: user.id,
        stack_json: {
          analysisType: 'results-forecast',
          forecastData: forecastData,
          forecast: grokResult.data
        },
        nutrition_impact: grokResult.data?.forecasts || null
      })
      .select()
      .single()

    if (dbError) {
      console.error('Error saving forecast:', dbError)
      // Don't fail if DB save fails
    }

    // Return the forecast result
    return NextResponse.json({
      success: true,
      data: grokResult.data,
      forecastId: forecastRecord?.id,
      tokensUsed: grokResult.tokensUsed,
      basedOn: {
        protocolId: forecastData.currentProtocol?.id,
        bloodworkId: forecastData.currentBloodwork?.id,
        photosId: forecastData.currentPhotos?.id
      }
    })

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    console.error('Results forecast API error:', error)
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}