/**
 * Trend indicator mapping for bloodwork graphing.
 * Educational only — based on community/literature patterns.
 * Green ↑ = often associated with positive patterns; Red ↓ = often associated with risk patterns.
 * Individual variability emphasized. Not medical advice.
 */

export type TrendDirection = 'up' | 'down' | 'stable'

export interface MarkerTrendConfig {
  /** Marker name (normalized for matching) */
  marker: string
  /** When value goes UP: 'positive' = green, 'risk' = red/amber, 'neutral' = gray */
  upMeans: 'positive' | 'risk' | 'neutral'
  /** When value goes DOWN: 'positive' | 'risk' | 'neutral' */
  downMeans: 'positive' | 'risk' | 'neutral'
  /** Short educational tooltip for up trend */
  upTooltip: string
  /** Short educational tooltip for down trend */
  downTooltip: string
  /** Layman's "What it is" */
  whatItIs?: string
  /** Layman's "Why monitor" */
  whyMonitor?: string
}

/** Normalized marker name patterns for matching (case-insensitive, partial) */
const MARKER_PATTERNS: MarkerTrendConfig[] = [
  // Lipids — HDL up = positive, down = risk
  {
    marker: 'HDL Cholesterol',
    upMeans: 'positive',
    downMeans: 'risk',
    upTooltip: 'Often associated with improved lipid patterns in forums (e.g., better cardiovascular markers).',
    downTooltip: 'May correlate with cardiovascular risk patterns in literature—variability high.',
    whatItIs: '"Good" cholesterol that helps clear arteries.',
    whyMonitor: 'Monitoring commonly discussed for heart health in optimization communities.',
  },
  {
    marker: 'HDL',
    upMeans: 'positive',
    downMeans: 'risk',
    upTooltip: 'Often associated with improved lipid patterns in forums (e.g., better cardiovascular markers).',
    downTooltip: 'May correlate with cardiovascular risk patterns in literature—variability high.',
    whatItIs: '"Good" cholesterol that helps clear arteries.',
    whyMonitor: 'Monitoring commonly discussed for heart health in optimization communities.',
  },
  {
    marker: 'LDL',
    upMeans: 'risk',
    downMeans: 'positive',
    upTooltip: 'May correlate with cardiovascular risk patterns in literature—individual variability emphasized.',
    downTooltip: 'Often associated with improved lipid patterns in optimization communities.',
  },
  {
    marker: 'Total Cholesterol',
    upMeans: 'risk',
    downMeans: 'positive',
    upTooltip: 'May correlate with lipid risk patterns—context-dependent; literature stresses variability.',
    downTooltip: 'Often discussed as improved lipid profile in certain contexts.',
  },
  {
    marker: 'Triglycerides',
    upMeans: 'risk',
    downMeans: 'positive',
    upTooltip: 'May correlate with metabolic risk patterns in literature.',
    downTooltip: 'Often associated with improved metabolic markers in forums.',
  },
  // Hormones
  {
    marker: 'Testosterone Total',
    upMeans: 'positive',
    downMeans: 'risk',
    upTooltip: 'Often associated with improved energy/muscle patterns in optimization communities.',
    downTooltip: 'May correlate with fatigue/HPTA patterns—forums stress physician oversight.',
    whatItIs: 'Key male hormone affecting energy, muscle, and libido.',
    whyMonitor: 'Trends often tied to strength, recovery, and energy in communities.',
  },
  {
    marker: 'Total Testosterone',
    upMeans: 'positive',
    downMeans: 'risk',
    upTooltip: 'Often associated with improved energy/muscle patterns in optimization communities.',
    downTooltip: 'May correlate with fatigue/HPTA patterns—forums stress physician oversight.',
    whatItIs: 'Key male hormone affecting energy, muscle, and libido.',
    whyMonitor: 'Trends often tied to strength, recovery, and energy in communities.',
  },
  {
    marker: 'Free Testosterone',
    upMeans: 'positive',
    downMeans: 'risk',
    upTooltip: 'Often discussed for tracking bioavailable androgen patterns.',
    downTooltip: 'May correlate with suppression patterns—literature emphasizes variability.',
  },
  {
    marker: 'LH',
    upMeans: 'positive',
    downMeans: 'risk',
    upTooltip: 'Often associated with HPTA recovery patterns in literature.',
    downTooltip: 'May correlate with suppression patterns—communities urge monitoring.',
  },
  {
    marker: 'FSH',
    upMeans: 'positive',
    downMeans: 'risk',
    upTooltip: 'Often associated with HPTA recovery patterns in forums.',
    downTooltip: 'May correlate with suppression patterns—individual variability high.',
  },
  {
    marker: 'Estradiol',
    upMeans: 'risk',
    downMeans: 'neutral',
    upTooltip: 'May correlate with estrogen-related patterns (gyno/mood)—forums stress variability.',
    downTooltip: 'Often discussed for balance—context-dependent.',
    whatItIs: 'Estrogen hormone; balance preferred.',
    whyMonitor: 'Highs/lows discussed with mood, gyno, joint patterns in forums.',
  },
  {
    marker: 'E2',
    upMeans: 'risk',
    downMeans: 'neutral',
    upTooltip: 'May correlate with estrogen-related patterns in literature.',
    downTooltip: 'Often discussed for balance—context-dependent.',
  },
  {
    marker: 'Prolactin',
    upMeans: 'risk',
    downMeans: 'positive',
    upTooltip: 'May correlate with libido/mood patterns in certain contexts.',
    downTooltip: 'Often associated with improved dopamine balance in forums.',
    whatItIs: 'Dopamine-related hormone from pituitary.',
    whyMonitor: 'Highs linked to libido/mood in 19-nor discussions.',
  },
  {
    marker: 'SHBG',
    upMeans: 'neutral',
    downMeans: 'neutral',
    upTooltip: 'Context-dependent—often discussed for free hormone availability.',
    downTooltip: 'Context-dependent—literature notes individual variability.',
  },
  // Liver
  {
    marker: 'ALT',
    upMeans: 'risk',
    downMeans: 'positive',
    upTooltip: 'May correlate with liver strain patterns—forums stress variability.',
    downTooltip: 'Often associated with improved hepatic markers in communities.',
    whatItIs: 'Liver enzyme indicating cellular activity.',
    whyMonitor: 'Elevations frequently noted in oral compound contexts.',
  },
  {
    marker: 'AST',
    upMeans: 'risk',
    downMeans: 'positive',
    upTooltip: 'May correlate with hepatic stress patterns in literature.',
    downTooltip: 'Often discussed as improved liver markers in forums.',
  },
  {
    marker: 'GGT',
    upMeans: 'risk',
    downMeans: 'positive',
    upTooltip: 'May correlate with liver stress patterns—individual variability high.',
    downTooltip: 'Often associated with improved hepatic markers.',
  },
  // Kidney
  {
    marker: 'Creatinine',
    upMeans: 'risk',
    downMeans: 'neutral',
    upTooltip: 'May correlate with kidney stress patterns—literature stresses oversight.',
    downTooltip: 'Context-dependent—often within normal variation.',
  },
  {
    marker: 'eGFR',
    upMeans: 'positive',
    downMeans: 'risk',
    upTooltip: 'Often associated with improved kidney function patterns.',
    downTooltip: 'May correlate with kidney function patterns—physician review recommended.',
  },
  // Blood
  {
    marker: 'Hematocrit',
    upMeans: 'risk',
    downMeans: 'positive',
    upTooltip: 'May correlate with viscosity/thrombosis risk patterns in literature.',
    downTooltip: 'Often discussed as improved flow in TRT/EPO contexts.',
    whatItIs: 'Proportion of red blood cells; affects blood thickness.',
    whyMonitor: 'Highs associated with clotting risks in some protocols.',
  },
  {
    marker: 'Hemoglobin',
    upMeans: 'risk',
    downMeans: 'neutral',
    upTooltip: 'May correlate with viscosity patterns—forums stress variability.',
    downTooltip: 'Context-dependent—often within normal variation.',
  },
  // Metabolic
  {
    marker: 'Glucose',
    upMeans: 'risk',
    downMeans: 'neutral',
    upTooltip: 'May correlate with metabolic risk patterns in literature.',
    downTooltip: 'Context-dependent—confirm with physician.',
  },
  {
    marker: 'HbA1c',
    upMeans: 'risk',
    downMeans: 'positive',
    upTooltip: 'May correlate with long-term metabolic patterns.',
    downTooltip: 'Often associated with improved metabolic markers in forums.',
  },
  {
    marker: 'Insulin',
    upMeans: 'risk',
    downMeans: 'positive',
    upTooltip: 'May correlate with insulin resistance patterns—variability high.',
    downTooltip: 'Often discussed as improved metabolic sensitivity.',
  },
  // Inflammation
  {
    marker: 'CRP',
    upMeans: 'risk',
    downMeans: 'positive',
    upTooltip: 'May correlate with inflammation patterns in literature.',
    downTooltip: 'Often associated with reduced inflammation in communities.',
  },
  // Vitamins
  {
    marker: 'Vitamin D',
    upMeans: 'positive',
    downMeans: 'risk',
    upTooltip: 'Often associated with improved bone/immune patterns in forums.',
    downTooltip: 'May correlate with deficiency patterns—supplementation often discussed.',
  },
  {
    marker: 'Ferritin',
    upMeans: 'risk',
    downMeans: 'neutral',
    upTooltip: 'May correlate with iron overload patterns—context-dependent.',
    downTooltip: 'Often discussed for deficiency—individual variability.',
  },
]

