import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { getSubscriptionTier, requireTier } from '@/lib/subscription-gate'
import { callGrok } from '@/lib/grok'
import { TELEHEALTH_PARTNERS } from '@/lib/affiliates'
import fs from 'fs'
import path from 'path'

/** Max chars per section to keep prompt under ~20k (avoids token limits). Truncates raw_json/stack_json bloat. */
const MAX_PROTOCOL_CHARS = 6000
const MAX_BLOODWORK_CHARS = 6000

/**
 * Summarize protocol and bloodwork for recovery timeline prompt.
 * Extracts only fields needed for recovery analysis; truncates large blobs.
 */
function summarizeRecoveryData(protocol: unknown, bloodwork: unknown): { protocolData: string; bloodworkData: string } {
  let protocolData = 'No protocol data available'
  if (protocol && typeof protocol === 'object') {
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
      id: row.id,
      created_at: row.created_at,
      analysisType: sj?.analysisType || sj?.analysis_type || 'stack',
      goals: typeof meta.goals === 'string' ? meta.goals.slice(0, 200) : meta.goals,
      experience: meta.experience,
      compounds: [...new Set(compounds)].slice(0, 15),
    }
    protocolData = JSON.stringify(summary, null, 2)
    if (protocolData.length > MAX_PROTOCOL_CHARS) {
      protocolData = protocolData.slice(0, MAX_PROTOCOL_CHARS) + '\n... [truncated]'
    }
  }

  let bloodworkData = 'No bloodwork data available'
  if (bloodwork && typeof bloodwork === 'object') {
    const row = bloodwork as Record<string, unknown>
    const rj = row.raw_json as Record<string, unknown> | null | undefined
    const flags = row.flags
    const reportDate = row.report_date

    const skipKeys = new Set([
      'analysisSummary', 'patternRecognition', 'harmReductionObservations', 'harmReductionPlainLanguage',
      'mitigationObservations', 'educationalRecommendations', 'extractedMetadata', 'raw_text', 'rawText', 'ocr'
    ])

    let markers: Record<string, unknown> = {}
    if (rj && typeof rj === 'object') {
      const markerArr = Array.isArray(rj.markerAnalysis) ? rj.markerAnalysis : Array.isArray(rj.marker_analysis) ? rj.marker_analysis : null
      if (markerArr) {
        for (const m of markerArr.slice(0, 25)) {
          if (m && typeof m === 'object' && 'marker' in m && 'value' in m) {
            const entry = m as Record<string, unknown>
            markers[String(entry.marker)] = entry.value
          }
        }
      } else {
        const entries = Object.entries(rj).filter(([k]) => !skipKeys.has(k)).slice(0, 25)
        const truncate = (x: unknown): unknown => {
          if (typeof x === 'string') return x.length > 80 ? x.slice(0, 80) + '...' : x
          if (x && typeof x === 'object' && 'value' in x) return truncate((x as Record<string, unknown>).value)
          return x
        }
        markers = Object.fromEntries(entries.map(([k, v]) => [k, truncate(v)]))
      }
    }

    const summary = { report_date: reportDate, markers, flags }

    bloodworkData = JSON.stringify(summary, null, 2)
    if (bloodworkData.length > MAX_BLOODWORK_CHARS) {
      bloodworkData = bloodworkData.slice(0, MAX_BLOODWORK_CHARS) + '\n... [truncated]'
    }
  }

  return { protocolData, bloodworkData }
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

    const { data: profile } = await supabase.from('profiles').select('dev_mode_enabled').eq('id', user.id).single()
    const devModeEnabled = profile?.dev_mode_enabled ?? false
    if (!devModeEnabled) {
      const tier = await getSubscriptionTier(supabase, user.id)
      const gate = requireTier(tier, 'elite')
      if (!gate.allowed) {
        return gate.response
      }
    }

    // Get user's latest protocol and bloodwork
    const { data: latestProtocol } = await supabase
      .from('enhanced_protocols')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    const { data: latestBloodwork } = await supabase
      .from('bloodwork_reports')
      .select('*')
      .eq('user_id', user.id)
      .order('report_date', { ascending: false })
      .limit(1)
      .single()

    // Load recovery model prompt template
    const promptPath = path.join(process.cwd(), 'prompts', 'recovery_model_prompt.txt')
    let promptTemplate: string

    try {
      promptTemplate = fs.readFileSync(promptPath, 'utf-8')
    } catch (error) {
      console.error('Error loading prompt template:', error)
      return NextResponse.json(
        { error: 'Failed to load recovery model template' },
        { status: 500 }
      )
    }

    // Parse optional body: cycleContext (from modal save) or useLastKnown (from skip)
    const body = await request.json().catch(() => ({}))
    const cycleContext = body.cycleContext as { compounds: string[]; dosages: string; sideEffects: string[]; additionalSupplements?: string } | undefined
    const useLastKnown = body.useLastKnown === true

    // Resolve cycle/side-effect context: explicit from modal, or last known from DB
    let currentCompounds: string[] = []
    let currentDosages: string | null = null
    let currentSideEffects: string[] = []
    let dataSourceNote = ''
    let additionalSupplementsStr = ''

    if (cycleContext?.compounds && cycleContext?.sideEffects?.length) {
      currentCompounds = cycleContext.compounds
      currentDosages = cycleContext.dosages || null
      currentSideEffects = cycleContext.sideEffects
      const additionalSupplements = cycleContext.additionalSupplements?.trim() || null
      if (additionalSupplements) {
        additionalSupplementsStr = `\nAdditional supplements/info: ${additionalSupplements}`
      }
      dataSourceNote = ''
      // Save to side_effect_logs for future pre-fill (including additional supplements)
      await supabase.from('side_effect_logs').insert({
        user_id: user.id,
        compounds: currentCompounds,
        dosages: currentDosages,
        side_effects: currentSideEffects,
        additional_supplements: additionalSupplements,
        analysis_result: null,
      })
    } else if (useLastKnown) {
      const { data: latestLog } = await supabase
        .from('side_effect_logs')
        .select('compounds, dosages, side_effects, additional_supplements')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (latestLog) {
        currentCompounds = (latestLog.compounds as string[]) ?? []
        currentDosages = latestLog.dosages as string | null
        currentSideEffects = (latestLog.side_effects as string[]) ?? []
        if (latestLog.additional_supplements) {
          additionalSupplementsStr = `\nAdditional supplements/info: ${latestLog.additional_supplements}`
        }
        dataSourceNote = 'Based on previous logs – verify with physician.'
      } else {
        dataSourceNote = 'No prior logs found – no cycle/side-effect context.'
      }
    }

    const cycleContextBlock =
      currentCompounds.length > 0 || currentSideEffects.length > 0 || additionalSupplementsStr
        ? `\n## Current Cycle & Side Effects (User-Reported)\nCurrent compounds: ${JSON.stringify(currentCompounds)}\nDosages: ${currentDosages || 'Not specified'}\nRecent side effects: ${JSON.stringify(currentSideEffects)}${additionalSupplementsStr}\n${dataSourceNote ? `Data note: ${dataSourceNote}` : ''}\n`
        : dataSourceNote
          ? `\n## Data Source Note\n${dataSourceNote}\n`
          : ''

    // Summarize data to keep prompt under ~20k chars (avoids 14M+ token bloat from raw_json/stack_json)
    const { protocolData, bloodworkData } = summarizeRecoveryData(latestProtocol, latestBloodwork)

    const filledPrompt = promptTemplate
      .replace('{protocolData}', protocolData)
      .replace('{bloodworkData}', bloodworkData)
      .replace('{cycleContext}', cycleContextBlock)
      .replace('{questUrl}', TELEHEALTH_PARTNERS.quest)
      .replace('{himsUrl}', TELEHEALTH_PARTNERS.hims)
      .replace('{letsGetCheckedUrl}', TELEHEALTH_PARTNERS.letsGetChecked)

    // Call Grok API for recovery timeline analysis
    const grokResult = await callGrok({
      prompt: filledPrompt,
      userId: user.id,
      feature: 'recovery-timeline'
    })

    if (!grokResult.success) {
      const status = grokResult._complianceBlocked ? 422 : 500
      return NextResponse.json(
        { error: grokResult.error || 'Failed to generate recovery timeline' },
        { status }
      )
    }

    // Save recovery analysis to enhanced_protocols (as a special recovery analysis)
    const { data: recoveryAnalysis, error: dbError } = await supabase
      .from('enhanced_protocols')
      .insert({
        user_id: user.id,
        stack_json: {
          analysisType: 'recovery-timeline',
          recoveryAnalysis: grokResult.data,
          basedOnProtocol: latestProtocol?.id,
          basedOnBloodwork: latestBloodwork?.id
        },
        nutrition_impact: grokResult.data?.pctConsiderations || null
      })
      .select()
      .single()

    if (dbError) {
      console.error('Error saving recovery analysis:', dbError)
      // Don't fail if DB save fails
    }

    // Extract bloodwork markers for frontend overlay (Test, LH, FSH, etc.)
    let bloodworkMarkers: Record<string, { value: number | string; unit?: string }> = {}
    if (latestBloodwork && typeof latestBloodwork === 'object') {
      const rj = (latestBloodwork as Record<string, unknown>).raw_json as Record<string, unknown> | null | undefined
      if (rj && typeof rj === 'object') {
        const markerArr = Array.isArray(rj.markerAnalysis) ? rj.markerAnalysis : Array.isArray(rj.marker_analysis) ? rj.marker_analysis : null
        if (markerArr) {
          for (const m of markerArr.slice(0, 15)) {
            if (m && typeof m === 'object' && 'marker' in m && 'value' in m) {
              const entry = m as Record<string, unknown>
              const marker = String(entry.marker).toLowerCase()
              const val = entry.value
              if (marker.includes('test') || marker.includes('lh') || marker.includes('fsh') || marker.includes('total t')) {
                bloodworkMarkers[String(entry.marker)] = {
                  value: typeof val === 'number' ? val : String(val),
                  unit: typeof entry.unit === 'string' ? entry.unit : undefined,
                }
              }
            }
          }
        }
      }
    }

    // Return the recovery timeline analysis (include cycleContext + bloodworkMarkers for frontend graph)
    return NextResponse.json({
      success: true,
      data: grokResult.data,
      cycleContext: currentCompounds.length > 0 ? { compounds: currentCompounds, dosages: currentDosages, sideEffects: currentSideEffects } : null,
      bloodworkMarkers: Object.keys(bloodworkMarkers).length > 0 ? bloodworkMarkers : null,
      analysisId: recoveryAnalysis?.id,
      tokensUsed: grokResult.tokensUsed,
      basedOn: {
        protocolId: latestProtocol?.id,
        bloodworkId: latestBloodwork?.id
      }
    })

  } catch (error) {
    console.error('Recovery timeline API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}