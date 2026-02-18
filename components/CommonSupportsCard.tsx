'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Crown, Pill, ExternalLink, AlertTriangle, Star, Stethoscope } from 'lucide-react'
import { SystemIcon } from '@/lib/system-icons'
import { generateAmazonAffiliateLink, getAffiliateDisclosure, TELEHEALTH_PARTNERS } from '@/lib/affiliates'

interface SupportItem {
  name: string
  common_purpose: string
  affected_system: string
  amazon_affiliate_link?: string
  partnership_note?: string
  partnership_cta_url?: string
  partnership_cta_label?: string
  communityNotes?: string
}

/** Parse partnership_note for known partners and return CTA buttons to render */
function parsePartnershipCtas(note: string | undefined): Array<{ label: string; url: string }> {
  if (!note) return []
  const lower = note.toLowerCase()
  const ctas: Array<{ label: string; url: string }> = []
  if (lower.includes('hims')) ctas.push({ label: 'Book via Hims', url: TELEHEALTH_PARTNERS.hims })
  if (lower.includes('happy head')) ctas.push({ label: 'Book via Happy Head', url: TELEHEALTH_PARTNERS.happyHead })
  if (lower.includes('quest')) ctas.push({ label: 'Order Test via Quest', url: TELEHEALTH_PARTNERS.quest })
  if (lower.includes('letsgetchecked') || lower.includes('lets get checked')) ctas.push({ label: 'Order Test via LetsGetChecked', url: TELEHEALTH_PARTNERS.letsGetChecked })
  if (ctas.length === 0 && (lower.includes('telehealth') || lower.includes('consultation'))) {
    ctas.push({ label: 'Explore Telehealth Options', url: TELEHEALTH_PARTNERS.hims })
  }
  return ctas
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
  // For Free/Pro users, show a general curated list (Elite gets personalized from API)
  const generalSupports: SupportItem[] = [
    {
      name: "Fish Oil",
      common_purpose: "cardiovascular and joint support",
      affected_system: "Cardiovascular",
      communityNotes: "Often discussed for maintaining healthy lipid profiles and joint comfort"
    },
    {
      name: "NAC",
      common_purpose: "hepatic and antioxidant support",
      affected_system: "Liver",
      communityNotes: "Frequently mentioned for liver support and glutathione production"
    },
    {
      name: "TUDCA",
      common_purpose: "hepatic support",
      affected_system: "Liver",
      communityNotes: "Commonly discussed for bile acid and liver health support"
    },
    {
      name: "CoQ10",
      common_purpose: "cardiovascular and mitochondrial support",
      affected_system: "Cardiovascular",
      communityNotes: "Often mentioned for heart health and cellular energy"
    },
    {
      name: "Vitamin D3",
      common_purpose: "hormonal and immune support",
      affected_system: "Endocrine",
      communityNotes: "Frequently mentioned for maintaining optimal vitamin D levels"
    },
    {
      name: "Magnesium",
      common_purpose: "muscle recovery and sleep support",
      affected_system: "Neurological",
      communityNotes: "Commonly discussed for muscle cramps and sleep quality"
    }
  ]

  // For side-effects: always use API supports. For stack-explorer: Elite gets API, others get general.
  const displaySupports = analysisType === 'side-effects' ? supports : (isElite ? supports : generalSupports)
  const isGeneral = analysisType !== 'side-effects' && !isElite
  const isGated = !isElite  // Commonly Discussed Supports is Elite-only: blur + CTA when not Elite


  const getPurposeColor = (purpose: string) => {
    if (purpose.includes('cardiovascular') || purpose.includes('heart')) return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    if (purpose.includes('hormonal') || purpose.includes('endocrine')) return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
    if (purpose.includes('liver') || purpose.includes('hepatic')) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    if (purpose.includes('recovery') || purpose.includes('muscle')) return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
    if (purpose.includes('sleep') || purpose.includes('stress')) return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200'
    return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
  }

  return (
    <Card className={`${className} relative overflow-hidden bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 border-emerald-200 dark:border-emerald-800`}>
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
                  : "Elite feature – upgrade to view personalized supports for your reported side effects"
                }
              </CardDescription>
            </div>
          </div>
          {isGated && (
            <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
              <Crown className="h-3 w-3 mr-1" />
              Elite
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className={isGated ? 'relative' : ''}>
        {/* When gated: blurred content + overlay CTA */}
        {isGated && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/60 backdrop-blur-[2px] rounded-b-lg">
            <Crown className="h-12 w-12 text-amber-500 mb-4" />
            <p className="text-center text-muted-foreground mb-4 max-w-sm px-4">
              Upgrade to Elite to view personalized commonly discussed supports for your reported side effects, including Amazon links and telehealth referrals.
            </p>
            <Button className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white">
              <Crown className="h-4 w-4 mr-2" />
              Upgrade to Elite
            </Button>
          </div>
        )}

        <div className={isGated ? 'select-none blur-md pointer-events-none' : ''}>
        {/* Big disclaimer for side-effects */}
        {analysisType === 'side-effects' && (
          <Alert className="mb-6 border-amber-300 bg-amber-50/80 dark:bg-amber-950/30 dark:border-amber-700">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Educational reference only.</strong> These supports are commonly discussed in communities for the side effects you reported. Individual responses vary significantly. This is not medical advice. Always consult healthcare professionals before starting new supplements. Some links may earn commissions to support development.
            </AlertDescription>
          </Alert>
        )}

        {/* Elite Upsell - only when showing generic supports (stack-explorer non-Elite) and not gated */}
        {isGeneral && !isGated && (
          <Alert className="mb-6 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
            <Crown className="h-4 w-4" />
            <AlertDescription className="text-amber-800 dark:text-amber-200">
              <strong>Upgrade to Elite</strong> for fully personalized supportive compound recommendations based on your specific stack and analysis results.
            </AlertDescription>
          </Alert>
        )}

        {/* Supports List */}
        <div className="space-y-4">
          {displaySupports.map((support, index) => {
            const amazonLink = support.amazon_affiliate_link || generateAmazonAffiliateLink(support.name)
            const hasAffiliateLink = !!(support.amazon_affiliate_link || amazonLink?.includes('tag='))
            return (
              <div key={index} className="border rounded-lg p-4 bg-white/50 dark:bg-black/20">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-muted">
                      <SystemIcon system={support.affected_system} className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-medium text-lg">{support.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {support.common_purpose}
                      </p>
                    </div>
                  </div>
                  <Badge className={`${getPurposeColor(support.common_purpose)} flex items-center gap-1`}>
                    <SystemIcon system={support.affected_system} className="h-3 w-3" />
                    {support.affected_system}
                  </Badge>
                </div>

                {support.communityNotes && (
                  <p className="text-sm mb-3 leading-relaxed">
                    {support.communityNotes}
                  </p>
                )}

                {support.partnership_note && (
                  <div className="mb-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                    <div className="flex items-start gap-2 mb-2">
                      <Stethoscope className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-muted-foreground">
                        {support.partnership_note.replace(/\[affiliate link\]|\[link\]|\[affiliate\]/gi, '').trim()}
                      </p>
                    </div>
                    {parsePartnershipCtas(support.partnership_note).length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {parsePartnershipCtas(support.partnership_note).map((cta, i) => (
                          <Button key={i} size="sm" asChild className="bg-blue-600 hover:bg-blue-700 text-white">
                            <a href={cta.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1">
                              <ExternalLink className="h-3 w-3" />
                              {cta.label}
                            </a>
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Educational reference only</span>
                    {(hasAffiliateLink || (support.partnership_note && parsePartnershipCtas(support.partnership_note).length > 0)) && (
                      <Badge variant="outline" className="text-xs">
                        Affiliate – supports development
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" asChild>
                      <a
                        href={amazonLink}
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
              </div>
            )
          })}
        </div>

        {/* Affiliate Disclosure */}
        <div className="mt-6 pt-4 border-t">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <strong>Educational Only:</strong> These are commonly discussed supportive compounds based on community observations.
              Individual responses vary significantly. Always consult healthcare professionals before starting new supplements.
              <br /><br />
              <span className="text-xs text-muted-foreground">
                {getAffiliateDisclosure()}
              </span>
            </AlertDescription>
          </Alert>
        </div>

        {/* Always-visible blood test CTA */}
        <div className="mt-4 pt-4 border-t flex flex-col sm:flex-row items-center justify-center gap-3">
          <div className="text-sm text-muted-foreground text-center">
            Order comprehensive blood panels to monitor your markers
          </div>
          <div className="flex flex-wrap gap-2 justify-center">
            <Button size="sm" asChild className="bg-blue-600 hover:bg-blue-700 text-white">
              <a href="/blood-panel-order" className="flex items-center gap-1">
                <Stethoscope className="h-3.5 w-3.5" />
                Order Blood Test
              </a>
            </Button>
            <Button size="sm" variant="outline" asChild>
              <a href={TELEHEALTH_PARTNERS.quest} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1">
                <ExternalLink className="h-3.5 w-3.5" />
                Quest
              </a>
            </Button>
            <Button size="sm" variant="outline" asChild>
              <a href={TELEHEALTH_PARTNERS.letsGetChecked} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1">
                <ExternalLink className="h-3.5 w-3.5" />
                LetsGetChecked
              </a>
            </Button>
          </div>
        </div>

        {/* Elite Call-to-Action - only when showing generic supports (stack-explorer) and not gated */}
        {isGeneral && !isGated && (
          <div className="mt-4 pt-4 border-t text-center">
            <Button className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white">
              <Crown className="h-4 w-4 mr-2" />
              Upgrade to Elite for Fully Personalized Supports
            </Button>
          </div>
        )}
        </div>
      </CardContent>
    </Card>
  )
}