'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Pill, ExternalLink, RefreshCw, AlertTriangle } from 'lucide-react'
import { generateAmazonAffiliateLink } from '@/lib/affiliates'
import { SystemIcon } from '@/lib/system-icons'

/** From analysis (side-effects / stack-explorer Grok call) */
interface AnalysisSupport {
  name: string
  common_purpose: string
  affected_system: string
  amazon_affiliate_link?: string
  partnership_note?: string
}

/** From supplement-analyzer API (legacy fallback) */
interface Supplement {
  name: string
  category: string
  rationale: string
  commonly_discussed_dose: string
  amazon_affiliate_link: string
  priority: 'High' | 'Medium' | 'Low'
}

interface SuppStackData {
  support_supplements: Supplement[]
  general_notes: string
}

interface PersonalizedSuppStackProps {
  className?: string
  analysisType?: 'stack-explorer' | 'side-effects'
  /** Pre-filled from initial Grok analysis - no Generate needed */
  supports?: AnalysisSupport[]
}

export function PersonalizedSuppStack({ className, analysisType, supports: propsSupports }: PersonalizedSuppStackProps) {
  const [apiData, setApiData] = useState<SuppStackData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Use analysis supports when provided (from initial Grok call)
  const hasPreFilledSupports = propsSupports && propsSupports.length > 0

  const fetchSupplementRecommendations = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/supplement-analyzer')
      if (!response.ok) {
        throw new Error('Failed to generate supplement recommendations')
      }

      const data = await response.json()
      setApiData(data)
    } catch (err: any) {
      setError(err.message || 'Failed to load recommendations')
    } finally {
      setLoading(false)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'Low':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  const getCategoryIcon = (category: string) => {
    const lowerCategory = category.toLowerCase()
    if (lowerCategory.includes('liver')) return '🫀'
    if (lowerCategory.includes('hormone') || lowerCategory.includes('endocrine')) return '⚡'
    if (lowerCategory.includes('cardiovascular') || lowerCategory.includes('heart')) return '❤️'
    if (lowerCategory.includes('joint') || lowerCategory.includes('bone')) return '🦴'
    if (lowerCategory.includes('stress') || lowerCategory.includes('recovery')) return '😌'
    return '💊'
  }

  const getPurposeColor = (purpose: string) => {
    if (purpose.includes('cardiovascular') || purpose.includes('heart')) return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    if (purpose.includes('hormonal') || purpose.includes('endocrine')) return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
    if (purpose.includes('liver') || purpose.includes('hepatic')) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    if (purpose.includes('recovery') || purpose.includes('muscle')) return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
    if (purpose.includes('sleep') || purpose.includes('stress')) return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200'
    return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
  }

  const renderPreFilledSupports = () => (
    <div className="space-y-4">
      {propsSupports!.map((supp, index) => {
        const amazonLink = supp.amazon_affiliate_link || generateAmazonAffiliateLink(supp.name)
        return (
          <div key={index} className="border rounded-lg p-4 bg-white/50 dark:bg-black/20">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-muted">
                  <SystemIcon system={supp.affected_system} className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-medium">{supp.name}</h4>
                  <p className="text-sm text-muted-foreground">{supp.common_purpose}</p>
                </div>
              </div>
              <Badge className={getPurposeColor(supp.common_purpose)}>
                {supp.affected_system}
              </Badge>
            </div>

            {supp.partnership_note && (
              <p className="text-sm text-muted-foreground mb-3">{supp.partnership_note}</p>
            )}

            <div className="flex items-center justify-end">
              <Button size="sm" variant="outline" asChild>
                <a href={amazonLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1">
                  <ExternalLink className="h-3 w-3" />
                  Shop on Amazon
                </a>
              </Button>
            </div>
          </div>
        )
      })}
    </div>
  )

  const renderApiSupplements = () => (
    <div className="space-y-4">
      {apiData!.support_supplements.map((supp, index) => (
        <div key={index} className="border rounded-lg p-4 bg-white/50 dark:bg-black/20">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">{getCategoryIcon(supp.category)}</span>
              <div>
                <h4 className="font-medium">{supp.name}</h4>
                <p className="text-sm text-muted-foreground">{supp.category}</p>
              </div>
            </div>
            <Badge className={getPriorityColor(supp.priority)}>{supp.priority} Priority</Badge>
          </div>
          <p className="text-sm mb-3 leading-relaxed">{supp.rationale}</p>
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              <strong>Dose:</strong> {supp.commonly_discussed_dose}
            </div>
            <Button size="sm" variant="outline" asChild>
              <a href={supp.amazon_affiliate_link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1">
                View on Amazon
                <ExternalLink className="h-3 w-3" />
              </a>
            </Button>
          </div>
        </div>
      ))}
      {apiData!.general_notes && (
        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
          <p className="text-sm text-blue-800 dark:text-blue-200"><strong>Note:</strong> {apiData!.general_notes}</p>
        </div>
      )}
    </div>
  )

  const hasContent = hasPreFilledSupports || (apiData?.support_supplements && apiData.support_supplements.length > 0)

  return (
    <Card className={`${className} bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20 border-purple-200 dark:border-purple-800`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <Pill className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <CardTitle className="flex items-center gap-2">
                <Pill className="h-5 w-5 text-purple-600" />
                Potentially Helpful Supplements
              </CardTitle>
              <CardDescription>
                Commonly discussed supportive compounds based on your analysis
              </CardDescription>
            </div>
          </div>
          {!hasPreFilledSupports && (
            <Button onClick={fetchSupplementRecommendations} disabled={loading} size="sm" variant="outline">
              {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <><Pill className="h-4 w-4 mr-1" />Generate</>}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="text-sm text-destructive mb-4 p-3 bg-destructive/10 rounded-lg">{error}</div>
        )}

        {hasPreFilledSupports ? (
          <>
            {renderPreFilledSupports()}
            <div className="mt-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-amber-800 dark:text-amber-200">
                  <strong>Educational Only:</strong> These are commonly discussed supportive compounds. Always consult healthcare professionals before starting new supplements. Individual responses vary significantly.
                </div>
              </div>
            </div>
          </>
        ) : hasContent ? (
          <>
            {renderApiSupplements()}
            <div className="mt-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-amber-800 dark:text-amber-200">
                  <strong>Educational Only:</strong> These are commonly discussed supportive compounds. Always consult healthcare professionals before starting new supplements. Individual responses vary significantly.
                </div>
              </div>
            </div>
          </>
        ) : !loading ? (
          <div className="text-center py-8">
            <Pill className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              Generate personalized supplement recommendations based on your current protocol
            </p>
            <Button onClick={fetchSupplementRecommendations} className="bg-purple-600 hover:bg-purple-700">
              <Pill className="h-4 w-4 mr-2" />
              Generate Supp Stack
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border rounded-lg p-4">
                <div className="h-4 bg-muted animate-pulse rounded mb-2"></div>
                <div className="h-3 bg-muted animate-pulse rounded w-3/4 mb-3"></div>
                <div className="flex justify-between">
                  <div className="h-3 bg-muted animate-pulse rounded w-1/4"></div>
                  <div className="h-8 bg-muted animate-pulse rounded w-24"></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}