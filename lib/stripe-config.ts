/**
 * Stripe price IDs – replace with real IDs from Stripe Dashboard
 * Create products/prices in Stripe: Dashboard > Products > Add product
 * Monthly billing only.
 */
export const STRIPE_PRICE_IDS: Record<string, string> = {
  pro_monthly: process.env.STRIPE_PRICE_PRO_MONTHLY || 'price_pro_monthly_placeholder',
  elite_monthly: process.env.STRIPE_PRICE_ELITE_MONTHLY || 'price_elite_monthly_placeholder',
}

/** Map Stripe price ID to subscription tier */
export function priceIdToTier(priceId: string): 'pro' | 'elite' | null {
  if (priceId === STRIPE_PRICE_IDS.pro_monthly) return 'pro'
  if (priceId === STRIPE_PRICE_IDS.elite_monthly) return 'elite'
  return null
}
