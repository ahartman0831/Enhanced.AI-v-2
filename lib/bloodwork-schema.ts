import { z } from 'zod'

const MarkerAnalysisSchema = z.object({
  marker: z.string(),
  value: z.string(),
  referenceRange: z.string(),
  status: z.enum(['within_range', 'above_range', 'below_range']),
  educationalNotes: z.string(),
  commonInfluences: z.array(z.string()).default([]),
  monitoringImportance: z.string(),
})

const PatternRecognitionSchema = z.object({
  hormonalProfile: z.string(),
  metabolicMarkers: z.string(),
  inflammationMarkers: z.string(),
  liverKidneyFunction: z.string(),
  androgenicEstrogenicBalance: z.string().optional(),
  suppressionPatterns: z.string().optional(),
}).passthrough()

const FlagSchema = z.object({
  severity: z.enum(['low', 'medium', 'high']),
  category: z.string(),
  description: z.string(),
  educationalContext: z.string(),
  recommendations: z.array(z.string()).default([]),
})

const ProjectionsSchema = z.object({
  shortTerm: z.string(),
  mediumTerm: z.string(),
  longTerm: z.string(),
  influencingFactors: z.array(z.string()).default([]),
})

const LaymanExplanationSchema = z.object({
  whatItIs: z.string(),
  whyMonitor: z.string(),
}).optional()

const MitigationObservationSchema = z.object({
  marker: z.string(),
  laymanExplanation: LaymanExplanationSchema,
  commonlyDiscussedMitigations: z.string(),
  observationalRisks: z.string(),
  actionableSteps: z.string(),
  amazonLink: z.string().optional(),
  amazonProductName: z.string().optional(),
})

export const BloodworkAnalysisSchema = z.object({
  analysisSummary: z.object({
    testDate: z.string(),
    totalMarkers: z.number(),
    markersAnalyzed: z.number(),
    keyObservations: z.array(z.string()).default([]),
  }),
  markerAnalysis: z.array(MarkerAnalysisSchema).default([]),
  patternRecognition: PatternRecognitionSchema,
  flags: z.array(FlagSchema).default([]),
  projections: ProjectionsSchema,
  harmReductionObservations: z.array(z.string()).default([]),
  harmReductionPlainLanguage: z.string().optional(),
  mitigationObservations: z.array(MitigationObservationSchema).default([]),
  educationalRecommendations: z.array(z.string()).default([]),
}).passthrough()

export type BloodworkAnalysis = z.infer<typeof BloodworkAnalysisSchema>

/**
 * Validate bloodwork analysis response.
 * Returns { success, data, error }.
 */
export function validateBloodworkAnalysis(raw: unknown): {
  success: boolean
  data?: BloodworkAnalysis
  error?: string
} {
  const result = BloodworkAnalysisSchema.safeParse(raw)
  if (!result.success) {
    const issues = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')
    return {
      success: false,
      error: `Invalid bloodwork response structure: ${issues}`,
    }
  }
  return { success: true, data: result.data }
}
