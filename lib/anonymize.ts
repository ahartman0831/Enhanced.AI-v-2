import crypto from 'crypto'
import { createSupabaseServerClient } from './supabase-server'
import { createSupabaseAdminClient } from './supabase-admin'

const ANON_SALT = process.env.ANON_SALT || 'enhanced-ai-anonymization-salt-v2'

/**
 * Generate a SHA-256 hash of user ID with salt for anonymization
 * This creates a consistent hash for the same user while being irreversible
 */
export function generateUserHash(userId: string): string {
  return crypto
    .createHash('sha256')
    .update(userId + ANON_SALT)
    .digest('hex')
}

/**
 * Remove personally identifiable information from user data
 * Returns anonymized version safe for aggregation
 */
export function anonymizeUserData(userData: any): any {
  const anonymized = { ...userData }

  // Remove direct identifiers
  delete anonymized.id
  delete anonymized.user_id
  delete anonymized.email
  delete anonymized.name
  delete anonymized.created_at
  delete anonymized.updated_at

  // Anonymize dates to periods (e.g., "2024-Q1" instead of "2024-01-15")
  if (anonymized.report_date) {
    const date = new Date(anonymized.report_date)
    anonymized.period = `${date.getFullYear()}-Q${Math.floor(date.getMonth() / 3) + 1}`
    delete anonymized.report_date
  }

  // Convert numeric values to ranges for bloodwork markers
  if (anonymized.raw_json) {
    anonymized.marker_ranges = {}
    Object.entries(anonymized.raw_json).forEach(([marker, value]: [string, any]) => {
      if (typeof value === 'number') {
        // Create ranges to preserve statistical meaning without individual values
        const base = Math.floor(value / 10) * 10
        anonymized.marker_ranges[marker] = `${base}-${base + 9}`
      }
    })
    delete anonymized.raw_json
  }

  // Anonymize compound usage (keep categories, remove specifics)
  if (anonymized.stack_json) {
    anonymized.compound_categories = Object.keys(anonymized.stack_json)
    delete anonymized.stack_json
  }

  return anonymized
}

/**
 * Extract anonymized compound interest from stack-explorer protocol
 * Compound names are safe for aggregation (no PII)
 */
function anonymizeStackExplorer(stackJson: any): { compounds: string[]; goals: string; experience: string } | null {
  if (!stackJson || typeof stackJson !== 'object') return null
  const compounds: string[] = []
  const approaches = stackJson.common_approaches_discussed || stackJson.commonApproaches || []
  for (const a of approaches) {
    if (a.base && typeof a.base === 'string') compounds.push(a.base.trim())
    for (const c of a.additions || a.typicalCompounds || []) {
      if (typeof c === 'string' && c.trim()) compounds.push(c.trim())
    }
  }
  const meta = stackJson.input_metadata || {}
  return {
    compounds: [...new Set(compounds)].filter(Boolean),
    goals: String(meta.goals || ''),
    experience: String(meta.experience || '')
  }
}

/**
 * Extract anonymized counterfeit check data (no images, no PII)
 */
function anonymizeCounterfeit(stackJson: any): { productType: string; imageCount: number; authenticityFlags: string[] } | null {
  if (!stackJson || stackJson.analysisType !== 'counterfeit-analysis') return null
  const analysis = stackJson.analysis || {}
  const flags: string[] = []
  for (const i of analysis.authenticityIndicators || []) {
    if (i?.indicator && typeof i.indicator === 'string') flags.push(i.indicator)
  }
  for (const f of analysis.redFlags || []) {
    if (typeof f === 'string') flags.push(f)
  }
  return {
    productType: String(stackJson.productType || 'unknown'),
    imageCount: Number(stackJson.imageCount) || 0,
    authenticityFlags: flags.slice(0, 10) // limit for aggregation
  }
}

/**
 * Extract anonymized side effect data (compounds + side effects, no dosages that could identify)
 */
function anonymizeSideEffectLogs(logs: any[]): Array<{ compounds: string[]; sideEffects: string[] }> {
  if (!Array.isArray(logs)) return []
  return logs.map((log: any) => ({
    compounds: Array.isArray(log.compounds) ? log.compounds.filter((c: any) => typeof c === 'string') : [],
    sideEffects: Array.isArray(log.side_effects) ? log.side_effects.filter((s: any) => typeof s === 'string') : []
  }))
}

