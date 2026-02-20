/**
 * Subscription gating helpers – use profiles.subscription_tier as source of truth.
 * Pro = paid tier (labs, trends). Elite = highest tier (higher caps, deeper insights).
 */

export type SubscriptionTier = 'free' | 'pro' | 'paid' | 'elite'

/** Normalize tier: 'paid' and 'pro' both mean Pro */
export function normalizeTier(tier: string | null | undefined): SubscriptionTier {
  const t = (tier ?? 'free').toLowerCase().trim()
  if (t === 'elite') return 'elite'
  if (t === 'pro' || t === 'paid') return 'pro'
  return 'free'
}

/** User has Pro or Elite (any paid plan) */
export function isPaid(tier: string | null | undefined): boolean {
  const t = normalizeTier(tier)
  return t === 'pro' || t === 'elite'
}

/** User has Elite tier */
export function isElite(tier: string | null | undefined): boolean {
  return normalizeTier(tier) === 'elite'
}

/** Check if user can access a feature (server-side) */
export function canAccessFeature(
  tier: string | null | undefined,
  feature: 'pro' | 'elite'
): boolean {
  const t = normalizeTier(tier)
  if (feature === 'elite') return t === 'elite'
  if (feature === 'pro') return t === 'pro' || t === 'elite'
  return false
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
/** Fetch subscription tier from profile (server-side). Pass Supabase client and user id. */
export async function getSubscriptionTier(supabase: any, userId: string): Promise<string> {
  const { data } = await supabase.from('profiles').select('subscription_tier').eq('id', userId).single()
  return (data?.subscription_tier as string) || 'free'
}

/** Require Pro or Elite for a route. Returns 403 JSON if not allowed. */
export function requireTier(
  tier: string | null | undefined,
  feature: 'pro' | 'elite'
): { allowed: true } | { allowed: false; response: Response } {
  if (canAccessFeature(tier, feature)) {
    return { allowed: true }
  }
  return {
    allowed: false,
    response: new Response(
      JSON.stringify({
        error: feature === 'elite'
          ? 'Elite subscription required. Upgrade to access this feature.'
          : 'Pro subscription required. Upgrade to access this feature.',
        upgradeRequired: true,
      }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    ),
  }
}
