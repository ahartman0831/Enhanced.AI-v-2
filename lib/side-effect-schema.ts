import { z } from 'zod'

const CommonSupportSchema = z.object({
  name: z.string(),
  common_purpose: z.string(),
  affected_system: z.string(),
  amazon_affiliate_link: z.string().optional(),
  partnership_note: z.string().optional(),
})

export const SideEffectAnalysisSchema = z.object({
  compoundAnalysis: z.array(z.object({
    compoundName: z.string(),
    reportedEffects: z.array(z.string()).default([]),
    potentialMechanisms: z.array(z.string()).default([]),
    commonManagement: z.array(z.string()).default([]),
    monitoringMarkers: z.array(z.string()).default([]),
    riskLevel: z.enum(['low', 'medium', 'high']).default('medium'),
  })).default([]),
  interactions: z.array(z.object({
    compounds: z.array(z.string()),
    potentialEffects: z.array(z.string()).default([]),
    management: z.array(z.string()).default([]),
  })).default([]),
  nutritionImpact: z.object({
    dietaryConsiderations: z.string().optional().default(''),
    supplementInteractions: z.string().optional().default(''),
    timingStrategies: z.string().optional().default(''),
    supportiveNutrition: z.string().optional().default(''),
  }).optional().default({ dietaryConsiderations: '', supplementInteractions: '', timingStrategies: '', supportiveNutrition: '' }),
  monitoringProtocol: z.array(z.string()).default([]),
  educationalNotes: z.string().default(''),
  harmReductionObservations: z.array(z.string()).default([]),
  harmReductionPlainLanguage: z.string().optional(),
  commonlyDiscussedSupports: z.array(CommonSupportSchema).default([]),
}).passthrough()

export type SideEffectAnalysis = z.infer<typeof SideEffectAnalysisSchema>

/** Forbidden patterns: doses, cycles, protocols, prescriptive language */
const FORBIDDEN_PATTERNS = [
  /\b\d+\s*(mg|mcg|ml|iu|g|units?)\b/gi,
  /\b\d+\s*week\s*(cycle|run)\b/gi,
  /\b(blast|cruise|pct)\b/gi,
  /\b(take|use|inject|pin)\s+\d+/gi,
  /\b\d+\s*(x|times)\s*(daily|per week|per day)\b/gi,
  /\b(eod|every other day)\s+\d+/gi,
  /\b(cycle length|run length|protocol length)\b/gi,
]

/**
 * Detect if text contains forbidden dose/cycle/protocol content.
 * Returns true if forbidden content is found.
 */
export function containsForbiddenContent(text: string): boolean {
  const normalized = String(text || '').toLowerCase()
  return FORBIDDEN_PATTERNS.some((re) => re.test(normalized))
}

/**
 * Recursively check an object for forbidden content in string values.
 */
export function scanForForbiddenContent(obj: unknown): string[] {
  const violations: string[] = []
  const scan = (val: unknown, path: string) => {
    if (typeof val === 'string') {
      if (containsForbiddenContent(val)) {
        violations.push(`${path}: contains doses/cycles/protocols`)
      }
    } else if (Array.isArray(val)) {
      val.forEach((item, i) => scan(item, `${path}[${i}]`))
    } else if (val && typeof val === 'object') {
      Object.entries(val).forEach(([k, v]) => scan(v, path ? `${path}.${k}` : k))
    }
  }
  scan(obj, '')
  return violations
}

/**
 * Validate and parse side effect analysis response.
 * Returns { success, data, error }.
 */
export function validateSideEffectAnalysis(raw: unknown): {
  success: boolean
  data?: SideEffectAnalysis
  error?: string
} {
  const violations = scanForForbiddenContent(raw)
  if (violations.length > 0) {
    console.warn('[SideEffect] Forbidden content detected:', violations)
    return {
      success: false,
      error: 'Response contained forbidden content (doses/cycles). Please try again.',
    }
  }

  const result = SideEffectAnalysisSchema.safeParse(raw)
  if (!result.success) {
    const issues = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')
    return {
      success: false,
      error: `Invalid response structure: ${issues}`,
    }
  }

  return { success: true, data: result.data }
}
