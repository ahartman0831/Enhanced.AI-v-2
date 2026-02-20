import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { getSubscriptionTier, requireTier } from '@/lib/subscription-gate'
import { callGrok } from '@/lib/grok'
import { getCommunityInsightsForCompounds } from '@/lib/community-insights'
import fs from 'fs'
import path from 'path'

/** Max chars to keep prompt under ~8k (avoids token limits). */
const MAX_PROTOCOL_CHARS = 6000

/**
 * Summarize protocol for the forecast prompt.
 * Extracts only essential fields; truncates large blobs from DB.
 */
function summarizeProtocolForPrompt(protocol: unknown): string {
  if (protocol === null || protocol === undefined) return 'No data provided'
  if (typeof protocol === 'string') {
    return protocol.length > MAX_PROTOCOL_CHARS ? protocol.slice(0, MAX_PROTOCOL_CHARS) + '\n... [truncated]' : protocol
  }
  if (typeof protocol !== 'object') return 'No data provided'
  const row = protocol as Record<string, unknown>
  const sj = row.stack_json as Record<string, unknown> | null | undefined
  const meta = (sj?.input_metadata as Record<string, unknown>) || {}
  const approaches = (sj?.common_approaches_discussed as unknown[]) || (sj?.commonApproaches as unknown[]) || []
  const compounds: string[] = []
  for (const a of approaches) {
    if (a && typeof a === 'object') {
      const obj = a as Record<string, unknown>
      if (obj.base) compounds.push(String(obj.base))
      for (const c of (obj.additions as unknown[]) || (obj.typicalCompounds as unknown[]) || []) {
        if (typeof c === 'string') compounds.push(c)
      }
    }
  }
  const summary = {
    compounds: [...new Set(compounds)].slice(0, 12),
    goals: typeof meta.goals === 'string' ? meta.goals.slice(0, 150) : meta.goals,
    experience: meta.experience,
  }
  let protocolStr = JSON.stringify(summary, null, 2)
  if (protocolStr.length > MAX_PROTOCOL_CHARS) {
    protocolStr = protocolStr.slice(0, MAX_PROTOCOL_CHARS) + '\n... [truncated]'
  }
  return protocolStr
}

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

    const { data: profile } = await supabase.from('profiles').select('dev_mode_enabled, sex').eq('id', user.id).single()
    const devModeEnabled = profile?.dev_mode_enabled ?? false
    if (!devModeEnabled) {
      const tier = await getSubscriptionTier(supabase, user.id)
      const gate = requireTier(tier, 'pro')
      if (!gate.allowed) {
        return gate.response
      }
    }

    // Optional: accept protocolData from request body (e.g. from DataInputModal)
    let bodyProtocol: unknown = null
    try {
      const body = await request.json()
      if (body?.protocolData !== undefined) bodyProtocol = body.protocolData
    } catch {
      // No body or invalid JSON; will fall back to DB
    }

    // Get user's latest protocol from DB (used when body data not provided)
    const { data: latestProtocol } = await supabase
      .from('enhanced_protocols')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    const protocolForPrompt = bodyProtocol ?? latestProtocol ?? null

    const forecastData = {
      currentProtocol: latestProtocol ?? null,
      analysisDate: new Date().toISOString()
    }

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

    // Summarize protocol to keep prompt under ~8k chars
    let protocolStr = summarizeProtocolForPrompt(protocolForPrompt)

    // Optional: append community insights when protocol comes from modal (has compound names)
    if (bodyProtocol && typeof bodyProtocol === 'string') {
      try {
        const parsed = JSON.parse(bodyProtocol) as { compounds?: Array<{ name?: string }> }
        const names = (parsed?.compounds ?? []).map((c) => c?.name).filter(Boolean) as string[]
        if (names.length > 0) {
          const insights = await getCommunityInsightsForCompounds(supabase, names)
          if (insights) {
            protocolStr = protocolStr + '\n\nCommunity notes: ' + insights
          }
        }
      } catch {
        // Ignore parse errors; use protocolStr as-is
      }
    }

    const filledPrompt = promptTemplate.replace('{protocolData}', protocolStr)

    // Call Grok API for results forecasting
    const grokResult = await callGrok({
      prompt: filledPrompt,
      userId: user.id,
      feature: 'results-forecast',
      route: '/api/forecast-results',
      query: protocolStr?.slice(0, 500) ?? 'n/a',
    })

    if (!grokResult.success) {
      console.error('Grok forecast error:', grokResult.error)
      const status = grokResult._complianceBlocked ? 422 : 500
      return NextResponse.json(
        { error: grokResult.error || 'Failed to generate forecast' },
        { status }
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
        protocolId: forecastData.currentProtocol?.id
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