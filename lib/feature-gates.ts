/**
 * Feature-to-tier mapping for subscription gating.
 * Free: compounds, order blood test, Profile, subscription, dashboard
 * Pro: Free + Stack Explorer, Side Effects, Progress Photos, Results Forecaster, Counterfeit Checker, Supplement Analyzer
 * Elite: ALL (Pro + Bloodwork Parser, Bloodwork History, Recovery Timeline, Telehealth Referral)
 */

export type RequiredTier = 'free' | 'pro' | 'elite'

/** Path -> minimum required tier. Paths not listed are free. */
export const FEATURE_GATES: Record<string, RequiredTier> = {
  // Pro features
  '/stack-explorer': 'pro',
  /* STACK_EDUCATION_FEATURE START */ '/stack-education': 'pro', /* STACK_EDUCATION_FEATURE END */
  '/side-effects': 'pro',
  '/progress-photos': 'pro',
  '/results-forecaster': 'pro',
  '/counterfeit-checker': 'pro',
  '/supplement-analyzer': 'pro',

  // Elite features
  '/bloodwork-parser': 'elite',
  '/bloodwork-history': 'elite',
  '/recovery-timeline': 'elite',
  '/telehealth-referral': 'elite',
}

/** Get required tier for a path. Returns 'free' if path is not gated. */
export function getRequiredTier(path: string): RequiredTier {
  const normalized = path.replace(/\/$/, '') || '/'
  return FEATURE_GATES[normalized] ?? 'free'
}
