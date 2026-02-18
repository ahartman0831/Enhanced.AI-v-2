'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Info } from 'lucide-react'

interface PhotoMetadata {
  currentWeight?: string
  weightUnit?: 'lbs'
  height?: string
  heightUnit?: 'ft' | 'cm'
  lighting?: string
  pumpStatus?: string
  trainingPhase?: string
  supplementationPhase?: string
  notes?: string
  isFast?: boolean
  recentWorkout?: boolean
  wellHydrated?: boolean
}

interface PhotoMetaFormProps {
  metadata: PhotoMetadata
  onMetadataChange: (metadata: PhotoMetadata) => void
}

export function PhotoMetaForm({ metadata, onMetadataChange }: PhotoMetaFormProps) {
  const updateMetadata = (field: keyof PhotoMetadata, value: any) => {
    onMetadataChange({
      ...metadata,
      [field]: value
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="h-5 w-5" />
          Optional Metadata
        </CardTitle>
        <CardDescription>
          Provide additional context to improve analysis accuracy. All fields are optional.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Physical Measurements */}
        <div className="space-y-4">
          <h4 className="font-medium">Physical Measurements</h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="weight">Current Weight (lbs)</Label>
              <Input
                id="weight"
                type="number"
                step="0.1"
                placeholder="150"
                value={metadata.currentWeight || ''}
                onChange={(e) => updateMetadata('currentWeight', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="height">Height</Label>
              <div className="flex gap-2">
                <Input
                  id="height"
                  type="number"
                  placeholder="5.8"
                  value={metadata.height || ''}
                  onChange={(e) => updateMetadata('height', e.target.value)}
                />
                <Select
                  value={metadata.heightUnit || 'ft'}
                  onValueChange={(value: 'ft' | 'cm') => updateMetadata('heightUnit', value)}
                >
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ft">ft</SelectItem>
                    <SelectItem value="cm">cm</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        {/* Photo Conditions */}
        <div className="space-y-4">
          <h4 className="font-medium">Photo Conditions</h4>

          <div className="space-y-2">
            <Label htmlFor="lighting">Lighting Conditions</Label>
            <Select
              value={metadata.lighting || ''}
              onValueChange={(value) => updateMetadata('lighting', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select lighting condition" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="natural">Natural light (outdoor)</SelectItem>
                <SelectItem value="studio">Studio lighting</SelectItem>
                <SelectItem value="indoor">Indoor artificial light</SelectItem>
                <SelectItem value="mixed">Mixed lighting</SelectItem>
                <SelectItem value="poor">Poor lighting</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pump">Muscle Pump Status</Label>
            <Select
              value={metadata.pumpStatus || ''}
              onValueChange={(value) => updateMetadata('pumpStatus', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select pump status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="no-pump">No pump (rest day)</SelectItem>
                <SelectItem value="light-pump">Light pump</SelectItem>
                <SelectItem value="moderate-pump">Moderate pump</SelectItem>
                <SelectItem value="heavy-pump">Heavy pump</SelectItem>
                <SelectItem value="peak-pump">Peak pump</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Training Context */}
        <div className="space-y-4">
          <h4 className="font-medium">Training Context</h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="training-phase">Training Phase</Label>
              <Select
                value={metadata.trainingPhase || ''}
                onValueChange={(value) => updateMetadata('trainingPhase', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select training phase" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bulking">Bulking</SelectItem>
                  <SelectItem value="cutting">Cutting</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="strength">Strength focus</SelectItem>
                  <SelectItem value="hypertrophy">Hypertrophy focus</SelectItem>
                  <SelectItem value="deload">Deload/Recovery</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="supplementation">Supplementation Phase</Label>
              <Select
                value={metadata.supplementationPhase || ''}
                onValueChange={(value) => updateMetadata('supplementationPhase', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select supplementation phase" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="baseline">Baseline (no supplements)</SelectItem>
                  <SelectItem value="light">Light supplementation</SelectItem>
                  <SelectItem value="moderate">Moderate supplementation</SelectItem>
                  <SelectItem value="intensive">Intensive protocol</SelectItem>
                  <SelectItem value="pct">PCT phase</SelectItem>
                  <SelectItem value="bridge">Bridge/cruise phase</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Condition Checkboxes */}
        <div className="space-y-4">
          <h4 className="font-medium">Current Conditions</h4>

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="fasted"
                checked={metadata.isFast || false}
                onCheckedChange={(checked) => updateMetadata('isFast', checked)}
              />
              <Label htmlFor="fasted" className="text-sm cursor-pointer">
                Currently fasted (no food for 4+ hours)
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="recent-workout"
                checked={metadata.recentWorkout || false}
                onCheckedChange={(checked) => updateMetadata('recentWorkout', checked)}
              />
              <Label htmlFor="recent-workout" className="text-sm cursor-pointer">
                Recent workout (within last 24 hours)
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="hydrated"
                checked={metadata.wellHydrated || false}
                onCheckedChange={(checked) => updateMetadata('wellHydrated', checked)}
              />
              <Label htmlFor="hydrated" className="text-sm cursor-pointer">
                Well hydrated (drank water recently)
              </Label>
            </div>
          </div>
        </div>

        {/* Additional Notes */}
        <div className="space-y-2">
          <Label htmlFor="notes">Additional Notes</Label>
          <Textarea
            id="notes"
            placeholder="Any other relevant context (sleep quality, stress levels, recent changes, etc.)"
            value={metadata.notes || ''}
            onChange={(e) => updateMetadata('notes', e.target.value)}
            rows={3}
          />
        </div>

        {/* Metadata Info */}
        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Why metadata matters:</strong> Providing context helps improve analysis accuracy.
            Lighting conditions, pump status, and training phase can significantly affect visual assessment.
            This information helps provide more relevant educational insights.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}