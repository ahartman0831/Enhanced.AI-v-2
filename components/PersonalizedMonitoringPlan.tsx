'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Crown, Stethoscope, Loader2, AlertTriangle } from 'lucide-react'

interface MonitoringItem {
  marker: string
  rationale: string
  frequency?: string
}

interface PersonalizedMonitoringPlanProps {
  compoundNames: string[]
  bloodwork?: string
  isElite?: boolean
}

export function PersonalizedMonitoringPlan({
  compoundNames,
  bloodwork,
  isElite = false
}: PersonalizedMonitoringPlanProps) {
  const [data, setData] = useState<{ disclaimer?: string; monitoring_items?: MonitoringItem[] } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isElite || !compoundNames?.length) return

    const controller = new AbortController()
    setLoading(true)
    setError(null)

    fetch('/api/monitoring-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ compounds: compoundNames, bloodwork }),
      signal: controller.signal
    })
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          throw new Error(err.error || `HTTP ${res.status}`)
        }
        return res.json()
      })
      .then((res) => setData(res.data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))

    return () => controller.abort()
  }, [isElite, compoundNames?.join(','), bloodwork])

  if (!isElite) {
    return (
      <Card className="border-amber-200 dark:border-amber-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5" />
            Personalized Monitoring Plan
            <Badge variant="secondary" className="ml-2">
              <Crown className="h-3 w-3 mr-1" />
              Elite
            </Badge>
          </CardTitle>
          <CardDescription>
            Upgrade to Elite for a tailored &quot;Monitor This&quot; list based on your profile and stack.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
            <Crown className="h-4 w-4" />
            <AlertDescription>
              <strong>Elite Feature:</strong> Get personalized monitoring recommendations (e.g., &quot;for 35-year-old males, add prolactin check&quot;) based on your compounds and profile.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 flex items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Generating personalized monitoring plan...
        </CardContent>
      </Card>
    )
  }

  if (error || !data?.monitoring_items?.length) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Stethoscope className="h-5 w-5" />
          Personalized Monitoring Plan
        </CardTitle>
        <CardDescription>
          Tailored &quot;Monitor This&quot; list based on your profile and stack — communities often emphasize these markers.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {data.disclaimer && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-xs">{data.disclaimer}</AlertDescription>
          </Alert>
        )}
        <ul className="space-y-3">
          {data.monitoring_items.map((item, idx) => (
            <li key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <Badge variant="outline" className="shrink-0">
                {item.marker}
              </Badge>
              <div>
                <p className="text-sm">{item.rationale}</p>
                {item.frequency && (
                  <p className="text-xs text-muted-foreground mt-1">{item.frequency}</p>
                )}
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
