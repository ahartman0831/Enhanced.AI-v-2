import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { callGrok } from '@/lib/grok'
import fs from 'fs'
import path from 'path'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's latest data
    const [bloodworkResult, photoResult, protocolResult, sideEffectsResult] = await Promise.all([
      supabase
        .from('bloodwork_reports')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single(),
      supabase
        .from('photo_reports')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single(),
      supabase
        .from('enhanced_protocols')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single(),
      supabase
        .from('side_effect_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5)
    ])

    // Load prompt
    const promptPath = path.join(process.cwd(), 'prompts', 'health_risk_score_prompt.txt')
    const prompt = fs.readFileSync(promptPath, 'utf8')

    // Prepare data for Grok
    const data = {
      bloodwork_data: bloodworkResult.data ? JSON.stringify(bloodworkResult.data) : 'No bloodwork data available',
      photo_data: photoResult.data ? JSON.stringify(photoResult.data) : 'No photo data available',
      stack_data: protocolResult.data ? JSON.stringify(protocolResult.data) : 'No protocol data available',
      side_effect_data: sideEffectsResult.data ? JSON.stringify(sideEffectsResult.data) : 'No side effect data available'
    }

    const grokPrompt = prompt
      .replace('{bloodwork_data}', data.bloodwork_data)
      .replace('{photo_data}', data.photo_data)
      .replace('{stack_data}', data.stack_data)
      .replace('{side_effect_data}', data.side_effect_data)

    const grokResult = await callGrok({
      prompt: grokPrompt,
      userId: user.id,
      feature: 'health-risk-score'
    })

    if (!grokResult.success) {
      return NextResponse.json({ error: 'Failed to calculate risk score' }, { status: 500 })
    }

    return NextResponse.json(grokResult.data)

  } catch (error) {
    console.error('Health risk score error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}