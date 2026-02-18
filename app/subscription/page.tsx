'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Star,
  Award,
  Crown,
  CheckCircle,
  AlertTriangle,
  ArrowLeft,
  CreditCard,
  Calendar
} from 'lucide-react'

type SubscriptionTier = 'free' | 'paid' | 'elite'

const TIER_FEATURES = {
  free: {
    name: 'Free',
    price: 0,
    description: 'Perfect for getting started',
    features: [
      'Basic compound database',
      'Educational analysis',
      'Progress tracking',
      'Community discussions'
    ],
    icon: Star,
    className: ''
  },
  paid: {
    name: 'Pro',
    price: 19,
    description: 'Advanced analysis tools',
    features: [
      'Everything in Free, plus:',
      'Stack Explorer',
      'Bloodwork analysis',
      'Photo progress tracking',
      'Side effects monitoring',
      'Advanced reporting',
      'Priority support'
    ],
    icon: Award,
    className: 'border-cyan-500/50 shadow-lg shadow-cyan-500/10'
  },
  elite: {
    name: 'Elite',
    price: 39,
    description: 'Professional-grade health optimization',
    features: [
      'Everything in Pro, plus:',
      'Doctor consultation packages',
      'Lab testing partnerships',
      'TRT optimization protocols',
      'Specialist referrals',
      'Custom treatment plans',
      '24/7 medical support'
    ],
    icon: Crown,
    className: 'bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-amber-200 dark:border-amber-800'
  }
} as const

