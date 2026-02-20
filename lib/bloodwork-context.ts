/**
 * Bloodwork analysis context injection.
 * Fetches user compounds, profile (age, location) and builds prompt context.
 * Observational only — never personalizes, never blocks.
 */

import { createSupabaseServerClient } from './supabase-server'
import { computeHptaSuppressionContext } from './hpta-suppression'

export interface BloodworkContextResult {
  compoundContext: string
  userProfileContext: string
  hptaContext: string
}

/**
 * Extract compound names from profile, side_effect_logs, and enhanced_protocols.
 */
async function getRecentCompounds(userId: string): Promise<string[]> {
  const supabase = await createSupabaseServerClient()
  const compounds = new Set<string>()

  // From profile current_compounds_json (user's shared stack)
  const { data: profile } = await supabase
    .from('profiles')
    .select('current_compounds_json')
    .eq('id', userId)
    .single()
  const cc = profile?.current_compounds_json as { compounds?: string[] } | null
  if (cc?.compounds?.length) {
    cc.compounds.forEach((c) => (typeof c === 'string' && c.trim() ? compounds.add(c.trim()) : null))
  }

  // From side_effect_logs (most recent analyses)
  const { data: sideEffectLogs } = await supabase
    .from('side_effect_logs')
    .select('compounds')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(5)

  for (const row of sideEffectLogs || []) {
    const arr = row?.compounds as string[] | null
    if (Array.isArray(arr)) {
      arr.forEach((c) => (typeof c === 'string' && c.trim() ? compounds.add(c.trim()) : null))
    }
  }

  // From enhanced_protocols (stack_json may have compound names)
  const { data: protocols } = await supabase
    .from('enhanced_protocols')
    .select('stack_json')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(3)

  for (const row of protocols || []) {
    const stack = row?.stack_json as Record<string, unknown> | null
    if (stack && typeof stack === 'object') {
      const compoundsArr = stack.compounds as string[] | undefined
      if (Array.isArray(compoundsArr)) {
        compoundsArr.forEach((c) => (typeof c === 'string' && c.trim() ? compounds.add(c.trim()) : null))
      }
    }
  }

  return Array.from(compounds)
}

/**
 * Get user profile context (age, sex) for range discussions.
 */
async function getUserProfileContext(userId: string): Promise<string> {
  const supabase = await createSupabaseServerClient()

  const [profileRes, onboardingRes] = await Promise.all([
    supabase.from('profiles').select('age, sex').eq('id', userId).single(),
    supabase.from('user_onboarding_profiles').select('age, sex').eq('id', userId).single(),
  ])

  const profile = (profileRes.data || onboardingRes.data) as { age?: number; sex?: string } | null
  if (!profile) return ''

  const parts: string[] = []
  if (profile.age != null && profile.age > 0) {
    parts.push(`Age: ${profile.age}`)
  }
  if (profile.sex) {
    parts.push(`Sex: ${profile.sex}`)
  }

  if (parts.length === 0) return ''
  return `User profile (for reference range discussions only): ${parts.join(', ')}. When relevant, note that reference ranges can vary by age and sex.`
}

/**
 * Compute full bloodwork context for prompt injection.
 */
export async function computeBloodworkContext(userId: string): Promise<BloodworkContextResult> {
  const [compounds, userProfileContext] = await Promise.all([
    getRecentCompounds(userId),
    getUserProfileContext(userId),
  ])

  const hptaContext = computeHptaSuppressionContext(compounds)

  let compoundContext = ''
  if (compounds.length > 0) {
    compoundContext =
      `User has recent compound/stack history from prior analyses: ${compounds.join(', ')}. ` +
      'Use ONLY for observational cross-reference (e.g., if prolactin in bloodwork and Tren/Deca in history, add community note on prolactin monitoring patterns). ' +
      'NEVER personalize. Never suggest adding or changing compounds. Always redirect to physician oversight.'
    if (hptaContext) {
      compoundContext +=
        ' HPTA pattern detected (suppressors without Test base): EXPAND harmReductionObservations with community/literature notes on LH/FSH/Testosterone monitoring.'
    }
  }

  return {
    compoundContext,
    userProfileContext,
    hptaContext,
  }
}
