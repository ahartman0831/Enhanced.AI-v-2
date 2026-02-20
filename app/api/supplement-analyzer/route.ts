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
    const [protocolResult, bloodworkResult, sideEffectsResult, profileResult] = await Promise.all([
      supabase
        .from('enhanced_protocols')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single(),
      supabase
        .from('bloodwork_reports')
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
        .limit(10),
      supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
    ])

    // Load prompt
    const promptPath = path.join(process.cwd(), 'prompts', 'supplement_analyzer_prompt.txt')
    const prompt = fs.readFileSync(promptPath, 'utf8')

    // Prepare data for Grok
    const data = {
      stack_data: protocolResult.data ? JSON.stringify(protocolResult.data) : 'No protocol data available',
      bloodwork_data: bloodworkResult.data ? JSON.stringify(bloodworkResult.data) : 'No bloodwork data available',
      side_effect_data: sideEffectsResult.data ? JSON.stringify(sideEffectsResult.data) : 'No side effect data available',
      goals_data: profileResult.data ? JSON.stringify(profileResult.data) : 'No profile data available'
    }

    const grokPrompt = prompt
      .replace('{stack_data}', data.stack_data)
      .replace('{bloodwork_data}', data.bloodwork_data)
      .replace('{side_effect_data}', data.side_effect_data)
      .replace('{goals_data}', data.goals_data)

    const grokResult = await callGrok({
      prompt: grokPrompt,
      userId: user.id,
      feature: 'supplement-analyzer'
    })

    if (!grokResult.success) {
      const status = grokResult._complianceBlocked ? 422 : 500
      return NextResponse.json({ error: grokResult.error || 'Failed to generate supplement recommendations' }, { status })
    }

    return NextResponse.json(grokResult.data)

  } catch (error) {
    console.error('Supplement analyzer error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}