/**
 * Bloodwork mitigation context: detect flagged markers from structured data
 * and return hints for prompt injection. Observational only — never advises.
 */

type MarkerEntry = { value: string; range: string; unit?: string }

const MARKER_PATTERNS: Array<{
  keywords: string[]
  direction: 'high' | 'low'
  hint: string
}> = [
  { keywords: ['estradiol', 'e2', 'estrogen'], direction: 'high', hint: 'high E2' },
  { keywords: ['prolactin'], direction: 'high', hint: 'high Prolactin' },
  { keywords: ['testosterone', 'test', 'free test', 'total test'], direction: 'low', hint: 'low Test' },
  { keywords: ['hdl', 'hdl cholesterol'], direction: 'low', hint: 'low HDL' },
  { keywords: ['alt', 'ast', 'sgpt', 'sgot'], direction: 'high', hint: 'high ALT/AST' },
  { keywords: ['hematocrit', 'hct'], direction: 'high', hint: 'high Hematocrit' },
]

function parseRange(range: string): { min: number; max: number } | null {
  const s = String(range || '').trim()
  const dashMatch = s.match(/^([\d.]+)\s*[-–—]\s*([\d.]+)$/)
  if (dashMatch) {
    const min = parseFloat(dashMatch[1])
    const max = parseFloat(dashMatch[2])
    if (!Number.isNaN(min) && !Number.isNaN(max)) return { min, max }
  }
  const lessMatch = s.match(/^[<≤]\s*([\d.]+)$/)
  if (lessMatch) {
    const max = parseFloat(lessMatch[1])
    if (!Number.isNaN(max)) return { min: -Infinity, max }
  }
  const greaterMatch = s.match(/^[>≥]\s*([\d.]+)$/)
  if (greaterMatch) {
    const min = parseFloat(greaterMatch[1])
    if (!Number.isNaN(min)) return { min, max: Infinity }
  }
  return null
}

function parseValue(value: string): number | null {
  const v = String(value || '').replace(/[,]/g, '').trim()
  const num = parseFloat(v)
  return Number.isNaN(num) ? null : num
}

function isOutsideRange(value: number, range: { min: number; max: number }, direction: 'high' | 'low'): boolean {
  if (direction === 'high') return value > range.max
  return value < range.min
}

/**
 * Detect flagged markers from structured bloodwork data.
 * Returns list of hints like ["high E2", "low Test"] for prompt injection.
 */
export function detectFlaggedMitigationHints(bloodworkData: Record<string, unknown> | null): string[] {
  if (!bloodworkData || typeof bloodworkData !== 'object') return []

  const hints = new Set<string>()

  for (const [markerName, entry] of Object.entries(bloodworkData)) {
    if (!entry || typeof entry !== 'object') continue
    const e = entry as MarkerEntry
    const valueNum = parseValue(e.value)
    const range = parseRange(e.range)
    if (valueNum == null || !range) continue

    const nameLower = markerName.toLowerCase()

    for (const { keywords, direction, hint } of MARKER_PATTERNS) {
      if (keywords.some((k) => nameLower.includes(k)) && isOutsideRange(valueNum, range, direction)) {
        hints.add(hint)
      }
    }
  }

  return Array.from(hints)
}
