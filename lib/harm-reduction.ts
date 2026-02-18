/**
 * Harm-reduction context for side effect analyzer.
 * Rule-based detection of elevated patterns. Observational only — never blocks or personalizes.
 */

/** Known high-risk synergies (compound name substrings) — community-discussed patterns */
const HIGH_RISK_SYNERGIES: string[][] = [
  ['tren', 'trest'],           // Trenbolone + Trestolone
  ['trenbolone', 'trestolone'],
  ['anadrol', 'dianabol'],    // Anadrol + Dianabol (oral stacking)
  ['anadrol', 'oral'],
  ['superdrol', 'anadrol'],
  ['halo', 'tren'],           // Halotestin + Tren
  ['tren', 'oral'],
  ['deca', 'tren'],           // Nandrolone + Tren (19-nor stacking)
  ['nandrolone', 'trenbolone'],
]

function normalizeForMatch(s: string): string {
  return s.toLowerCase().replace(/[\s\-()]/g, '')
}

/** Check if compound list contains a known high-risk synergy */
export function containsHighRiskSynergy(compoundNames: string[]): boolean {
  const normalized = compoundNames.map((n) => normalizeForMatch(n))
  return HIGH_RISK_SYNERGIES.some((pair) => {
    const [a, b] = pair
    return normalized.some((n) => n.includes(a)) && normalized.some((n) => n.includes(b))
  })
}

/** Heuristic: dosages string suggests elevated patterns (user language, not parsing amounts) */
export function dosesAppearElevated(dosages: string | undefined, _compoundCount: number): boolean {
  if (!dosages || typeof dosages !== 'string') return false
  const lower = dosages.toLowerCase()
  // Only flag when user explicitly uses elevated language — never parse actual numbers
  return lower.includes('high') || lower.includes('blast') || lower.includes('heavy') || lower.includes('aggressive')
}

/** Compute harm-reduction context string for prompt injection */
export function computeHarmReductionContext(options: {
  compounds: string[]
  compoundRiskScores: Map<string, number>  // compound name -> risk_score (1-10)
  dosages?: string
  isElevated: boolean
}): string {
  const { compounds, compoundRiskScores, dosages, isElevated } = options

  if (isElevated) {
    return `Input matches elevated community-discussed patterns (high-risk compounds and/or known synergies). EXPAND harmReductionObservations with 3-5 detailed entries. EXPAND monitoringProtocol with comprehensive bloodwork recommendations (lipid panel, liver enzymes, hormones, CBC). Emphasize: "In advanced forums and bloodwork threads, stacks like this are frequently discussed with strong emphasis on...", "Experienced users in these communities almost always stress physician oversight and baseline labs." Include affiliate stub: "Explore educational lab options via Quest or LetsGetChecked for hormone panels – affiliate supports app development." Keep tone welcoming and knowledge-focused.`
  }

  return `Standard input. Include 2-3 baseline harmReductionObservations (e.g., "Community pattern: Stacks involving [relevant compound type] are often discussed with emphasis on monitoring.", "Literature note: Individual variability is well-documented—professional supervision is a recurring theme."). Add monitoringProtocol entries. Consider Quest/LetsGetChecked mention for blood panels where relevant.`
}
