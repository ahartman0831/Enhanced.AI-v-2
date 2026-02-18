/**
 * Parse Grok breakdown response into DB row format.
 * Handles monitoring_markers as strings or objects like { marker: "HDL" }.
 */
export function parseBreakdownForDb(breakdown: Record<string, unknown>, compoundName: string) {
  const arr = (v: unknown): string[] | null =>
    Array.isArray(v) ? v.map(String) : null
  const str = (v: unknown): string | null =>
    v != null && typeof v === 'string' ? v : null

  function toStrArray(v: unknown): string[] | null {
    if (!Array.isArray(v)) return null
    return v
      .map((item) => {
        if (typeof item === 'string') return item
        if (typeof item === 'object' && item !== null && 'marker' in item) {
          const val = (item as { marker?: string }).marker
          return val != null ? String(val) : ''
        }
        return String(item)
      })
      .filter(Boolean)
  }

  return {
    name: compoundName,
    category: 'Other',
    common_uses: str(breakdown.bodybuilding_discussions) ?? str(breakdown.medical_uses) ?? null,
    risk_score: 5,
    affected_systems: arr(breakdown.affected_systems),
    key_monitoring_markers: toStrArray(breakdown.monitoring_markers) ?? arr(breakdown.monitoring_markers),
    nutrition_impact_summary: str(breakdown.nutrition_impact) ?? null,
    what_it_is: str(breakdown.what_it_is) ?? null,
    side_effects: str(breakdown.risks_and_side_effects) ?? null,
    full_breakdown_json: breakdown,
    breakdown_updated_at: new Date().toISOString(),
  }
}
