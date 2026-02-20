'use client'

import { usePathname } from 'next/navigation'
import { useSubscriptionTier } from '@/hooks/useSubscriptionTier'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const PROTECTED_ROUTES = ['/dashboard', '/profile', '/subscription', '/stack-explorer', '/side-effects', '/compounds', '/onboarding', '/bloodwork-parser', '/bloodwork-history', '/progress-photos', '/results-forecaster', '/recovery-timeline', '/counterfeit-checker', '/supplement-analyzer', '/telehealth-referral', '/shop']

const TIER_CONFIG = {
  free: {
    emoji: '🆓',
    label: 'Free',
    className: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-600',
  },
  paid: {
    emoji: '⭐',
    label: 'Paid',
    className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-blue-300 dark:border-blue-700',
  },
  elite: {
    emoji: '👑',
    label: 'Elite',
    className: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 border-amber-400 dark:border-amber-600',
  },
} as const

export function TierBadge() {
  const pathname = usePathname()
  const { tier, loading } = useSubscriptionTier()

  const isProtected = PROTECTED_ROUTES.some((route) => pathname?.startsWith(route))
  if (!isProtected) return null

  const config = TIER_CONFIG[tier]
  if (!config) return null

  return (
    <Badge
      variant="outline"
      className={cn(
        'shrink-0 font-medium text-xs px-2.5 py-0.5',
        config.className
      )}
    >
      {loading ? (
        <span className="animate-pulse">⋯</span>
      ) : (
        <>
          <span className="mr-1">{config.emoji}</span>
          {config.label}
        </>
      )}
    </Badge>
  )
}
