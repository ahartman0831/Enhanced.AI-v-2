/**
 * Prioritized major + flagged markers for bloodwork history display.
 * Only these get graphs + trend indicators by default.
 * All others go under "View All Markers" accordion (raw list only).
 */

/** Canonical names for matching (case-insensitive, partial) */
const PRIORITIZED_MARKERS = [
  'Testosterone Total',
  'Total Testosterone',
  'Testosterone',
  'Testosterone Free',
  'Free Testosterone',
  'Estradiol',
  'E2',
  'Prolactin',
  'HDL Cholesterol',
  'HDL',
  'LDL Cholesterol',
  'LDL',
  'Total Cholesterol',
  'Cholesterol',
  'ALT',
  'Alanine Aminotransferase',
  'AST',
  'Aspartate Aminotransferase',
  'hsCRP',
  'CRP',
  'High Sensitivity CRP',
  'Hematocrit',
  'Hct',
  'PSA Total',
  'PSA',
]

function normalize(s: string): string {
  return s.trim().toLowerCase()
}

/**
 * Check if a marker is in the prioritized list.
 */
export function isPrioritizedMarker(markerName: string): boolean {
  const norm = normalize(markerName)
  for (const p of PRIORITIZED_MARKERS) {
    if (norm.includes(normalize(p)) || normalize(p).includes(norm)) return true
  }
  return false
}

/**
 * Split series into prioritized (graphs + trends) vs other (raw list only).
 */
export function splitByPriority(
  series: Array<{ marker: string; [key: string]: unknown }>,
  flaggedMarkers: string[] = []
): {
  prioritized: Array<{ marker: string; [key: string]: unknown }>
  other: Array<{ marker: string; [key: string]: unknown }>
} {
  const prioritized: Array<{ marker: string; [key: string]: unknown }> = []
  const other: Array<{ marker: string; [key: string]: unknown }> = []
  const flaggedSet = new Set(flaggedMarkers.map(normalize))

  for (const s of series) {
    const isFlagged = flaggedSet.has(normalize(s.marker))
    const isPrioritized = isPrioritizedMarker(s.marker)
    if (isPrioritized || isFlagged) {
      prioritized.push(s)
    } else {
      other.push(s)
    }
  }

  return { prioritized, other }
}
