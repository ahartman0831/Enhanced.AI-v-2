/**
 * Extract marker values from bloodwork report raw_json.
 * Handles both analysis format (markerAnalysis) and input format (key-value).
 */

export interface MarkerValue {
  marker: string
  value: string
  /** Numeric value for graphing if parseable */
  numericValue?: number
}

export interface ReportMarkers {
  reportId: string
  reportDate: string
  markers: MarkerValue[]
}

/**
 * Parse numeric value from string (e.g. "450 ng/dL" -> 450, "12.5" -> 12.5)
 */
function parseNumericValue(val: string): number | undefined {
  if (typeof val !== 'string') return undefined
  const cleaned = val.replace(/[^0-9.-]/g, ' ').trim()
  const match = cleaned.match(/-?[\d.]+/)
  if (!match) return undefined
  const num = parseFloat(match[0])
  return Number.isFinite(num) ? num : undefined
}

/**
 * Extract markers from raw_json.
 * Supports:
 * 1. Full analysis: { markerAnalysis: [{ marker, value, ... }] }
 * 2. Input format: { "Total Testosterone": { value, range, unit } } or { "Total Testosterone": "450 ng/dL" }
 */
export function extractMarkersFromReport(
  rawJson: unknown,
  reportId: string,
  reportDate: string
): ReportMarkers {
  const markers: MarkerValue[] = []

  if (!rawJson || typeof rawJson !== 'object') {
    return { reportId, reportDate, markers }
  }

  const obj = rawJson as Record<string, unknown>

  // Format 1: markerAnalysis array (camelCase or snake_case)
  const markerArr = Array.isArray(obj.markerAnalysis)
    ? obj.markerAnalysis
    : Array.isArray(obj.marker_analysis)
      ? obj.marker_analysis
      : null
  if (markerArr) {
    for (const entry of markerArr) {
      if (entry && typeof entry === 'object' && 'marker' in entry && 'value' in entry) {
        const m = entry as { marker: string; value: string }
        markers.push({
          marker: String(m.marker).trim(),
          value: String(m.value).trim(),
          numericValue: parseNumericValue(String(m.value)),
        })
      }
    }
    return { reportId, reportDate, markers }
  }

  // Format 2: key-value (input format)
  const skipKeys = new Set([
    'analysisSummary', 'markerAnalysis', 'patternRecognition', 'flags', 'projections',
    'harmReductionObservations', 'harmReductionPlainLanguage', 'mitigationObservations',
    'educationalRecommendations', 'projections'
  ])

  for (const [key, val] of Object.entries(obj)) {
    if (skipKeys.has(key)) continue
    let valueStr: string
    if (val && typeof val === 'object' && 'value' in val) {
      valueStr = String((val as { value: string }).value)
    } else if (typeof val === 'string') {
      valueStr = val
    } else {
      continue
    }
    markers.push({
      marker: key.trim(),
      value: valueStr.trim(),
      numericValue: parseNumericValue(valueStr),
    })
  }

  return { reportId, reportDate, markers }
}

export interface MarkerSeries {
  marker: string
  dataPoints: Array<{ date: string; value: string; numericValue?: number }>
  /** Computed trend: up, down, or stable */
  trend: 'up' | 'down' | 'stable'
}

/**
 * Aggregate reports into series per marker.
 * Normalizes marker names for grouping (e.g. "Total Testosterone" and "Testosterone" may merge).
 */
export function aggregateMarkerSeries(reports: ReportMarkers[]): MarkerSeries[] {
  const byMarker = new Map<string, Array<{ date: string; value: string; numericValue?: number }>>()

  for (const r of reports) {
    for (const m of r.markers) {
      const key = m.marker.trim()
      if (!key) continue
      const existing = byMarker.get(key) || []
      // Avoid duplicate dates for same marker (take latest)
      const filtered = existing.filter(p => p.date !== r.reportDate)
      filtered.push({
        date: r.reportDate,
        value: m.value,
        numericValue: m.numericValue,
      })
      byMarker.set(key, filtered)
    }
  }

  const series: MarkerSeries[] = []
  for (const [marker, points] of byMarker) {
    if (points.length === 0) continue
    const sorted = [...points].sort((a, b) => a.date.localeCompare(b.date))
    const first = sorted[0].numericValue
    const last = sorted[sorted.length - 1].numericValue
    let trend: 'up' | 'down' | 'stable' = 'stable'
    if (points.length >= 2 && first != null && last != null) {
      const diff = last - first
      if (Math.abs(diff) > 0.01) trend = diff > 0 ? 'up' : 'down'
    }
    series.push({
      marker,
      dataPoints: sorted,
      trend,
    })
  }

  return series.sort((a, b) => a.marker.localeCompare(b.marker))
}
