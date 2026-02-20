'use client'

import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { AlertTriangle, CheckCircle, XCircle, Minus } from 'lucide-react'
import { useState, useEffect } from 'react'

interface HealthRiskScoreBadgeProps {
  className?: string
}

interface RiskData {
  score: number
  risk_level: 'Very Low' | 'Low' | 'Moderate' | 'High' | 'Very High'
  primary_concerns: string[]
  monitoring_recommendations: string[]
}

export function HealthRiskScoreBadge({ className }: HealthRiskScoreBadgeProps) {
  const [riskData, setRiskData] = useState<RiskData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchRiskScore = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/health-risk-score')
      const data = await response.json()
      if (!response.ok) {
        const msg = data.error || 'Failed to fetch risk score'
        const flags = data.flags as string[] | undefined
        throw new Error(flags?.length ? `${msg} Flagged: ${flags.join(', ')}` : msg)
      }
      setRiskData(data)
    } catch (err: any) {
      setError(err.message || 'Failed to load risk score')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRiskScore()
  }, [])

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'Very Low':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'Low':
        return 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300'
      case 'Moderate':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'High':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
      case 'Very High':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'Very Low':
      case 'Low':
        return <CheckCircle className="h-3 w-3" />
      case 'Moderate':
        return <Minus className="h-3 w-3" />
      case 'High':
      case 'Very High':
        return <AlertTriangle className="h-3 w-3" />
      default:
        return <XCircle className="h-3 w-3" />
    }
  }

  if (loading) {
    return (
      <Badge variant="outline" className={`${className} animate-pulse`}>
        Loading...
      </Badge>
    )
  }

  if (error || !riskData) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="outline" className={`${className} cursor-help`}>
              <XCircle className="h-3 w-3 mr-1" />
              Risk: --
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>Unable to calculate risk score</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge className={`${getRiskColor(riskData.risk_level)} ${className} cursor-help`}>
            {getRiskIcon(riskData.risk_level)}
            <span className="ml-1">
              Risk: {riskData.score}/100 ({riskData.risk_level})
            </span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent className="max-w-sm">
          <div className="space-y-2">
            <p className="font-medium">Health Risk Assessment</p>
            <p className="text-sm">Score: {riskData.score}/100 ({riskData.risk_level})</p>

            {riskData.primary_concerns.length > 0 && (
              <div>
                <p className="text-sm font-medium">Primary Concerns:</p>
                <ul className="text-sm list-disc list-inside ml-2">
                  {riskData.primary_concerns.slice(0, 3).map((concern, index) => (
                    <li key={index}>{concern}</li>
                  ))}
                </ul>
              </div>
            )}

            {riskData.monitoring_recommendations.length > 0 && (
              <div>
                <p className="text-sm font-medium">Monitoring Recommendations:</p>
                <ul className="text-sm list-disc list-inside ml-2">
                  {riskData.monitoring_recommendations.slice(0, 3).map((rec, index) => (
                    <li key={index}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}

            <p className="text-xs text-muted-foreground mt-2">
              Educational analysis only - not medical advice
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}