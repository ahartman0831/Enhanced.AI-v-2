'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Loader2, Crown, Award } from 'lucide-react'
import { useSubscriptionTier } from '@/hooks/useSubscriptionTier'

type TargetTier = 'pro' | 'elite'

interface UpgradeButtonProps {
  /** Target tier to upgrade to */
  targetTier?: TargetTier
  /** Button variant */
  variant?: 'default' | 'outline' | 'secondary'
  /** Custom class name */
  className?: string
  /** Button label */
  children?: React.ReactNode
}

export function UpgradeButton({
  targetTier = 'pro',
  variant = 'default',
  className = '',
  children,
}: UpgradeButtonProps) {
  const { tier, isPaid, isElite, loading } = useSubscriptionTier()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const alreadyHasAccess =
    (targetTier === 'pro' && (isPaid || isElite)) ||
    (targetTier === 'elite' && isElite)

  const handleUpgrade = async () => {
    setCheckoutLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier: targetTier, period: 'month' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to start checkout')
      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error('No checkout URL returned')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setCheckoutLoading(false)
    }
  }

  if (loading || alreadyHasAccess) {
    return null
  }

  const Icon = targetTier === 'elite' ? Crown : Award

  return (
    <>
      <Button
        variant={variant}
        className={className}
        onClick={() => setDialogOpen(true)}
      >
        {children ?? (
          <>
            <Icon className="h-4 w-4 mr-2" />
            Upgrade to {targetTier === 'elite' ? 'Elite' : 'Pro'}
          </>
        )}
      </Button>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upgrade to {targetTier === 'elite' ? 'Elite' : 'Pro'}</DialogTitle>
            <DialogDescription>
              Month-to-month billing. Cancel anytime from your account.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <p className="text-xs text-muted-foreground">
              Educational use only. Premium features do not constitute medical advice.
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleUpgrade}
              disabled={checkoutLoading}
              className={
                targetTier === 'elite'
                  ? 'bg-amber-600 hover:bg-amber-700'
                  : 'bg-cyan-600 hover:bg-cyan-700'
              }
            >
              {checkoutLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Redirecting...
                </>
              ) : (
                'Continue to checkout'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
