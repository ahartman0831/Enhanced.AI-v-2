import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { callGrok } from '@/lib/grok'
import fs from 'fs'
import path from 'path'

/** Summarize health data to keep prompt under ~15k chars (avoids token limits & response truncation) */
function summarizeHealthDataForPrompt(
  profile: unknown,
  protocols: unknown[],
  bloodwork: unknown[],
  photoReports: unknown[],
  sideEffectLogs: unknown[],
  opts: { includeCompounds: boolean; includeSideEffects: boolean; includeBloodwork: boolean }
): string {
  const p = profile as Record<string, unknown> | null
  const profileSummary = p ? {
    age: p.age,
    sex: p.sex,
    goals: typeof p.goals === 'string' ? p.goals.slice(0, 200) : p.goals,
    experience_level: p.experience_level,
    risk_tolerance: p.risk_tolerance,
  } : null

  const protocolSummaries = opts.includeCompounds
    ? (protocols || []).slice(0, 2).map((row: any) => {
    const sj = row?.stack_json
    if (!sj) return { type: 'unknown' }
    const meta = sj.input_metadata || {}
    const approaches = sj.common_approaches_discussed || sj.commonApproaches || []
    const compounds: string[] = []
    for (const a of approaches) {
      if (a.base) compounds.push(a.base)
      for (const c of a.additions || a.typicalCompounds || []) compounds.push(c)
    }
    return {
      analysisType: sj.analysisType || 'stack',
      goals: meta.goals,
      experience: meta.experience,
      compounds: [...new Set(compounds)].slice(0, 10),
    }
  })
    : []

  const bloodworkSummaries = opts.includeBloodwork
    ? (bloodwork || []).slice(0, 1).map((row: any) => {
    const rj = row?.raw_json
    if (!rj || typeof rj !== 'object') return null
    const entries = Object.entries(rj).slice(0, 15)
    return { report_date: row.report_date, markers: Object.fromEntries(entries) }
  }).filter(Boolean)
    : []

  const sideEffectSummary = opts.includeSideEffects && (sideEffectLogs || []).length > 0
    ? (sideEffectLogs || []).slice(0, 5).map((log: any) => ({
        compounds: log.compounds,
        side_effects: log.side_effects,
        dosages: log.dosages,
        created_at: log.created_at,
      }))
    : []

  const photoSummary = (photoReports || []).length > 0
    ? `${photoReports.length} photo report(s) on file`
    : 'None'

  return JSON.stringify({
    profile: profileSummary,
    protocols: protocolSummaries,
    bloodwork: bloodworkSummaries,
    sideEffectLogs: sideEffectSummary,
    photoReports: photoSummary,
  }, null, 2)
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

    const body = await request.json().catch(() => ({}))
    const includeCompounds = body.includeCompounds !== false
    const includeSideEffects = body.includeSideEffects !== false
    const includeBloodwork = body.includeBloodwork !== false

    // Get user's comprehensive health data
    const [profile, protocols, bloodwork, symptoms, sideEffectLogs] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('enhanced_protocols').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
      supabase.from('bloodwork_reports').select('*').eq('user_id', user.id).order('report_date', { ascending: false }).limit(3),
      supabase.from('photo_reports').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(3),
      supabase.from('side_effect_logs').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10),
    ])

    // Load telehealth prep prompt template
    const promptPath = path.join(process.cwd(), 'prompts', 'telehealth_prep_prompt.txt')
    let promptTemplate: string

    try {
      promptTemplate = fs.readFileSync(promptPath, 'utf-8')
    } catch (error) {
      console.error('Error loading prompt template:', error)
      return NextResponse.json(
        { error: 'Failed to load telehealth prep template' },
        { status: 500 }
      )
    }

    // Summarize health data (keeps prompt ~15k chars to avoid truncation)
    const healthDataSummary = summarizeHealthDataForPrompt(
      profile.data,
      protocols.data || [],
      bloodwork.data || [],
      symptoms.data || [],
      sideEffectLogs.data || [],
      { includeCompounds, includeSideEffects, includeBloodwork }
    )

    const healthData = {
      profile: profile.data || null,
      recentProtocols: includeCompounds ? protocols.data || [] : [],
      recentBloodwork: includeBloodwork ? bloodwork.data || [] : [],
      recentSymptoms: symptoms.data || [],
      sideEffectLogs: includeSideEffects ? sideEffectLogs.data || [] : [],
      userEmail: user.email
    }

    // Fill in the prompt template
    const filledPrompt = promptTemplate
      .replace('[Patient Name/Anonymous]', user.email?.split('@')[0] || 'Anonymous Patient')
      .replace('[Current Date]', new Date().toISOString().split('T')[0])

    const fullPrompt = `${filledPrompt}

## Patient Health Data Summary (condensed)

${healthDataSummary}

Format this into a professional telehealth referral package. Return valid JSON with these exact keys:
- patientInfo: {name, consultationType, referralDate, urgency}
- healthHistory: string
- currentProtocol: string
- labResults: string
- symptomReport: string (REQUIRED - Include ALL reported symptoms and side effects from sideEffectLogs. List each by name only, no grouping by compound, no cause attribution. Physician determines cause.)
- consultationFocus: string[]
- providerNotes: string`

    // Call Grok API for referral package generation
    const grokResult = await callGrok({
      prompt: fullPrompt,
      userId: user.id,
      feature: 'telehealth-referral',
      maxTokens: 4096,
    })

    if (!grokResult.success) {
      return NextResponse.json(
        { error: grokResult.error || 'Failed to generate referral package' },
        { status: 500 }
      )
    }

    // Ensure symptomReport includes all side effects when we have data (strict list only, no compound association)
    let referralData = grokResult.data as Record<string, unknown>
    const hasSideEffectData = includeSideEffects && sideEffectLogs.data && (sideEffectLogs.data as unknown[]).length > 0
    if (hasSideEffectData) {
      const logs = sideEffectLogs.data as Array<{ side_effects?: string[] }>
      const allEffects = new Set<string>()
      for (const log of logs.slice(0, 5)) {
        for (const e of log.side_effects ?? []) {
          if (e?.trim()) allEffects.add(e.trim())
        }
      }
      const effectList = [...allEffects].map((e) => `- ${e}`).join('\n')
      referralData = { ...referralData, symptomReport: effectList || 'No symptoms or side effects reported.' }
    }

    // Save referral package to enhanced_protocols (required - fail if save fails)
    const { data: referralDoc, error: dbError } = await supabase
      .from('enhanced_protocols')
      .insert({
        user_id: user.id,
        stack_json: {
          analysisType: 'telehealth-referral',
          referralPackage: referralData,
          generatedAt: new Date().toISOString(),
          healthDataSummary: healthData
        },
        nutrition_impact: null
      })
      .select()
      .single()

    if (dbError) {
      console.error('Error saving referral document:', dbError)
      return NextResponse.json(
        { error: 'Failed to save referral package. Please try again.' },
        { status: 500 }
      )
    }

    // Return the referral package
    return NextResponse.json({
      success: true,
      data: referralData,
      documentId: referralDoc?.id,
      tokensUsed: grokResult.tokensUsed
    })

  } catch (error) {
    console.error('Telehealth referral API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}