/** Normalize marker name for lookup (lowercase, trim) */
function normalizeMarker(name: string): string {
  return name.trim().toLowerCase()
}

/**
 * Get trend indicator config for a marker.
 * Returns config for best match, or default neutral.
 */
export function getTrendConfig(markerName: string): MarkerTrendConfig | null {
  const norm = normalizeMarker(markerName)
  for (const config of MARKER_PATTERNS) {
    if (norm.includes(normalizeMarker(config.marker)) || normalizeMarker(config.marker).includes(norm)) {
      return config
    }
  }
  return null
}

/**
 * Get layman's explanation for a marker (what it is, why monitor).
 */
export function getLaymanNotes(markerName: string): { whatItIs: string; whyMonitor: string } | null {
  const config = getTrendConfig(markerName)
  if (!config?.whatItIs || !config?.whyMonitor) return null
  return { whatItIs: config.whatItIs, whyMonitor: config.whyMonitor }
}

/**
 * Determine indicator type (positive/risk/neutral) for a trend.
 */
export function getTrendIndicator(
  markerName: string,
  direction: TrendDirection
): { type: 'positive' | 'risk' | 'neutral'; tooltip: string } {
  if (direction === 'stable') {
    return { type: 'neutral', tooltip: 'Trend stable—individual variability emphasized.' }
  }
  const config = getTrendConfig(markerName)
  if (!config) {
    return {
      type: 'neutral',
      tooltip: 'Trend direction—context-dependent. Consult physician for interpretation.',
    }
  }
  const type = direction === 'up' ? config.upMeans : config.downMeans
  const tooltip = direction === 'up' ? config.upTooltip : config.downTooltip
  return { type, tooltip }
}