/**
 * Weekly job stub - aggregates anonymized data from consented users
 * This should be run as a cron job or scheduled function
 */
export async function aggregateTrends(): Promise<void> {
  const supabase = await createSupabaseServerClient()

  try {
    // Get all users who have consented to anonymized insights
    const { data: consentedUsers, error: consentError } = await supabase
      .from('user_data_consent')
      .select('user_id')
      .eq('consent_type', 'anonymized_insights')
      .is('revoked_at', null)

    if (consentError) {
      console.error('Error fetching consented users:', consentError)
      return
    }

    if (!consentedUsers || consentedUsers.length < 10) {
      console.log('Not enough consented users for aggregation (minimum 10)')
      return
    }

    const userIds = consentedUsers.map(u => u.user_id)

    // Process each consented user
    for (const userId of userIds) {
      const userHash = generateUserHash(userId)

      // Check if we already have recent contributions from this user
      const { data: existingContribution } = await supabase
        .from('anonymized_contributions')
        .select('id')
        .eq('user_hash', userHash)
        .gte('contributed_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .single()

      if (existingContribution) {
        continue // Skip if contributed in last 7 days
      }

      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()

      // Gather user's anonymized health data (all feature sources for community insights)
      let compoundViewsResult: { data: any[] | null } = { data: null }
      try {
        const admin = createSupabaseAdminClient()
        const res = await admin.from('compound_breakdown_views').select('compound_id, compounds(name)').eq('user_id', userId).gte('viewed_at', ninetyDaysAgo).limit(100)
        compoundViewsResult = res
      } catch {
        // Admin client or compound_breakdown_views may not be available
      }

      const [profileResult, onboardingResult, protocolsResult, bloodworkResult, sideEffectsResult] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).single(),
        supabase.from('user_onboarding_profiles').select('age, sex, ped_experience_level, primary_goal').eq('id', userId).single(),
        supabase.from('enhanced_protocols').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(50),
        supabase.from('bloodwork_reports').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(5),
        supabase.from('side_effect_logs').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(20)
      ])

      const profile = profileResult.data || {}
      const onboarding = onboardingResult.data || {}
      const ageBucket = onboarding.age != null
        ? onboarding.age >= 40 ? '40_plus' : onboarding.age >= 30 ? '30_39' : '18_29'
        : null

      // Extract compound interests from stack-explorer protocols
      const allProtocols = protocolsResult.data || []
      const compoundInterests: string[] = []
      const counterfeitChecks: Array<{ productType: string; imageCount: number; authenticityFlags: string[] }> = []
      let latestProtocol: any = null

      for (const row of allProtocols) {
        const sj = row?.stack_json
        if (!sj) continue
        if (sj.analysisType === 'counterfeit-analysis') {
          const c = anonymizeCounterfeit(sj)
          if (c) counterfeitChecks.push(c)
        } else if (!sj.analysisType || sj.analysisType === 'stack-explorer') {
          const se = anonymizeStackExplorer(sj)
          if (se) {
            compoundInterests.push(...se.compounds)
            if (!latestProtocol) latestProtocol = row
          }
        } else if (['results-forecast', 'recovery-timeline'].includes(sj.analysisType)) {
          // Extract compound names from forecast/recovery if present
          const compounds = sj.compounds || sj.stack_compounds || []
          if (Array.isArray(compounds)) compoundInterests.push(...compounds.filter((c: any) => typeof c === 'string'))
          if (!latestProtocol) latestProtocol = row
        }
      }

      // Add compound names from breakdown page views (compound_breakdown_views)
      const viewRows = compoundViewsResult.data || []
      for (const v of viewRows) {
        const name = (v as any).compounds?.name
        if (typeof name === 'string' && name.trim()) compoundInterests.push(name.trim())
      }

      const bloodworkRows = Array.isArray(bloodworkResult.data) ? bloodworkResult.data : bloodworkResult.data ? [bloodworkResult.data] : []
      const latestBloodwork = bloodworkRows[0]

      const contributionData = {
        profile: anonymizeUserData({ ...profile, ...onboarding, experience_level: onboarding.ped_experience_level || profile.experience_level }),
        onboarding_buckets: ageBucket ? { age_bucket: ageBucket, sex: onboarding.sex, experience: onboarding.ped_experience_level, goal: onboarding.primary_goal } : null,
        protocol: anonymizeUserData(latestProtocol || {}),
        protocol_age_bucket: latestProtocol?.created_at
          ? (() => {
              const days = Math.floor((Date.now() - new Date(latestProtocol.created_at).getTime()) / (24 * 60 * 60 * 1000))
              return days <= 30 ? '0_30' : days <= 90 ? '31_90' : '91_plus'
            })()
          : null,
        bloodwork: anonymizeUserData(latestBloodwork || {}),
        side_effects: anonymizeSideEffectLogs(sideEffectsResult.data || []),
        compound_interests: [...new Set(compoundInterests)].filter(Boolean).slice(0, 30),
        counterfeit_checks: counterfeitChecks.slice(0, 10),
        contributed_at: new Date().toISOString()
      }

      // Insert anonymized contribution
      await supabase
        .from('anonymized_contributions')
        .insert({
          user_hash: userHash,
          contribution_json: contributionData
        })
    }

    // Now aggregate trends from contributions (only if we have enough data)
    await calculateAggregatedTrends()

  } catch (error) {
    console.error('Error in aggregateTrends:', error)
  }
}

