import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase'
import { callGrok } from '@/lib/grok'
import fs from 'fs'
import path from 'path'

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get anonymized aggregated data (no personal identifiers)
    // Count users with similar profiles (same experience level)
    const { data: profileData } = await supabase
      .from('profiles')
      .select('experience_level')
      .eq('id', user.id)
      .single()

    const experienceLevel = profileData?.experience_level || 'intermediate'

    // Get aggregated statistics (completely anonymized)
    const [userCountResult, avgDurationResult, commonStacksResult, avgBloodworkResult] = await Promise.all([
      // Count users with similar experience
      supabase
        .from('profiles')
        .select('id', { count: 'exact' })
        .eq('experience_level', experienceLevel),

      // Average protocol duration (simplified - count of protocols per user)
      supabase
        .from('enhanced_protocols')
        .select('user_id')
        .then(result => {
          const userProtocolCounts: { [key: string]: number } = {}
          result.data?.forEach(item => {
            userProtocolCounts[item.user_id] = (userProtocolCounts[item.user_id] || 0) + 1
          })
          const counts = Object.values(userProtocolCounts)
          return counts.length > 0 ? counts.reduce((a, b) => a + b) / counts.length : 0
        }),

      // Common protocol patterns (most frequent compound categories)
      supabase
        .from('enhanced_protocols')
        .select('stack_json')
        .limit(100)
        .then(result => {
          const categories: { [key: string]: number } = {}
          result.data?.forEach(item => {
            if (item.stack_json && typeof item.stack_json === 'object') {
              Object.keys(item.stack_json).forEach(key => {
                categories[key] = (categories[key] || 0) + 1
              })
            }
          })
          return Object.entries(categories)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .map(([category, count]) => ({ category, count }))
        }),

      // Average bloodwork changes (simplified aggregation)
      supabase
        .from('bloodwork_reports')
        .select('flags')
        .limit(50)
        .then(result => {
          const flagCounts: { [key: string]: number } = {}
          result.data?.forEach(item => {
            if (item.flags && typeof item.flags === 'object') {
              Object.keys(item.flags).forEach(flag => {
                flagCounts[flag] = (flagCounts[flag] || 0) + 1
              })
            }
          })
          return Object.entries(flagCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 3)
        })
    ])

    // Load prompt
    const promptPath = path.join(process.cwd(), 'prompts', 'community_insights_prompt.txt')
    const prompt = fs.readFileSync(promptPath, 'utf8')

    // Prepare anonymized data for Grok
    const aggregatedData = {
      user_count: userCountResult.count || 0,
      avg_duration: Math.round(avgDurationResult || 0),
      common_stacks: JSON.stringify(commonStacksResult || []),
      avg_bloodwork_changes: JSON.stringify(avgBloodworkResult || []),
      avg_timeline: '8-12 weeks' // Simplified average
    }

    const grokPrompt = prompt
      .replace('{user_count}', aggregatedData.user_count.toString())
      .replace('{avg_duration}', aggregatedData.avg_duration.toString())
      .replace('{common_stacks}', aggregatedData.common_stacks)
      .replace('{avg_bloodwork_changes}', aggregatedData.avg_bloodwork_changes)
      .replace('{avg_timeline}', aggregatedData.avg_timeline)

    const grokResult = await callGrok({
      prompt: grokPrompt,
      userId: user.id,
      feature: 'community-insights'
    })

    if (!grokResult.success) {
      return NextResponse.json({ error: 'Failed to generate community insights' }, { status: 500 })
    }

    return NextResponse.json(grokResult.data)

  } catch (error) {
    console.error('Community insights error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}