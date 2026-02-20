import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { callGrok, loadPrompt } from '@/lib/grok'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const {
      gender,
      heightDisplay,
      weightDisplay,
      bodyFatPct,
      leanWeightDisplay,
      ffmi,
      normalizedFfmi,
      compounds = [],
    } = body

    if (
      typeof ffmi !== 'number' ||
      typeof normalizedFfmi !== 'number' ||
      typeof bodyFatPct !== 'number'
    ) {
      return NextResponse.json(
        { error: 'Missing or invalid FFMI data (ffmi, normalizedFfmi, bodyFatPct required)' },
        { status: 400 }
      )
    }

    // Fetch user profile for compounds
    let compoundsList: string[] = Array.isArray(compounds) ? compounds : []
    if (compoundsList.length === 0) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('current_compounds_json')
        .eq('id', user.id)
        .single()

      const cc = profile?.current_compounds_json as { compounds?: string[] } | null
      if (cc?.compounds?.length) {
        compoundsList = cc.compounds
      }
    }

    const variables: Record<string, string> = {
      gender: String(gender || 'male'),
      heightDisplay: String(heightDisplay || '—'),
      weightDisplay: String(weightDisplay || '—'),
      bodyFatPct: String(bodyFatPct),
      leanWeightDisplay: String(leanWeightDisplay || '—'),
      ffmi: ffmi.toFixed(2),
      normalizedFfmi: normalizedFfmi.toFixed(2),
      compounds: compoundsList.length ? compoundsList.join(', ') : 'None specified',
    }

    const prompt = await loadPrompt('ffmi_analysis_prompt')
    if (!prompt) {
      return NextResponse.json(
        { error: 'FFMI analysis prompt not found' },
        { status: 500 }
      )
    }

    let finalPrompt = prompt
    Object.entries(variables).forEach(([key, value]) => {
      finalPrompt = finalPrompt.replace(new RegExp(`\\$\\{${key}\\}`, 'g'), value)
    })

    const result = await callGrok({
      prompt: finalPrompt,
      userId: user.id,
      feature: 'ffmi-analysis',
      responseFormat: 'text',
      route: 'ffmi-analysis',
      query: `FFMI ${normalizedFfmi.toFixed(1)} analysis`,
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Analysis failed' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      analysis: result.data,
      tokensUsed: result.tokensUsed,
    })
  } catch (error) {
    console.error('[FFMI Analysis] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
