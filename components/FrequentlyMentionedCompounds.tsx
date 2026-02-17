'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'
import { AlertTriangle, Loader2, Pill } from 'lucide-react'
import { SystemIcon, getMonitoringIcon } from '@/lib/system-icons'

interface CompoundFromDb {
  id: string
  name: string
  category: string
  common_uses: string | null
  risk_score: number
  side_effects: string | null
  affected_systems: string[] | null
  key_monitoring_markers: string[] | null
  nutrition_impact_summary: string | null
  what_it_is: string | null
}

interface FrequentlyMentionedCompoundsProps {
  compoundNames: string[]
  className?: string
}

export function FrequentlyMentionedCompounds({
  compoundNames,
  className
}: FrequentlyMentionedCompoundsProps) {
  const [compounds, setCompounds] = useState<CompoundFromDb[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState<string[]>([])

  useEffect(() => {
    if (!compoundNames || compoundNames.length === 0) {
      setLoading(false)
      setCompounds([])
      setNotFound([])
      return
    }

    const controller = new AbortController()
    setLoading(true)

    fetch('/api/compounds/by-names', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ names: compoundNames }),
      signal: controller.signal
    })
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          throw new Error(err.error || `HTTP ${res.status}`)
        }
        return res.json()
      })
      .then((data: { compounds?: CompoundFromDb[]; notFound?: string[] }) => {
        const list = Array.isArray(data?.compounds) ? data.compounds : []
        const missing = Array.isArray(data?.notFound) ? data.notFound : []
        setCompounds(list)
        setNotFound(missing)
      })
      .catch(() => {
        setCompounds([])
        setNotFound(compoundNames)
      })
      .finally(() => setLoading(false))

    return () => controller.abort()
  }, [compoundNames?.join(',')])

  const getRiskBadgeVariant = (score: number) => {
    if (score <= 3) return 'secondary'
    if (score <= 6) return 'outline'
    return 'destructive'
  }

  const getRiskLabel = (score: number) => {
    if (score <= 3) return 'Low'
    if (score <= 6) return 'Medium'
    if (score <= 8) return 'High'
    return 'Very High'
  }

  const getRiskTooltip = (compound: CompoundFromDb): string => {
    const label = getRiskLabel(compound.risk_score)
    const systems = compound.affected_systems?.length
      ? compound.affected_systems.join(', ')
      : 'multiple systems'
    const monitoring = compound.key_monitoring_markers?.length
      ? compound.key_monitoring_markers.join(', ')
      : 'bloodwork'
    return `${label} due to ${systems} impact — communities emphasize ${monitoring} monitoring`
  }

  if (loading) {
    return (
      <div className={`flex items-center gap-2 text-sm text-muted-foreground ${className}`}>
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading compound details...
      </div>
    )
  }

  if (compounds.length === 0 && notFound.length === 0) {
    return null
  }

  return (
    <TooltipProvider>
      <div className={`space-y-4 ${className}`}>
        <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
          <Pill className="h-4 w-4" />
          Frequently Mentioned Compounds
        </h4>

        <div className="space-y-3">
          {compounds.map((compound) => (
            <Card key={compound.id} className="border-l-4 border-l-primary/50">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <h5 className="font-medium">
                      <Link
                        href={`/compounds?compound=${encodeURIComponent(compound.name)}`}
                        className="hover:underline text-primary"
                      >
                        {compound.name}
                      </Link>
                    </h5>
                    <Badge variant="outline" className="text-xs mt-1">
                      {compound.category}
                    </Badge>
                  </div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge variant={getRiskBadgeVariant(compound.risk_score)} className="cursor-help">
                        Risk {compound.risk_score}/10 — {getRiskLabel(compound.risk_score)}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>{getRiskTooltip(compound)}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>

              {compound.what_it_is && (
                <p className="text-sm text-muted-foreground mb-2">{compound.what_it_is}</p>
              )}

              {compound.side_effects && (
                <div className="mb-2">
                  <span className="text-xs font-semibold text-destructive">Side effects (commonly reported):</span>
                  <p className="text-sm text-muted-foreground">{compound.side_effects}</p>
                </div>
              )}

              {compound.affected_systems && compound.affected_systems.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {compound.affected_systems.map((sys, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs flex items-center gap-1">
                      <SystemIcon system={sys} className="h-3 w-3" />
                      {sys}
                    </Badge>
                  ))}
                </div>
              )}

              {compound.key_monitoring_markers && compound.key_monitoring_markers.length > 0 && (
                <div>
                  <span className="text-xs font-semibold">Monitor:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {compound.key_monitoring_markers.map((m, idx) => {
                      const Icon = getMonitoringIcon(m)
                      return (
                        <Badge key={idx} variant="outline" className="text-xs flex items-center gap-1">
                          <Icon className="h-3 w-3" />
                          {m}
                        </Badge>
                      )
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {notFound.length > 0 && (
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <div>
              <span className="font-medium">No database entry for:</span>{' '}
              {notFound.join(', ')} — educational context only.
            </div>
          </div>
        )}
      </div>
    </div>
    </TooltipProvider>
  )
}
