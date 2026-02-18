'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { getTrendIndicator, getLaymanNotes } from '@/lib/bloodwork-trend-indicators'

interface MarkerCardProps {
  marker: string
  latestValue: string
  trend: 'up' | 'down' | 'stable'
  observationalNote?: string
}

export function MarkerCard({ marker, latestValue, trend, observationalNote }: MarkerCardProps) {
  const indicator = getTrendIndicator(marker, trend)
  const layman = getLaymanNotes(marker)

  const icon =
    trend === 'up' ? (
      <TrendingUp className="h-4 w-4" />
    ) : trend === 'down' ? (
      <TrendingDown className="h-4 w-4" />
    ) : (
      <Minus className="h-4 w-4" />
    )

  const colorClass =
    indicator.type === 'positive'
      ? 'bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30'
      : indicator.type === 'risk'
        ? 'bg-red-500/20 text-red-700 dark:text-red-400 border-red-500/30'
        : 'bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-500/30'

  return (
    <Card className="border-cyan-500/20 dark:border-cyan-500/10 overflow-hidden">
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-semibold text-foreground">{marker}</h3>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">{latestValue}</span>
            <span
              className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${colorClass}`}
              title={indicator.tooltip}
            >
              {icon}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 px-4 pb-4 text-sm">
        {layman && (
          <div className="grid grid-cols-1 gap-2 text-muted-foreground">
            <div>
              <span className="font-medium text-foreground/80">What it is: </span>
              {layman.whatItIs}
            </div>
            <div>
              <span className="font-medium text-foreground/80">Why monitor: </span>
              {layman.whyMonitor}
            </div>
          </div>
        )}
        <p className="text-xs text-muted-foreground italic">
          {observationalNote || indicator.tooltip}
        </p>
      </CardContent>
    </Card>
  )
}
