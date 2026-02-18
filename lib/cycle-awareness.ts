/**
 * Cycle-aware pattern detection for side effect analyzer.
 * Scans compounds to auto-include relevant ancillaries (prolactin, estrogen).
 * Educational/observational only — never prescriptive.
 */

const NINETEEN_NORS = ['trenbolone', 'tren', 'trestolone', 'trest', 'deca', 'nandrolone', 'deca-durabolin']
const HIGH_AROMATIZING = ['testosterone', 'test', 'dianabol', 'dbol', 'boldenone', 'equipoise', 'hcg']

function normalizeCompound(name: string): string {
  return name.toLowerCase().replace(/[\s\-()]/g, '')
}

/** Check if compound list contains 19-nor derivatives (prolactin-relevant) */
export function has19Nors(compoundNames: string[]): boolean {
  const normalized = compoundNames.map(normalizeCompound)
  return NINETEEN_NORS.some((pattern) =>
    normalized.some((n) => n.includes(pattern))
  )
}

/** Check if compound list contains high aromatizers (estrogen-relevant) */
export function hasHighAromatizing(compoundNames: string[]): boolean {
  const normalized = compoundNames.map(normalizeCompound)
  return HIGH_AROMATIZING.some((pattern) =>
    normalized.some((n) => n.includes(pattern))
  )
}

/** Compute cycle-awareness context string for prompt injection */
export function computeCycleAwarenessContext(compoundNames: string[]): string {
  const has19Nor = has19Nors(compoundNames)
  const hasAromatizing = hasHighAromatizing(compoundNames)

  const parts: string[] = []

  if (has19Nor) {
    parts.push(
      '19-nor compounds detected (e.g., Trenbolone, Trestolone, Deca/Nandrolone). ' +
      'AUTO-INCLUDE Cabergoline in commonlyDiscussedSupports when side effects include: Night Sweats, Libido Changes, Nausea, Increased Aggression. ' +
      'Add partnership_note: "Consider prolactin-focused blood panels via Quest [affiliate]."'
    )
  }

  if (hasAromatizing) {
    parts.push(
      'High aromatizing compounds detected (e.g., Testosterone, Dianabol, Boldenone, HCG). ' +
      'AUTO-INCLUDE Arimidex or Letrozole in commonlyDiscussedSupports when side effects include: Gynecomastia, Water Retention, Mood Changes. ' +
      'Add partnership_note: "Explore hormone consultations via telehealth [link]."'
    )
  }

  if (parts.length === 0) {
    return 'No specific cycle patterns detected. Use standard mitigation mapping.'
  }

  return parts.join(' ')
}
