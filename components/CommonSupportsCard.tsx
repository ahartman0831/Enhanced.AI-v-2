'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Crown, Pill, ExternalLink, AlertTriangle, Star } from 'lucide-react'
import { generateAmazonAffiliateLink, getAffiliateDisclosure } from '@/lib/affiliates'

interface SupportItem {
  name: string
  common_purpose: string
  affected_system: string
  amazon_affiliate_link?: string
}

interface CommonSupportsCardProps {
  supports: SupportItem[]
  analysisType: 'stack-explorer' | 'side-effects'
  className?: string
  isElite?: boolean // For tier-gating
}

export function CommonSupportsCard({
  supports,
  analysisType,
  className,
  isElite = false
}: CommonSupportsCardProps) {
  // For Free/Pro users, show a general curated list
  const generalSupports: SupportItem[] = [
    {
      name: "Fish Oil",
      commonPurpose: "cardiovascular and joint support",
      affectedSystem: "Cardiovascular",
      communityNotes: "Often discussed for maintaining healthy lipid profiles and joint comfort"
    },
    {
      name: "Vitamin D3",
      commonPurpose: "hormonal and immune support",
      affectedSystem: "Endocrine",
      communityNotes: "Frequently mentioned for maintaining optimal vitamin D levels"
    },
    {
      name: "Magnesium",
      commonPurpose: "muscle recovery and sleep support",
      affectedSystem: "Neurological",
      communityNotes: "Commonly discussed for muscle cramps and sleep quality"
    },
    {
      name: "Zinc",
      commonPurpose: "hormonal optimization support",
      affectedSystem: "Endocrine",
      communityNotes: "Often mentioned alongside hormonal compounds for optimization"
    }
  ]

  // Use personalized supports for Elite, general for others
  const displaySupports = isElite ? supports : generalSupports
  const isGeneral = !isElite

  const getSystemIcon = (system: string) => {
    const lowerSystem = system.toLowerCase()
    if (lowerSystem.includes('cardiovascular') || lowerSystem.includes('heart')) return '❤️'
    if (lowerSystem.includes('endocrine') || lowerSystem.includes('hormonal')) return '⚡'
    if (lowerSystem.includes('hepatic') || lowerSystem.includes('liver')) return '🫀'
    if (lowerSystem.includes('neurological') || lowerSystem.includes('brain')) return '🧠'
    if (lowerSystem.includes('muscle') || lowerSystem.includes('recovery')) return '💪'
    if (lowerSystem.includes('joint')) return '🦴'
    if (lowerSystem.includes('immune')) return '🛡️'
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

  return (
    <Card className={`${className} bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 border-emerald-200 dark:border-emerald-800`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900 rounded-lg">
              <Pill className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <CardTitle className="flex items-center gap-2">
                {isElite ? (
                  <Star className="h-5 w-5 text-emerald-600" />
                ) : (
                  <Crown className="h-5 w-5 text-amber-600" />
                )}
                Commonly Discussed Supports
              </CardTitle>
              <CardDescription>
                {isElite
                  ? "Personalized supportive compounds based on your analysis"
                  : "General supportive compounds often discussed in communities"
                }
              </CardDescription>
            </div>
          </div>
          {!isElite && (
            <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
              <Crown className="h-3 w-3 mr-1" />
              Elite Feature
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Elite Upsell for non-Elite users */}
        {!isElite && (
          <Alert className="mb-6 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
            <Crown className="h-4 w-4" />
            <AlertDescription className="text-amber-800 dark:text-amber-200">
              <strong>Upgrade to Elite</strong> for personalized supportive compound recommendations based on your specific stack and analysis results.
            </AlertDescription>
          </Alert>
        )}

        {/* Supports List */}
        <div className="space-y-4">
          {displaySupports.map((support, index) => (
            <div key={index} className="border rounded-lg p-4 bg-white/50 dark:bg-black/20">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getSystemIcon(support.affected_system)}</span>
                  <div>
                    <h4 className="font-medium text-lg">{support.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {support.commonPurpose}
                    </p>
                  </div>
                </div>
                <Badge className={getPurposeColor(support.common_purpose)}>
                  {support.affected_system}
                </Badge>
              </div>

              {support.communityNotes && (
                <p className="text-sm mb-3 leading-relaxed">
                  {support.communityNotes}
                </p>
              )}

              <div className="flex items-center justify-between">
                <div className="text-xs text-muted-foreground">
                  Educational reference only
                </div>
                <Button size="sm" variant="outline" asChild>
                  <a
                    href={support.amazon_affiliate_link || generateAmazonAffiliateLink(support.name)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Shop on Amazon
                  </a>
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Affiliate Disclosure */}
        <div className="mt-6 pt-4 border-t">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <strong>Educational Only:</strong> These are commonly discussed supportive compounds.
              Individual responses vary significantly. Always consult healthcare professionals before starting new supplements.
              <br /><br />
              <span className="text-xs text-muted-foreground">
                {getAffiliateDisclosure()}
              </span>
            </AlertDescription>
          </Alert>
        </div>

        {/* Elite Call-to-Action */}
        {!isElite && (
          <div className="mt-4 pt-4 border-t text-center">
            <Button className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white">
              <Crown className="h-4 w-4 mr-2" />
              Upgrade to Elite for Personalized Supports
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}