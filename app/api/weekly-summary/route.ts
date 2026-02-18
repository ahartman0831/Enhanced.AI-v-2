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
    const [bloodworkResult, photoResult, protocolResult] = await Promise.all([
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
        .single()
    ])

    // Get previous log date (7 days ago)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    // Load prompt
    const promptPath = path.join(process.cwd(), 'prompts', 'weekly_summary_prompt.txt')
    const prompt = fs.readFileSync(promptPath, 'utf8')

    // Prepare data for Grok
    const data = {
      bloodwork_data: bloodworkResult.data ? JSON.stringify(bloodworkResult.data) : 'No bloodwork data available',
      photo_data: photoResult.data ? JSON.stringify(photoResult.data) : 'No photo data available',
      stack_data: protocolResult.data ? JSON.stringify(protocolResult.data) : 'No protocol data available',
      previous_log_date: sevenDaysAgo.toISOString().split('T')[0]
    }

    const grokPrompt = prompt
      .replace('{bloodwork_data}', data.bloodwork_data)
      .replace('{photo_data}', data.photo_data)
      .replace('{stack_data}', data.stack_data)
      .replace('{previous_log_date}', data.previous_log_date)

    const grokResult = await callGrok({
      prompt: grokPrompt,
      userId: user.id,
      feature: 'weekly-summary'
    })

    if (!grokResult.success) {
      return NextResponse.json({ error: 'Failed to generate summary' }, { status: 500 })
    }

    return NextResponse.json({
      summary: grokResult.data,
      generated_at: new Date().toISOString()
    })

  } catch (error) {
    console.error('Weekly summary error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}