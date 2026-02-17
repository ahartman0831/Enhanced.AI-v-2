'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Beaker, Loader2, AlertTriangle, ExternalLink } from 'lucide-react'

interface CompoundBreakdown {
  disclaimer?: string
  what_it_is?: string
  medical_uses?: string
  bodybuilding_discussions?: string
  risks_and_side_effects?: string
  affected_systems?: string[]
  monitoring_markers?: string[]
  nutrition_impact?: string
  common_interactions?: string
  sources?: string[]
}

interface CompoundCardProps {
  compound: {
    id: string
    name: string
    category: string
    common_uses: string | null
    risk_score: number
    affected_systems: string[] | null
    key_monitoring_markers: string[] | null
    nutrition_impact_summary: string | null
  }
}

export function CompoundCard({ compound }: CompoundCardProps) {
  const [breakdownOpen, setBreakdownOpen] = useState(false)
  const [breakdown, setBreakdown] = useState<CompoundBreakdown | null>(null)
  const [breakdownLoading, setBreakdownLoading] = useState(false)
  const [breakdownError, setBreakdownError] = useState<string | null>(null)

  const fetchBreakdown = async () => {
    setBreakdownOpen(true)
    setBreakdownError(null)
    if (breakdown) return
    setBreakdownLoading(true)
    try {
      const res = await fetch(`/api/compounds/${compound.id}/breakdown`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load breakdown')
      setBreakdown(data)
    } catch (err: unknown) {
      setBreakdownError(err instanceof Error ? err.message : 'Failed to load breakdown')
    } finally {
      setBreakdownLoading(false)
    }
  }

  const handleCardClick = () => {
    fetchBreakdown()
  }
  const getRiskBadgeVariant = (score: number) => {
    if (score <= 3) return 'secondary' // Low risk
    if (score <= 6) return 'outline'   // Medium risk
    if (score <= 8) return 'destructive' // High risk
    return 'destructive' // Very high risk
  }

  const getRiskLabel = (score: number) => {
    if (score <= 3) return 'Low Risk'
    if (score <= 6) return 'Medium Risk'
    if (score <= 8) return 'High Risk'
    return 'Very High Risk'
  }

  return (
    <>
    <Card
      className="w-full hover:shadow-lg transition-shadow cursor-pointer"
      onClick={handleCardClick}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg mb-1">{compound.name}</CardTitle>
            <CardDescription className="text-sm font-medium text-primary">
              {compound.category}
            </CardDescription>
          </div>
          <Badge
            variant={getRiskBadgeVariant(compound.risk_score)}
            className="ml-2 shrink-0"
          >
            {compound.risk_score}/10 - {getRiskLabel(compound.risk_score)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {compound.common_uses && (
          <div>
            <h4 className="font-semibold text-sm mb-2">Common Uses</h4>
            <p className="text-sm text-muted-foreground">{compound.common_uses}</p>
          </div>
        )}

        {compound.affected_systems && compound.affected_systems.length > 0 && (
          <div>
            <h4 className="font-semibold text-sm mb-2">Affected Systems</h4>
            <div className="flex flex-wrap gap-1">
              {compound.affected_systems.map((system, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {system}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {compound.key_monitoring_markers && compound.key_monitoring_markers.length > 0 && (
          <div>
            <h4 className="font-semibold text-sm mb-2">Key Monitoring Markers</h4>
            <div className="flex flex-wrap gap-1">
              {compound.key_monitoring_markers.map((marker, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {marker}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {compound.nutrition_impact_summary && (
          <div>
            <h4 className="font-semibold text-sm mb-2">Nutrition Impact</h4>
            <p className="text-sm text-muted-foreground">{compound.nutrition_impact_summary}</p>
          </div>
        )}

        <Button
          variant="outline"
          size="sm"
          className="w-full mt-2"
          onClick={(e) => {
            e.stopPropagation()
            fetchBreakdown()
          }}
        >
          <Beaker className="h-4 w-4 mr-2" />
          View Full Scientific Breakdown
        </Button>
      </CardContent>
    </Card>

    <Dialog open={breakdownOpen} onOpenChange={setBreakdownOpen}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Beaker className="h-5 w-5" />
            {compound.name} — Scientific Breakdown
          </DialogTitle>
          <DialogDescription>{compound.category}</DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 pr-2 -mr-2 space-y-6">
          {breakdownLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}

          {breakdownError && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{breakdownError}</AlertDescription>
            </Alert>
          )}

          {breakdown && !breakdownLoading && (
            <>
              {breakdown.disclaimer && (
                <Alert className="border-amber-200 dark:border-amber-800">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-xs">{breakdown.disclaimer}</AlertDescription>
                </Alert>
              )}

              {breakdown.what_it_is && (
                <div>
                  <h4 className="font-semibold mb-2">What It Is</h4>
                  <p className="text-sm text-muted-foreground">{breakdown.what_it_is}</p>
                </div>
              )}

              {breakdown.medical_uses && (
                <div>
                  <h4 className="font-semibold mb-2">Medical Uses</h4>
                  <p className="text-sm text-muted-foreground">{breakdown.medical_uses}</p>
                </div>
              )}

              {breakdown.bodybuilding_discussions && (
                <div>
                  <h4 className="font-semibold mb-2">Bodybuilding Discussions</h4>
                  <p className="text-sm text-muted-foreground">{breakdown.bodybuilding_discussions}</p>
                </div>
              )}

              {breakdown.risks_and_side_effects && (
                <div>
                  <h4 className="font-semibold mb-2 text-destructive">Risks & Side Effects</h4>
                  <p className="text-sm text-muted-foreground">{breakdown.risks_and_side_effects}</p>
                </div>
              )}

              {breakdown.affected_systems && breakdown.affected_systems.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Affected Systems</h4>
                  <div className="flex flex-wrap gap-1">
                    {breakdown.affected_systems.map((sys, idx) => (
                      <Badge key={idx} variant="outline">{sys}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {breakdown.monitoring_markers && breakdown.monitoring_markers.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Monitoring Markers</h4>
                  <div className="flex flex-wrap gap-1">
                    {breakdown.monitoring_markers.map((m, idx) => (
                      <Badge key={idx} variant="secondary">{m}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {breakdown.nutrition_impact && (
                <div>
                  <h4 className="font-semibold mb-2">Nutrition Impact</h4>
                  <p className="text-sm text-muted-foreground">{breakdown.nutrition_impact}</p>
                </div>
              )}

              {breakdown.common_interactions && (
                <div>
                  <h4 className="font-semibold mb-2">Common Interactions</h4>
                  <p className="text-sm text-muted-foreground">{breakdown.common_interactions}</p>
                </div>
              )}

              {breakdown.sources && breakdown.sources.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-1">
                    <ExternalLink className="h-4 w-4" />
                    Sources
                  </h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {breakdown.sources.map((src, idx) => (
                      <li key={idx}>
                        {src.startsWith('http') ? (
                          <a href={src} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                            {src}
                          </a>
                        ) : (
                          src
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
    </>
  )
}