export default function SubscriptionPage() {
  const [tier, setTier] = useState<SubscriptionTier | null>(null)
  const [tierLoading, setTierLoading] = useState(true)
  const [changing, setChanging] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch('/api/subscription', { cache: 'no-store', credentials: 'include' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data?.tier) {
          const t = String(data.tier).toLowerCase().trim()
          setTier(t === 'elite' ? 'elite' : t === 'paid' ? 'paid' : 'free')
        } else if (!cancelled) {
          setTier('free')
        }
      })
      .catch(() => {
        if (!cancelled) setTier('free')
      })
      .finally(() => {
        if (!cancelled) setTierLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  const effectiveTier: SubscriptionTier = tier ?? 'free'
  const isPaid = effectiveTier === 'paid' || effectiveTier === 'elite'
  const isElite = effectiveTier === 'elite'

  const handleChangeSubscription = async (action: 'upgrade' | 'downgrade' | 'cancel', targetTier?: string) => {
    setChanging(action)
    setError(null)
    setSuccess(null)
    try {
      const res = await fetch('/api/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, targetTier })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update subscription')
      setSuccess(data.message || 'Subscription updated. Changes take effect at your next billing date.')
      window.location.reload() // Refresh to reflect new tier
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setChanging(null)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Link
          href="/profile"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Profile
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Subscription & Billing</h1>
          <p className="text-muted-foreground">
            Manage your plan, compare tiers, and change your subscription.
          </p>
        </div>

        {/* Billing Policy */}
        <Alert className="mb-8 border-cyan-500/20 bg-cyan-500/5 dark:bg-cyan-950/20 dark:border-cyan-800/50">
          <CreditCard className="h-4 w-4 text-cyan-500" />
          <AlertDescription>
            <strong>Billing policy:</strong> Upgrades take effect immediately. If you cancel or downgrade,
            the change takes effect at your <strong>next billing cycle</strong>—no refund for the current period.
            You keep your current access until the next bill date.
          </AlertDescription>
        </Alert>

        {error && (
          <Alert className="mb-6 border-destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6 border-green-500 bg-green-50 dark:bg-green-950/20">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription className="text-green-800 dark:text-green-200">{success}</AlertDescription>
          </Alert>
        )}

        {/* Plan Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {(Object.keys(TIER_FEATURES) as Array<keyof typeof TIER_FEATURES>).map((tierKey) => {
            const config = TIER_FEATURES[tierKey]
            const Icon = config.icon
            const isCurrentTier = !tierLoading && effectiveTier === tierKey
            const isDowngradeToFree = tierKey === 'free' && (effectiveTier === 'paid' || effectiveTier === 'elite')
            const isDowngradeToPro = tierKey === 'paid' && effectiveTier === 'elite'
            const isUpgrade =
              (tierKey === 'paid' && effectiveTier === 'free') ||
              (tierKey === 'elite' && (effectiveTier === 'free' || effectiveTier === 'paid'))

            return (
              <Card
                key={tierKey}
                className={`relative ${config.className} ${isCurrentTier ? 'ring-2 ring-cyan-500' : ''}`}
              >
                {isCurrentTier && (
                  <div className="absolute -top-2.5 right-4">
                    <Badge className="bg-cyan-600 text-white dark:bg-cyan-500 dark:text-foreground">
                      Current Plan
                    </Badge>
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon
                      className={`h-5 w-5 ${
                        tierKey === 'elite' ? 'text-amber-600' : tierKey === 'paid' ? 'text-cyan-500' : 'text-yellow-500'
                      }`}
                    />
                    {config.name}
                  </CardTitle>
                  <CardDescription>{config.description}</CardDescription>
                  <div className="text-3xl font-bold">
                    ${config.price}
                    <span className="text-base font-normal text-muted-foreground">/month</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2 text-sm">
                    {config.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-cyan-500 shrink-0 mt-0.5" />
                        <span className={f.endsWith(':') ? 'font-medium' : ''}>{f}</span>
                      </li>
                    ))}
                  </ul>

                  {!tierLoading && (
                    <div className="pt-2">
                      {isCurrentTier && (effectiveTier === 'paid' || effectiveTier === 'elite') ? (
                        <div className="space-y-2">
                          <Button
                            variant="outline"
                            className="w-full"
                            disabled={!!changing}
                            onClick={() =>
                              handleChangeSubscription(effectiveTier === 'elite' ? 'downgrade' : 'cancel', 'free')
                            }
                          >
                            {changing ? (
                              <span className="animate-pulse">Processing...</span>
                            ) : (
                              <>
                                <Calendar className="h-4 w-4 mr-2" />
                                Cancel / Downgrade at period end
                              </>
                            )}
                          </Button>
                          <p className="text-xs text-muted-foreground text-center">
                            Access until next billing date
                          </p>
                        </div>
                      ) : isUpgrade ? (
                        <Button
                          className={`w-full ${
                            tierKey === 'elite'
                              ? 'bg-amber-600 hover:bg-amber-700 text-white'
                              : 'bg-cyan-600 hover:bg-cyan-700 text-white'
                          }`}
                          disabled={!!changing}
                          onClick={() => handleChangeSubscription('upgrade', tierKey)}
                        >
                          {changing ? (
                            <span className="animate-pulse">Processing...</span>
                          ) : (
                            `Upgrade to ${config.name}`
                          )}
                        </Button>
                      ) : isDowngradeToPro ? (
                        <Button
                          variant="outline"
                          className="w-full"
                          disabled={!!changing}
                          onClick={() => handleChangeSubscription('downgrade', 'paid')}
                        >
                          {changing ? (
                            <span className="animate-pulse">Processing...</span>
                          ) : (
                            <>
                              <Calendar className="h-4 w-4 mr-2" />
                              Downgrade to Pro at period end
                            </>
                          )}
                        </Button>
                      ) : isDowngradeToFree ? (
                        <Button
                          variant="outline"
                          className="w-full"
                          disabled={!!changing}
                          onClick={() => handleChangeSubscription('downgrade', 'free')}
                        >
                          {changing ? (
                            <span className="animate-pulse">Processing...</span>
                          ) : (
                            <>
                              <Calendar className="h-4 w-4 mr-2" />
                              Downgrade at period end
                            </>
                          )}
                        </Button>
                      ) : (
                        <Button variant="outline" className="w-full" disabled>
                          Current Plan
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Pricing Notice */}
        <Alert className="mt-8 border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            <strong>Pricing Notice:</strong> Professional medical services (doctor consultations, lab testing, TRT
            protocols) are provided through licensed healthcare partners. Enhanced AI facilitates connections but
            does not provide medical services directly.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  )
}
