'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { RefreshCw, TrendingUp } from 'lucide-react'
import { useState, useEffect } from 'react'

interface WeeklyWhatChangedCardProps {
  className?: string
}

export function WeeklyWhatChangedCard({ className }: WeeklyWhatChangedCardProps) {
  const [summary, setSummary] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string>('')

  const fetchWeeklySummary = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/weekly-summary')
      const data = await response.json()
      if (!response.ok) {
        const msg = data.error || 'Failed to fetch weekly summary'
        const flags = data.flags as string[] | undefined
        throw new Error(flags?.length ? `${msg} Flagged: ${flags.join(', ')}` : msg)
      }
      setSummary(data.summary || 'No significant changes detected since last log')
      setLastUpdated(data.generated_at || new Date().toISOString())
    } catch (err: any) {
      setError(err.message || 'Failed to load weekly summary')
      setSummary('Unable to generate summary at this time')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWeeklySummary()
  }, [])

  const handleRefresh = () => {
    fetchWeeklySummary()
  }

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            What Changed This Week
          </CardTitle>
          <CardDescription className="text-xs">
            Educational summary of your health data changes
          </CardDescription>
        </div>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="p-1 rounded-md hover:bg-muted transition-colors"
          title="Refresh summary"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            <div className="h-4 bg-muted animate-pulse rounded"></div>
            <div className="h-4 bg-muted animate-pulse rounded w-3/4"></div>
          </div>
        ) : error ? (
          <div className="text-sm text-destructive">
            {error}
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm leading-relaxed">
              {summary}
            </p>
            {lastUpdated && (
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-xs">
                  Educational Analysis Only
                </Badge>
                <span className="text-xs text-muted-foreground">
                  Updated {new Date(lastUpdated).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}