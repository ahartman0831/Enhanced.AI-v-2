'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
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
  Loader2,
  ExternalLink
} from 'lucide-react'

type SubscriptionTier = 'free' | 'paid' | 'elite'

const TIER_FEATURES = {
  free: {
    name: 'Free',
    price: 0,
    description: 'Perfect for getting started',
    features: [
      'Compounds database',
      'Order blood test',
      'Profile & subscription',
      'Community discussions'
    ],
    icon: Star,
    className: ''
  },
  paid: {
    name: 'Pro',
    price: 14.99,
    description: 'Exploration, modeling & educational tools',
    features: [
      '🧪 Exploration — Stack Explorer, Side Effects, Counterfeit Checker',
      '📊 Modeling — Progress Photos, Results Forecaster, Supplement Analyzer',
      '⚙️ Educational Tools — Advanced analysis and reporting'
    ],
    icon: Award,
    className: 'border-cyan-500/50 shadow-lg shadow-cyan-500/10'
  },
  elite: {
    name: 'Elite',
    price: 29.99,
    description: 'Biomarker intelligence & doctor-ready exports',
    features: [
      '🔬 Biomarker Intelligence — Bloodwork Parser, lab analysis',
      '📈 Longitudinal Tracking — Bloodwork History, trends over time',
      '🧠 Personalized Recovery Modeling — Recovery Timeline, PCT considerations',
      '📄 Doctor-Ready Exports — Telehealth Referral packages, PDF exports'
    ],
    icon: Crown,
    className: 'bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-amber-200 dark:border-amber-800 shadow-lg shadow-amber-500/10'
  }
} as const

export default function SubscriptionPage() {
  const searchParams = useSearchParams()
  const [tier, setTier] = useState<SubscriptionTier | null>(null)
  const [tierLoading, setTierLoading] = useState(true)
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null)
  const [portalLoading, setPortalLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      setSuccess('Payment successful! Your subscription is now active.')
      window.history.replaceState({}, '', '/subscription')
    }
    if (searchParams.get('canceled') === 'true') {
      setError('Checkout was canceled.')
      window.history.replaceState({}, '', '/subscription')
    }
  }, [searchParams])

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

  const handleStripeCheckout = async (targetTier: 'pro' | 'elite') => {
    setCheckoutLoading(targetTier)
    setError(null)
    try {
      const res = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier: targetTier, period: 'month' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to start checkout')
      if (data.url) window.location.href = data.url
      else throw new Error('No checkout URL')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setCheckoutLoading(null)
    }
  }

  const handleManageSubscription = async () => {
    setPortalLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/stripe/customer-portal', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to open portal')
      if (data.url) window.location.href = data.url
      else throw new Error('No portal URL')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setPortalLoading(false)
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
                    <Badge
                      className={
                        tierKey === 'elite'
                          ? 'bg-amber-600 text-white dark:bg-amber-500 dark:text-foreground'
                          : 'bg-cyan-600 text-white dark:bg-cyan-500 dark:text-foreground'
                      }
                    >
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
                    ${typeof config.price === 'number' && config.price % 1 !== 0 ? config.price.toFixed(2) : config.price}
                    <span className="text-base font-normal text-muted-foreground">/month</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-3 text-sm">
                    {config.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle
                          className={`h-4 w-4 shrink-0 mt-0.5 ${
                            tierKey === 'elite' ? 'text-amber-600' : tierKey === 'paid' ? 'text-cyan-500' : 'text-muted-foreground'
                          }`}
                        />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>

                  {!tierLoading && (
                    <div className="pt-2 space-y-2">
                      {isCurrentTier && (effectiveTier === 'paid' || effectiveTier === 'elite') ? (
                        <>
                          <Button
                            variant="outline"
                            className="w-full"
                            disabled={portalLoading}
                            onClick={handleManageSubscription}
                          >
                            {portalLoading ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <ExternalLink className="h-4 w-4 mr-2" />
                            )}
                            Manage subscription
                          </Button>
                          <p className="text-xs text-muted-foreground text-center">
                            Cancel, update payment, or change plan in Stripe
                          </p>
                        </>
                      ) : isUpgrade ? (
                        <Button
                          className={`w-full ${
                            tierKey === 'elite'
                              ? 'bg-amber-600 hover:bg-amber-700 text-white'
                              : 'bg-cyan-600 hover:bg-cyan-700 text-white'
                          }`}
                          disabled={!!checkoutLoading}
                          onClick={() => handleStripeCheckout(tierKey as 'pro' | 'elite')}
                        >
                          {checkoutLoading === tierKey ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            `Upgrade to ${config.name}`
                          )}
                        </Button>
                      ) : isDowngradeToPro || isDowngradeToFree ? (
                        <Button
                          variant="outline"
                          className="w-full"
                          disabled={portalLoading}
                          onClick={handleManageSubscription}
                        >
                          {portalLoading ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <ExternalLink className="h-4 w-4 mr-2" />
                          )}
                          Manage subscription to downgrade
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
