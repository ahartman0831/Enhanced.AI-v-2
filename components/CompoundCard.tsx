'use client'

import { useState, type ReactNode } from 'react'
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
import { cn } from '@/lib/utils'
import { Beaker, Loader2, AlertTriangle, ExternalLink } from 'lucide-react'

interface CompoundBreakdown {
  disclaimer?: string
  layman_summary?: string
  what_it_is?: string
  medical_uses?: string
  bodybuilding_discussions?: string
  risks_and_side_effects?: string | Record<string, unknown>
  affected_systems?: string[]
  monitoring_markers?: (string | { marker?: string; why?: string })[]
  nutrition_impact?: string
  common_interactions?: string
  sources?: string[]
}

function renderBreakdownValue(value: string | Record<string, unknown> | undefined): ReactNode {
  if (value == null) return null
  if (typeof value === 'string') return value
  if (typeof value === 'object' && !Array.isArray(value)) {
    return (
      <div className="space-y-3">
        {Object.entries(value).map(([key, val]) => (
          <div key={key} className="space-y-1">
            <span className="font-medium text-foreground">{key}</span>
            <div className="text-muted-foreground text-sm">
              {typeof val === 'string' ? (
                val
              ) : Array.isArray(val) ? (
                <ul className="list-disc list-inside space-y-1">
                  {val.map((item, i) => (
                    <li key={i}>{typeof item === 'string' ? item : JSON.stringify(item)}</li>
                  ))}
                </ul>
              ) : typeof val === 'object' && val !== null ? (
                renderBreakdownValue(val as Record<string, unknown>)
              ) : (
                String(val)
              )}
            </div>
          </div>
        ))}
      </div>
    )
  }
  return String(value)
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
  const getRiskBadgeStyles = (score: number) => {
    if (score <= 3) return 'bg-emerald-500/90 text-emerald-950 border-emerald-400 dark:bg-emerald-500 dark:text-emerald-950 dark:border-emerald-400'
    if (score <= 6) return 'bg-cyan-500/90 text-cyan-950 border-cyan-400 dark:bg-cyan-500 dark:text-cyan-950 dark:border-cyan-400'
    if (score <= 8) return 'bg-amber-500/90 text-amber-950 border-amber-400 dark:bg-amber-500 dark:text-amber-950 dark:border-amber-400'
    return 'bg-red-500/90 text-red-950 border-red-400 dark:bg-red-500 dark:text-red-950 dark:border-red-400'
  }

  const getRiskLabel = (score: number) => {
    if (score <= 3) return 'Low Risk'
    if (score <= 6) return 'Medium Risk'
    if (score <= 8) return 'High Risk'
    return 'Very High Risk'
  }

  // Use breakdown data as fallback when DB hasn't been refetched (e.g. right after loading breakdown)
  const displayMarkers = (): string[] => {
    if (compound.key_monitoring_markers?.length) return compound.key_monitoring_markers
    if (!breakdown?.monitoring_markers?.length) return []
    return breakdown.monitoring_markers.map((m) =>
      typeof m === 'string' ? m : (typeof m === 'object' && m !== null && 'marker' in m ? String((m as { marker?: string }).marker ?? '') : String(m))
    ).filter(Boolean)
  }

  const markers = displayMarkers()

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
            variant="outline"
            className={cn('ml-2 shrink-0 border', getRiskBadgeStyles(compound.risk_score))}
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

        <div>
          <h4 className="font-semibold text-sm mb-2">Key Monitoring Markers</h4>
          {markers.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {markers.map((marker, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {marker}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">Bloodwork monitoring recommended — click for full breakdown</p>
          )}
        </div>

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
                  <AlertDescription className="text-xs">{renderBreakdownValue(breakdown.disclaimer)}</AlertDescription>
                </Alert>
              )}

              {breakdown.layman_summary && (
                <div className="rounded-lg bg-muted/50 p-4 border">
                  <h4 className="font-semibold mb-2">In Plain English</h4>
                  <div className="text-sm text-muted-foreground">{renderBreakdownValue(breakdown.layman_summary)}</div>
                </div>
              )}

              {breakdown.what_it_is && (
                <div>
                  <h4 className="font-semibold mb-2">What It Is</h4>
                  <div className="text-sm text-muted-foreground">{renderBreakdownValue(breakdown.what_it_is)}</div>
                </div>
              )}

              {breakdown.medical_uses && (
                <div>
                  <h4 className="font-semibold mb-2">Medical Uses</h4>
                  <div className="text-sm text-muted-foreground">{renderBreakdownValue(breakdown.medical_uses)}</div>
                </div>
              )}

              {breakdown.bodybuilding_discussions && (
                <div>
                  <h4 className="font-semibold mb-2">Bodybuilding Discussions</h4>
                  <div className="text-sm text-muted-foreground">{renderBreakdownValue(breakdown.bodybuilding_discussions)}</div>
                </div>
              )}

              {breakdown.risks_and_side_effects && (
                <div>
                  <h4 className="font-semibold mb-2 text-destructive">Risks & Side Effects</h4>
                  <div className="text-sm text-muted-foreground">{renderBreakdownValue(breakdown.risks_and_side_effects)}</div>
                </div>
              )}

              {breakdown.affected_systems && breakdown.affected_systems.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Affected Systems</h4>
                  <div className="flex flex-wrap gap-1">
                    {breakdown.affected_systems.map((sys, idx) => (
                      <Badge key={idx} variant="outline">{typeof sys === 'string' ? sys : String(sys)}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {breakdown.monitoring_markers && breakdown.monitoring_markers.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Monitoring Markers</h4>
                  <div className="flex flex-wrap gap-1">
                    {breakdown.monitoring_markers.map((m, idx) => (
                      <Badge key={idx} variant="secondary">
                        {typeof m === 'string' ? m : typeof m === 'object' && m !== null && 'marker' in m
                          ? String((m as { marker?: string }).marker ?? JSON.stringify(m))
                          : String(m)}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {breakdown.nutrition_impact && (
                <div>
                  <h4 className="font-semibold mb-2">Nutrition Impact</h4>
                  <div className="text-sm text-muted-foreground">{renderBreakdownValue(breakdown.nutrition_impact)}</div>
                </div>
              )}

              {breakdown.common_interactions && (
                <div>
                  <h4 className="font-semibold mb-2">Common Interactions</h4>
                  <div className="text-sm text-muted-foreground">{renderBreakdownValue(breakdown.common_interactions)}</div>
                </div>
              )}

              {breakdown.sources && breakdown.sources.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-1">
                    <ExternalLink className="h-4 w-4" />
                    Sources
                  </h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {breakdown.sources.map((src, idx) => {
                      const str = typeof src === 'string' ? src : String(src)
                      return (
                        <li key={idx}>
                          {str.startsWith('http') ? (
                            <a href={str} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                              {str}
                            </a>
                          ) : (
                            str
                          )}
                        </li>
                      )
                    })}
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