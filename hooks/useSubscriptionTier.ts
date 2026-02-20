'use client'

import { useState, useEffect } from 'react'

export type SubscriptionTier = 'free' | 'paid' | 'elite'

export function useSubscriptionTier() {
  const [tier, setTier] = useState<SubscriptionTier | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    // Use subscription API as canonical source for tier (profile may lag)
    fetch('/api/subscription', { cache: 'no-store', credentials: 'include' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data?.tier != null) {
          const t = String(data.tier).toLowerCase().trim()
          if (t === 'elite') setTier('elite')
          else if (t === 'paid' || t === 'pro') setTier('paid')
          else setTier('free')
        } else if (!cancelled) {
          setTier('free')
        }
      })
      .catch(() => {
        if (!cancelled) setTier('free')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  // While loading, assume Elite so we don't briefly gate paying users
  const resolvedTier = tier ?? 'free'
  const resolvedElite = loading ? true : tier === 'elite'
  const resolvedPaid = loading ? true : (tier === 'paid' || tier === 'elite')

  return {
    tier: resolvedTier,
    isPaid: resolvedPaid,
    isElite: resolvedElite,
    loading,
  }
}
