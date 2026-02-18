/**
 * HPTA suppression pattern detection for side effect analyzer.
 * Observational only — never blocks, never personalizes.
 * Detects when user has strongly suppressive compounds WITHOUT a Test base.
 */

const HPTA_SUPPRESSORS = [
  'trenbolone', 'tren',
  'deca-durabolin', 'deca', 'nandrolone',
  'trestolone', 'trest',
  'ostarine', 'lgd-4033', 'rad-140', 'yk-11', 's-23', 'andarine', 's-4',
  'anadrol', 'superdrol', 'dianabol', 'dbol', 'halotestin', 'halo',
  'winstrol', 'anavar', 'turinabol', 'epistane',
]

const TEST_BASE_PATTERNS = [
  'testosterone', 'test', 'sustanon', 'cypionate', 'enanthate', 'propionate',
  'omnadren', 'depo-testosterone',
]

function normalize(s: string): string {
  return s.toLowerCase().replace(/[\s\-()]/g, '')
}

/** Check if compound list contains any HPTA suppressors */
function hasSuppressors(compoundNames: string[]): boolean {
  const normalized = compoundNames.map(normalize)
  return HPTA_SUPPRESSORS.some((pattern) =>
    normalized.some((n) => n.includes(pattern))
  )
}

/** Check if compound list contains a Test base */
function hasTestBase(compoundNames: string[]): boolean {
  const normalized = compoundNames.map(normalize)
  return TEST_BASE_PATTERNS.some((pattern) =>
    normalized.some((n) => n.includes(pattern))
  )
}

/**
 * Compute HPTA suppression context for prompt injection.
 * Returns context string when suppressors present WITHOUT Test base; otherwise empty.
 */
export function computeHptaSuppressionContext(compoundNames: string[]): string {
  if (!hasSuppressors(compoundNames)) return ''
  if (hasTestBase(compoundNames)) return ''

  return (
    'Input matches patterns commonly discussed for HPTA suppression without exogenous testosterone base. ' +
    'EXPAND harmReductionObservations and monitoringProtocol with general community and literature notes on monitoring LH/FSH/Testosterone levels and physician oversight. ' +
    'Use ONLY observational framing (e.g., "In advanced forums...", "Literature often notes...", "Experienced users commonly share..."). ' +
    'Include educational CTA: hormone panels via Quest or LetsGetChecked. NEVER personalize, never suggest adding compounds, never use alarming language.'
  )
}
