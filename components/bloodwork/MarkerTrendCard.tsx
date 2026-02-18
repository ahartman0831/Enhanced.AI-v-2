'use client'

import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { getTrendIndicator } from '@/lib/bloodwork-trend-indicators'

interface DataPoint {
  date: string
  value: string
  numericValue?: number
}

interface MarkerTrendCardProps {
  marker: string
  latestValue: string
  trend: 'up' | 'down' | 'stable'
  dataPoints: DataPoint[]
  isFlagged?: boolean
}

export function MarkerTrendCard({
  marker,
  latestValue,
  trend,
  dataPoints,
  isFlagged,
}: MarkerTrendCardProps) {
  const ind = getTrendIndicator(marker, trend)
  const chartData = dataPoints.map((p) => ({
    date: p.date,
    value: p.numericValue ?? (parseFloat(String(p.value).replace(/[^0-9.-]/g, '')) || 0),
    valueLabel: p.value,
  }))

  const icon =
    trend === 'up' ? (
      <TrendingUp className="h-3.5 w-3.5" />
    ) : trend === 'down' ? (
      <TrendingDown className="h-3.5 w-3.5" />
    ) : (
      <Minus className="h-3.5 w-3.5" />
    )

  const colorClass =
    ind.type === 'positive'
      ? 'bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30'
      : ind.type === 'risk'
        ? 'bg-red-500/20 text-red-700 dark:text-red-400 border-red-500/30'
        : 'bg-cyan-500/20 text-cyan-700 dark:text-cyan-400 border-cyan-500/30'

  return (
    <div
      className={`rounded-lg border p-3 transition-colors ${
        isFlagged ? 'border-amber-500/50 bg-amber-500/5 dark:bg-amber-950/20' : 'border-muted/50'
      }`}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-medium text-foreground truncate">{marker}</span>
          {isFlagged && (
            <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-700 dark:text-amber-400">
              Flagged
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-sm text-muted-foreground">{latestValue}</span>
          <span
            className={`inline-flex items-center rounded border px-1.5 py-0.5 text-xs ${colorClass}`}
            title={ind.tooltip}
          >
            {icon}
          </span>
        </div>
      </div>
      {chartData.length > 0 && (
        <div className="h-12 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
              <Line
                type="monotone"
                dataKey="value"
                stroke={ind.type === 'positive' ? '#22c55e' : ind.type === 'risk' ? '#ef4444' : '#06b6d4'}
                strokeWidth={1.5}
                dot={false}
                connectNulls
              />
              <Tooltip
                content={({ active, payload, label }) =>
                  active && payload?.[0] ? (
                    <div className="rounded border bg-background px-2 py-1 text-xs shadow-md">
                      {label}: {(payload[0].payload as { valueLabel?: string }).valueLabel ?? payload[0].value}
                    </div>
                  ) : null
                }
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
