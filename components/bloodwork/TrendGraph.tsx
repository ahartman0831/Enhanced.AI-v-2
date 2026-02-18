'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { getTrendIndicator } from '@/lib/bloodwork-trend-indicators'

interface DataPoint {
  date: string
  value: string
  numericValue?: number
}

interface MarkerSeries {
  marker: string
  dataPoints: DataPoint[]
  trend: 'up' | 'down' | 'stable'
}

interface TrendGraphProps {
  series: MarkerSeries[]
  selectedMarkers: string[]
  height?: number
}

/** One chart per marker to avoid mixing units/scales */
export function TrendGraph({ series, selectedMarkers, height = 240 }: TrendGraphProps) {
  const visible = series.filter((s) => selectedMarkers.includes(s.marker))
  if (visible.length === 0) return null

  return (
    <div className="space-y-6">
      {visible.map((s) => {
        const chartData = s.dataPoints.map((p) => ({
          date: p.date,
          value: p.numericValue ?? parseFloat(String(p.value).replace(/[^0-9.-]/g, '')) || 0,
          valueLabel: p.value,
        }))
        const ind = getTrendIndicator(s.marker, s.trend)
        const stroke =
          ind.type === 'positive'
            ? '#22c55e'
            : ind.type === 'risk'
              ? '#ef4444'
              : '#06b6d4'
        return (
          <div key={s.marker} className="space-y-2">
            <h4 className="font-medium text-foreground">{s.marker}</h4>
            <div style={{ height }} className="w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals />
                  <Tooltip
                    content={({ active, payload, label }) =>
                      active && payload?.[0] ? (
                        <div className="rounded-lg border bg-background px-3 py-2 text-sm shadow-lg">
                          <p className="font-medium">Date: {label}</p>
                          <p className="text-muted-foreground">
                            {(payload[0].payload as { valueLabel?: string }).valueLabel ?? payload[0].value}
                          </p>
                        </div>
                      ) : null
                    }
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke={stroke}
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    connectNulls
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )
      })}
    </div>
  )
}
