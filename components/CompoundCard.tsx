'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

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
    <Card className="w-full hover:shadow-lg transition-shadow cursor-pointer">
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
      </CardContent>
    </Card>
  )
}