/**
 * Calculate aggregated trends from anonymized contributions
 */
async function calculateAggregatedTrends(): Promise<void> {
  const supabase = await createSupabaseServerClient()

  // Get recent contributions (last 90 days)
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()

  const { data: contributions, error } = await supabase
    .from('anonymized_contributions')
    .select('contribution_json')
    .gte('contributed_at', ninetyDaysAgo)

  if (error || !contributions || contributions.length < 10) {
    console.log('Not enough contributions for trend calculation')
    return
  }

  // Calculate various trends
  const trends = []

  // Bloodwork marker averages by experience level
  const bloodworkByExperience: { [key: string]: any[] } = {}
  const bloodworkByAgeBucket: { [key: string]: any[] } = {}
  const bloodworkByGoal: { [key: string]: any[] } = {}
  contributions.forEach(contrib => {
    const data = contrib.contribution_json
    const exp = data.profile?.ped_experience_level || data.profile?.experience_level
    if (data.bloodwork && exp) {
      if (!bloodworkByExperience[exp]) bloodworkByExperience[exp] = []
      bloodworkByExperience[exp].push(data.bloodwork)
    }
    const ageBucket = data.onboarding_buckets?.age_bucket
    if (data.bloodwork && ageBucket) {
      if (!bloodworkByAgeBucket[ageBucket]) bloodworkByAgeBucket[ageBucket] = []
      bloodworkByAgeBucket[ageBucket].push(data.bloodwork)
    }
    const goal = data.onboarding_buckets?.goal
    if (data.bloodwork && goal) {
      const goalKey = goal.toLowerCase().replace(/\s+/g, '_')
      if (!bloodworkByGoal[goalKey]) bloodworkByGoal[goalKey] = []
      bloodworkByGoal[goalKey].push(data.bloodwork)
    }
  })

  const addBloodworkTrends = (bloodworks: any[], subgroup: string, minSize: number) => {
    if (bloodworks.length < minSize) return
    const markerAverages: { [key: string]: number } = {}
    bloodworks.forEach(bw => {
      if (bw.marker_ranges) {
        Object.entries(bw.marker_ranges).forEach(([marker, range]: [string, any]) => {
          const [start] = String(range).split('-').map(Number)
          const approxValue = start + 5
          if (!markerAverages[marker]) markerAverages[marker] = 0
          markerAverages[marker] += approxValue
        })
      }
    })
    Object.entries(markerAverages).forEach(([marker, total]) => {
      const average = total / bloodworks.length
      trends.push({
        category: 'bloodwork',
        subgroup,
        metric: `${marker}_average_range`,
        value: { average: Math.round(average), unit: 'approximate' },
        sample_size: bloodworks.length,
        period: 'last_90_days'
      })
    })
  }

  Object.entries(bloodworkByExperience).forEach(([experience, bloodworks]) => {
    addBloodworkTrends(bloodworks, `${experience}_experience`, 10)
  })
  Object.entries(bloodworkByAgeBucket).forEach(([ageBucket, bloodworks]) => {
    addBloodworkTrends(bloodworks, `age_${ageBucket}`, 5)
  })
  Object.entries(bloodworkByGoal).forEach(([goal, bloodworks]) => {
    addBloodworkTrends(bloodworks, `goal_${goal}`, 5)
  })

  // Protocol age bucket distribution
  const protocolAgeBuckets: { [key: string]: number } = {}
  contributions.forEach(c => {
    const bucket = c.contribution_json.protocol_age_bucket
    if (bucket) {
      protocolAgeBuckets[bucket] = (protocolAgeBuckets[bucket] || 0) + 1
    }
  })
  Object.entries(protocolAgeBuckets).forEach(([bucket, count]) => {
    if (count >= 5) {
      trends.push({
        category: 'protocols',
        subgroup: `age_bucket_${bucket}`,
        metric: 'user_count',
        value: { count },
        sample_size: count,
        period: 'last_90_days'
      })
    }
  })

  // Compound interest trends (which compounds users explore most)
  const compoundCounts: { [key: string]: number } = {}
  contributions.forEach(c => {
    const compounds = c.contribution_json.compound_interests || []
    compounds.forEach((name: string) => {
      const key = String(name).trim()
      if (key) compoundCounts[key] = (compoundCounts[key] || 0) + 1
    })
  })
  const topCompounds = Object.entries(compoundCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 30)
  topCompounds.forEach(([compound, count]) => {
    if (count >= 5) {
      trends.push({
        category: 'compound_interest',
        subgroup: compound,
        metric: 'exploration_count',
        value: { count },
        sample_size: count,
        period: 'last_90_days'
      })
    }
  })

  // Side effects: compound + side effect co-occurrence (for community patterns)
  const compoundSideEffectPairs: { [key: string]: number } = {}
  contributions.forEach(c => {
    const logs = c.contribution_json.side_effects || []
    logs.forEach((log: { compounds: string[]; sideEffects: string[] }) => {
      for (const comp of log.compounds || []) {
        for (const se of log.sideEffects || []) {
          const key = `${String(comp).trim()}::${String(se).trim()}`
          if (key && key !== '::') compoundSideEffectPairs[key] = (compoundSideEffectPairs[key] || 0) + 1
        }
      }
    })
  })
  Object.entries(compoundSideEffectPairs)
    .filter(([, count]) => count >= 5)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .forEach(([pair, count]) => {
      trends.push({
        category: 'side_effects',
        subgroup: pair,
        metric: 'co_occurrence_count',
        value: { count },
        sample_size: count,
        period: 'last_90_days'
      })
    })

  // Counterfeit: product types checked, common authenticity flags
  const counterfeitProductTypes: { [key: string]: number } = {}
  const counterfeitFlags: { [key: string]: number } = {}
  contributions.forEach(c => {
    const checks = c.contribution_json.counterfeit_checks || []
    checks.forEach((ch: { productType: string; authenticityFlags: string[] }) => {
      const pt = String(ch.productType || 'unknown').trim()
      if (pt) counterfeitProductTypes[pt] = (counterfeitProductTypes[pt] || 0) + 1
      for (const f of ch.authenticityFlags || []) {
        const flag = String(f).trim().slice(0, 80)
        if (flag) counterfeitFlags[flag] = (counterfeitFlags[flag] || 0) + 1
      }
    })
  })
  Object.entries(counterfeitProductTypes).forEach(([productType, count]) => {
    if (count >= 3) {
      trends.push({
        category: 'counterfeit',
        subgroup: productType,
        metric: 'check_count',
        value: { count },
        sample_size: count,
        period: 'last_90_days'
      })
    }
  })
  Object.entries(counterfeitFlags)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .forEach(([flag, count]) => {
      if (count >= 3) {
        trends.push({
          category: 'counterfeit',
          subgroup: `flag_${flag.slice(0, 40)}`,
          metric: 'flag_frequency',
          value: { count },
          sample_size: count,
          period: 'last_90_days'
        })
      }
    })

  // Insert calculated trends (upsert based on unique constraint)
  for (const trend of trends) {
    await supabase
      .from('anonymized_trends')
      .upsert(trend, {
        onConflict: 'category,subgroup,metric,period'
      })
  }

  console.log(`Calculated ${trends.length} anonymized trends from ${contributions.length} contributions`)
}