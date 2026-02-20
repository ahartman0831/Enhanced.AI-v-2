/**
 * Internal compliance monitoring for Grok API outputs.
 * Scans responses for loose/non-compliant content, logs flags, alerts on high-risk.
 * Aligns with mission: educational biomarker data platform, no facilitation of interventions.
 */

import { createSupabaseAdminClient } from './supabase-admin'

export type ComplianceStatus = 'OK' | 'FLAGGED' | 'HIGH_RISK'

export interface MonitorResult {
  flags: string[]
  status: ComplianceStatus
  details: {
    highRiskCount: number
    mediumRiskCount: number
    lowRiskCount: number
  }
}

// --- CATASTROPHIC SLANG (flag for stack-education / educational outputs) ---
const CATASTROPHIC_SLANG_PATTERNS = [
  /\b(suicide|nukes?|minefield|cratering|hell|nuke\s+your)\b/i,
]

// --- REQUIRED VARIABILITY PHRASES (stack-education) ---
const VARIABILITY_PHRASES = [
  'vary dramatically',
  'individual responses vary',
  'individual variability',
]

// --- HIGH-RISK patterns (immediate block) ---
const HIGH_RISK_PATTERNS: Array<{ pattern: RegExp; flag: string }> = [
  { pattern: /\b(take \d+|use \d+|start \d+|stop \d+)\s*(mg|iu|mcg|ml|g)?/i, flag: 'Imperative dosage/action' },
  { pattern: /\b(run this|pct plan)\b/i, flag: 'Direct protocol instruction' },
  { pattern: /\b(will see|will experience)\b(?!.*(physician|doctor|variability|consult))/i, flag: 'Outcome prediction without qualifier' },
  { pattern: /(?<!cannot )(?<!can't )\b(predict|guarantee)\b/i, flag: 'Guarantee/prediction language' },
  { pattern: /\b(clomid|nolvadex|nolva)\s+(dose|protocol|dosing)\b/i, flag: 'SERM dosing recommendation' },
  { pattern: /\b(trt|testosterone replacement)\s+(dose|dosing)\b/i, flag: 'TRT dosing recommendation' },
]

// --- MEDIUM-RISK patterns (log only, no block) ---
const MEDIUM_RISK_PATTERNS: Array<{ pattern: RegExp; flag: string }> = [
  { pattern: /\d+\s*(mg|iu|mcg|ml|g)\s*(per|\/|daily|weekly|eod|twice)/i, flag: 'Dosage-like numbers with units' },
  { pattern: /\d+\s*(week|day|month)s?\s*(of|cycle|run|blast|cruise)/i, flag: 'Cycle-structured timing' },
  { pattern: /\b(blast phase|cruise phase)\b/i, flag: 'Cycle phase language' },
  { pattern: /\b(recommend|suggest)(?!\s+consult)\b|\b(consider using|add \d+|include \d+)\b/i, flag: 'Overly prescriptive language' },
  { pattern: /\b(trenbolone|trestolone|anadrol|dianabol|tren|deca)\b/i, flag: 'PED compound mention without qualifier' },
  { pattern: /^[Yy]ou\s+(should|must|need to|can)\s+(?!consult)/m, flag: 'Sentence starting with You + action verb' },
]

// --- LOW-RISK / warning patterns ---
const LOW_RISK_PATTERNS: Array<{ pattern: RegExp; flag: string }> = [
  { pattern: /\b(protocol|stack)\b(?!.*(educational|commonly|user-provided|context))/i, flag: 'Protocol/stack without heavy educational framing' },
  { pattern: /\b(will|expect)\b(?!.*(may|commonly|some|variability|individual))/i, flag: 'Definitive language without probabilistic qualifier' },
]

// --- Required disclaimer phrases (at least 2 must be present) ---
const REQUIRED_DISCLAIMER_PHRASES = [
  'educational purposes only',
  'not medical advice',
  'consult',
  'professional',
  'physician',
  'variability',
  'individual responses vary',
  'educational only',
]

// --- Alert rate limit: max 5 per hour per route ---
const ALERT_RATE_LIMIT = 5
const ALERT_WINDOW_MS = 60 * 60 * 1000
const alertCounts: Map<string, { count: number; resetAt: number }> = new Map()

function checkRateLimit(route: string): boolean {
  const now = Date.now()
  const key = route
  const entry = alertCounts.get(key)
  if (!entry) {
    alertCounts.set(key, { count: 1, resetAt: now + ALERT_WINDOW_MS })
    return true
  }
  if (now > entry.resetAt) {
    alertCounts.set(key, { count: 1, resetAt: now + ALERT_WINDOW_MS })
    return true
  }
  if (entry.count >= ALERT_RATE_LIMIT) return false
  entry.count++
  return true
}

/**
 * Scan output string for compliance violations
 */
function scanOutput(outputStr: string): { flags: string[]; high: number; medium: number; low: number } {
  const flags: string[] = []
  let high = 0
  let medium = 0
  let low = 0

  for (const { pattern, flag } of HIGH_RISK_PATTERNS) {
    if (pattern.test(outputStr)) {
      flags.push(`[HIGH] ${flag}`)
      high++
    }
  }

  for (const { pattern, flag } of MEDIUM_RISK_PATTERNS) {
    if (pattern.test(outputStr)) {
      flags.push(`[MED] ${flag}`)
      medium++
    }
  }

  for (const { pattern, flag } of LOW_RISK_PATTERNS) {
    if (pattern.test(outputStr)) {
      flags.push(`[LOW] ${flag}`)
      low++
    }
  }

  // Check for missing disclaimers
  const lower = outputStr.toLowerCase()
  const disclaimerCount = REQUIRED_DISCLAIMER_PHRASES.filter((p) => lower.includes(p)).length
  if (disclaimerCount < 2) {
    flags.push(`[MED] Missing disclaimers (found ${disclaimerCount}/2+ required)`)
    medium++
  }

  // Catastrophic slang (stack-education / educational outputs)
  for (const pattern of CATASTROPHIC_SLANG_PATTERNS) {
    if (pattern.test(outputStr)) {
      flags.push(`[MED] Catastrophic slang (suicide/nukes/minefield/cratering/hell)`)
      medium++
      break
    }
  }

  return { flags, high, medium, low }
}

/**
 * Stack-education specific: require variability phrases in output
 */
export function checkStackEducationVariability(outputStr: string): string[] {
  const lower = outputStr.toLowerCase()
  const hasVariability = VARIABILITY_PHRASES.some((p) => lower.includes(p.toLowerCase()))
  if (!hasVariability) {
    return ['[MED] Missing variability phrase (vary dramatically / individual responses vary)']
  }
  return []
}

/**
 * If output is JSON, parse and check specific keys for problematic language
 */
function scanJsonKeys(obj: unknown, outputStr: string): string[] {
  const extraFlags: string[] = []
  if (typeof obj !== 'object' || obj === null) return extraFlags

  const str = outputStr.toLowerCase()
  const checkObj = (o: unknown, path: string) => {
    if (typeof o === 'string') {
      if (/will (see|experience|expect)/.test(o) && !/may|commonly|some|variability/.test(o)) {
        extraFlags.push(`[LOW] ${path}: definitive language without qualifier`)
      }
    } else if (Array.isArray(o)) {
      o.forEach((item, i) => checkObj(item, `${path}[${i}]`))
    } else if (o && typeof o === 'object') {
      Object.entries(o).forEach(([k, v]) => checkObj(v, `${path}.${k}`))
    }
  }

  checkObj(obj, 'root')
  return extraFlags
}

/**
 * Main monitor function
 */
export async function monitorOutput(
  query: string,
  output: string | object,
  route: string,
  userId?: string | null
): Promise<MonitorResult> {
  const outputStr = typeof output === 'object' ? JSON.stringify(output) : output
  const { flags: scanFlags, high, medium, low } = scanOutput(outputStr)

  let flags = [...scanFlags]
  let mediumCount = medium

  // Parse JSON and check keys if applicable
  if (typeof output === 'object') {
    flags.push(...scanJsonKeys(output, outputStr))
  } else {
    try {
      const parsed = JSON.parse(outputStr)
      flags.push(...scanJsonKeys(parsed, outputStr))
    } catch {
      // Not JSON, skip
    }
  }

  // Stack-education route: require variability phrases
  if (route === 'stack-education') {
    const varFlags = checkStackEducationVariability(outputStr)
    flags.push(...varFlags)
    if (varFlags.length > 0) mediumCount++
  }

  const status: ComplianceStatus =
    high > 0 ? 'HIGH_RISK' : flags.length > 0 ? 'FLAGGED' : 'OK'

  const details = {
    highRiskCount: high,
    mediumRiskCount: mediumCount,
    lowRiskCount: low,
  }

  // Log to DB (use admin client to bypass RLS)
  if (flags.length > 0) {
    try {
      const supabase = createSupabaseAdminClient()
      const severity = status === 'HIGH_RISK' ? 'high' : flags.some((f) => f.startsWith('[HIGH]')) ? 'high' : flags.some((f) => f.startsWith('[MED]')) ? 'medium' : 'low'
      await supabase.from('compliance_flags').insert({
        user_id: userId ?? null,
        route,
        query: query.slice(0, 500),
        output: outputStr.slice(0, 2000),
        flags: flags,
        severity,
        acknowledged: false,
      })
    } catch (err) {
      console.error('[Compliance] Failed to log flag:', err)
    }
  }

  // Slack alert for high-risk or many flags (opt-in via env)
  const alertsEnabled = process.env.COMPLIANCE_ALERTS_ENABLED === 'true'
  if (alertsEnabled && (status === 'HIGH_RISK' || flags.length > 4)) {
    if (checkRateLimit(route)) {
      await sendSlackAlert(route, query, flags, status)
    }
  }

  return { flags, status, details }
}

/**
 * Send Slack alert to #compliance-alerts
 */
async function sendSlackAlert(
  route: string,
  query: string,
  flags: string[],
  status: ComplianceStatus
): Promise<void> {
  const webhookUrl = process.env.SLACK_COMPLIANCE_WEBHOOK_URL
  if (!webhookUrl) {
    console.warn('[Compliance] SLACK_COMPLIANCE_WEBHOOK_URL not set — skipping Slack alert')
    return
  }

  const topFlags = flags.slice(0, 3).join('\n• ')
  const payload = {
    text: `🚨 *Compliance Alert* (${status})`,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Route:* \`${route}\`\n*Flags:* ${flags.length}\n*Top flags:*\n• ${topFlags}`,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Query snippet:*\n> ${query.slice(0, 200)}${query.length > 200 ? '...' : ''}`,
        },
      },
    ],
  }

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      console.error('[Compliance] Slack webhook failed:', res.status, await res.text())
    }
  } catch (err) {
    console.error('[Compliance] Slack alert error:', err)
  }
}
