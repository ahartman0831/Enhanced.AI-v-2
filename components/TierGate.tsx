'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSubscriptionTier } from '@/hooks/useSubscriptionTier'
import { getRequiredTier } from '@/lib/feature-gates'
import { UpgradeButton } from '@/components/UpgradeButton'
import { Button } from '@/components/ui/button'
import { Crown, Award, Lock } from 'lucide-react'

/** Wraps children and shows upgrade CTA when user lacks required tier. */
export function TierGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { isPaid, isElite, loading } = useSubscriptionTier()
  const required = getRequiredTier(pathname ?? '')

  if (required === 'free') {
    return <>{children}</>
  }

  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  const hasAccess =
    required === 'pro'
      ? isPaid
      : required === 'elite'
        ? isElite
        : true

  if (hasAccess) {
    return <>{children}</>
  }

  const targetTier: 'pro' | 'elite' = required === 'elite' ? 'elite' : 'pro'
  const Icon = targetTier === 'elite' ? Crown : Award

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted">
          <Lock className="h-8 w-8 text-muted-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-bold mb-2">
            {targetTier === 'elite' ? 'Elite' : 'Pro'} Feature
          </h1>
          <p className="text-muted-foreground">
            This feature requires a {targetTier === 'elite' ? 'Elite' : 'Pro'} subscription.
            Upgrade to unlock advanced analysis and insights.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <UpgradeButton targetTier={targetTier} variant="default">
            <Icon className="h-4 w-4 mr-2" />
            Upgrade to {targetTier === 'elite' ? 'Elite' : 'Pro'}
          </UpgradeButton>
          <Button variant="outline" asChild>
            <Link href="/subscription">View plans</Link>
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          <Link href="/dashboard" className="underline hover:text-foreground">
            Return to dashboard
          </Link>
        </p>
      </div>
    </div>
  )
}
