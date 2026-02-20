import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Fetch anonymized community insights for the given compound names.
 * Queries compound_interest and side_effects trends from anonymized_trends.
 * Returns a formatted string for prompt context, or null if no insights.
 */
export async function getCommunityInsightsForCompounds(
  supabase: SupabaseClient,
  compoundNames: string[]
): Promise<string | null> {
  if (!compoundNames.length) return null

  const normalized = compoundNames.map((n) => String(n).trim()).filter(Boolean)
  if (!normalized.length) return null

  const { data: trends, error } = await supabase
    .from('anonymized_trends')
    .select('category, subgroup, metric, value')
    .in('category', ['compound_interest', 'side_effects'])
    .order('calculated_at', { ascending: false })
    .limit(20)

  if (error || !trends?.length) return null

  const parts: string[] = []

  for (const trend of trends) {
    if (trend.category === 'compound_interest' && trend.subgroup) {
      const match = normalized.some(
        (n) => n.toLowerCase() === trend.subgroup?.toLowerCase()
      )
      if (match && trend.value?.count != null) {
        parts.push(
          `${trend.subgroup}: ${trend.value.count} community exploration checks`
        )
      }
    } else if (trend.category === 'side_effects' && trend.subgroup) {
      const [compound] = String(trend.subgroup).split('::')
      const match = normalized.some(
        (n) => n.toLowerCase() === compound?.toLowerCase()
      )
      if (match && trend.value?.count != null) {
        parts.push(
          `${trend.subgroup?.replace('::', ' with ')}: ${trend.value.count} reports`
        )
      }
    }
  }

  if (parts.length === 0) return null
  return parts.slice(0, 5).join('; ')
}
