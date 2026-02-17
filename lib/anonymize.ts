import crypto from 'crypto'
import { createSupabaseServerClient } from './supabase-server'

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
 * Weekly job stub - aggregates anonymized data from consented users
 * This should be run as a cron job or scheduled function
 */
export async function aggregateTrends(): Promise<void> {
  const supabase = createSupabaseServerClient()

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

      // Gather user's anonymized health data
      const [profileResult, protocolsResult, bloodworkResult, sideEffectsResult] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).single(),
        supabase.from('enhanced_protocols').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(1).single(),
        supabase.from('bloodwork_reports').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(1).single(),
        supabase.from('side_effect_logs').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(5)
      ])

      const contributionData = {
        profile: anonymizeUserData(profileResult.data || {}),
        protocol: anonymizeUserData(protocolsResult.data || {}),
        bloodwork: anonymizeUserData(bloodworkResult.data || {}),
        side_effects: anonymizeUserData(sideEffectsResult.data || []),
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
  const supabase = createSupabaseServerClient()

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
  contributions.forEach(contrib => {
    const data = contrib.contribution_json
    if (data.bloodwork && data.profile?.experience_level) {
      const exp = data.profile.experience_level
      if (!bloodworkByExperience[exp]) bloodworkByExperience[exp] = []
      bloodworkByExperience[exp].push(data.bloodwork)
    }
  })

  // Calculate average changes for common markers
  Object.entries(bloodworkByExperience).forEach(([experience, bloodworks]) => {
    if (bloodworks.length >= 10) {
      const markerAverages: { [key: string]: number } = {}

      bloodworks.forEach(bw => {
        if (bw.marker_ranges) {
          Object.entries(bw.marker_ranges).forEach(([marker, range]: [string, any]) => {
            // Extract approximate value from range (take midpoint)
            const [start] = range.split('-').map(Number)
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
          subgroup: `${experience}_experience`,
          metric: `${marker}_average_range`,
          value: { average: Math.round(average), unit: 'approximate' },
          sample_size: bloodworks.length,
          period: 'last_90_days'
        })
      })
    }
  })

  // Protocol duration trends
  const protocolDurations = contributions
    .map(c => c.contribution_json.protocol)
    .filter(p => p && p.created_at)
    .map(p => {
      const created = new Date(p.created_at)
      const now = new Date()
      return Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24))
    })
    .filter(days => days > 0)

  if (protocolDurations.length >= 10) {
    const avgDuration = protocolDurations.reduce((a, b) => a + b) / protocolDurations.length
    trends.push({
      category: 'protocols',
      subgroup: null,
      metric: 'average_protocol_duration_days',
      value: { average: Math.round(avgDuration) },
      sample_size: protocolDurations.length,
      period: 'last_90_days'
    })
  }

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