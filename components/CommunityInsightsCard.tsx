'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, TrendingUp, RefreshCw } from 'lucide-react'
import { useState, useEffect } from 'react'

interface CommunityInsightsCardProps {
  className?: string
}

interface Insight {
  category: 'Bloodwork Trends' | 'Timeline Expectations' | 'Common Experiences' | 'Protocol Patterns'
  insight: string
  educational_note: string
}

interface CommunityData {
  insights: Insight[]
  layman_summary?: string
}

export function CommunityInsightsCard({ className }: CommunityInsightsCardProps) {
  const [data, setData] = useState<CommunityData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCommunityInsights = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/community-insights')
      if (!response.ok) {
        throw new Error('Failed to fetch community insights')
      }

      const data = await response.json()
      setData(data)
    } catch (err: any) {
      setError(err.message || 'Failed to load community insights')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCommunityInsights()
  }, [])

  const handleRefresh = () => {
    fetchCommunityInsights()
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Bloodwork Trends':
        return '📊'
      case 'Timeline Expectations':
        return '⏱️'
      case 'Common Experiences':
        return '👥'
      case 'Protocol Patterns':
        return '📈'
      default:
        return '💡'
    }
  }

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Users className="h-4 w-4" />
            Community Insights
          </CardTitle>
          <CardDescription className="text-xs">
            Anonymized trends from similar users
          </CardDescription>
        </div>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="p-1 rounded-md hover:bg-muted transition-colors"
          title="Refresh insights"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            <div className="h-4 bg-muted animate-pulse rounded"></div>
            <div className="h-4 bg-muted animate-pulse rounded w-3/4"></div>
            <div className="h-4 bg-muted animate-pulse rounded w-1/2"></div>
          </div>
        ) : error ? (
          <div className="text-sm text-destructive">
            {error}
          </div>
        ) : data?.insights && data.insights.length > 0 ? (
          <div className="space-y-4">
            {data.insights.slice(0, 3).map((insight, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{getCategoryIcon(insight.category)}</span>
                  <Badge variant="secondary" className="text-xs">
                    {insight.category}
                  </Badge>
                </div>
                <p className="text-sm leading-relaxed">
                  {insight.insight}
                </p>
                <p className="text-xs text-muted-foreground">
                  {insight.educational_note}
                </p>
              </div>
            ))}

            {data.layman_summary && (
              <div className="pt-3 mt-3 border-t p-3 rounded-lg bg-muted/50 border">
                <p className="text-xs font-medium text-foreground mb-1">In plain terms</p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {data.layman_summary}
                </p>
              </div>
            )}

            <div className="pt-2 border-t">
              <Badge variant="outline" className="text-xs">
                Educational Trends Only - Individual Results May Vary
              </Badge>
            </div>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">
            No community insights available at this time
          </div>
        )}
      </CardContent>
    </Card>
  )
}