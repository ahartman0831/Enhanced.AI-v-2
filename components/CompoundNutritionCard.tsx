'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle } from 'lucide-react'

interface CompoundNutritionCardProps {
  compound: {
    name: string
    description: string
    benefits: string[]
    risks: string[]
    dosage?: string
    interactions?: string[]
  }
}

export function CompoundNutritionCard({ compound }: CompoundNutritionCardProps) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg">{compound.name}</CardTitle>
        <CardDescription>{compound.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {compound.dosage && (
          <div>
            <h4 className="font-semibold text-sm mb-1">Recommended Dosage</h4>
            <p className="text-sm text-muted-foreground">{compound.dosage}</p>
          </div>
        )}

        <div>
          <h4 className="font-semibold text-sm mb-2">Benefits</h4>
          <div className="flex flex-wrap gap-1">
            {compound.benefits.map((benefit, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {benefit}
              </Badge>
            ))}
          </div>
        </div>

        {compound.risks.length > 0 && (
          <div className="rounded-md border-2 border-destructive/30 bg-destructive/5 dark:bg-destructive/10 p-3">
            <h4 className="font-bold text-sm mb-2 text-destructive flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              Potential Risks
            </h4>
            <div className="flex flex-wrap gap-1">
              {compound.risks.map((risk, index) => (
                <Badge key={index} variant="destructive" className="text-xs">
                  {risk}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {compound.interactions && compound.interactions.length > 0 && (
          <div>
            <h4 className="font-semibold text-sm mb-2 text-orange-600">Interactions</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              {compound.interactions.map((interaction, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-orange-500 mr-2">•</span>
                  {interaction}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}