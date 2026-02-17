'use client'

import { useState, useEffect } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CompoundNutritionCard } from '@/components/CompoundNutritionCard'
import { DoctorPdfButton } from '@/components/DoctorPdfButton'
import { PersonalizedSuppStack } from '@/components/PersonalizedSuppStack'
import { CommonSupportsCard } from '@/components/CommonSupportsCard'
import {
  AlertTriangle,
  Plus,
  X,
  Loader2,
  CheckCircle,
  Activity,
  Pill
} from 'lucide-react'

interface Compound {
  id: string
  name: string
  category: string
}

interface SideEffectAnalysisResult {
  compoundAnalysis: Array<{
    compoundName: string
    reportedEffects: string[]
    potentialMechanisms: string[]
    commonManagement: string[]
    monitoringMarkers: string[]
    riskLevel: string
  }>
  interactions: Array<{
    compounds: string[]
    potentialEffects: string[]
    management: string[]
  }>
  nutritionImpact: {
    dietaryConsiderations: string
    supplementInteractions: string
    timingStrategies: string
    supportiveNutrition: string
  }
  monitoringProtocol: string[]
  educationalNotes: string
  commonlyDiscussedSupports?: Array<{
    name: string
    commonPurpose: string
    affectedSystem: string
    communityNotes?: string
  }>
}

const COMMON_SIDE_EFFECTS = [
  'Hair Loss',
  'Gynecomastia (Gyno)',
  'Insomnia',
  'Acne',
  'Lethargy/Fatigue',
  'High Blood Pressure',
  'Night Sweats',
  'Mood Changes',
  'Joint Pain',
  'Headaches',
  'Nausea',
  'Appetite Changes',
  'Testicle Shrinkage',
  'Erectile Dysfunction',
  'Increased Aggression',
  'Water Retention',
  'Liver Strain',
  'Cholesterol Changes',
  'Sleep Apnea',
  'Other'
]

export default function SideEffectsPage() {
  const [compounds, setCompounds] = useState<Compound[]>([])
  const [selectedCompounds, setSelectedCompounds] = useState<string[]>([])
  const [selectedSideEffects, setSelectedSideEffects] = useState<string[]>([])
  const [customSideEffect, setCustomSideEffect] = useState('')
  const [dosages, setDosages] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [result, setResult] = useState<SideEffectAnalysisResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const supabase = createSupabaseBrowserClient()

  // Fetch compounds on component mount
  useEffect(() => {
    async function fetchCompounds() {
      try {
        const { data, error } = await supabase
          .from('compounds')
          .select('id, name, category')
          .order('name')

        if (error) throw error

        setCompounds(data || [])
      } catch (err) {
        console.error('Error fetching compounds:', err)
        setError('Failed to load compounds database')
      } finally {
        setLoading(false)
      }
    }

    fetchCompounds()
  }, [supabase])

  const addCompound = (compoundId: string) => {
    if (!selectedCompounds.includes(compoundId)) {
      setSelectedCompounds([...selectedCompounds, compoundId])
    }
  }

  const removeCompound = (compoundId: string) => {
    setSelectedCompounds(selectedCompounds.filter(id => id !== compoundId))
  }

  const addSideEffect = (effect: string) => {
    if (effect && !selectedSideEffects.includes(effect)) {
      setSelectedSideEffects([...selectedSideEffects, effect])
      setCustomSideEffect('')
    }
  }

  const addCustomSideEffect = () => {
    if (customSideEffect.trim()) {
      addSideEffect(customSideEffect.trim())
    }
  }

  const removeSideEffect = (effect: string) => {
    setSelectedSideEffects(selectedSideEffects.filter(e => e !== effect))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    if (selectedCompounds.length === 0 || selectedSideEffects.length === 0) {
      setError('Please select at least one compound and one side effect')
      setIsSubmitting(false)
      return
    }

    try {
      // Get compound names for the API call
      const compoundNames = selectedCompounds.map(id => {
        const compound = compounds.find(c => c.id === id)
        return compound?.name || id
      })

      const response = await fetch('/api/side-effects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          compounds: compoundNames,
          dosages,
          sideEffects: selectedSideEffects
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze side effects')
      }

      setResult(data.data)

    } catch (err: any) {
      setError(err.message || 'An error occurred while analyzing side effects')
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setSelectedCompounds([])
    setSelectedSideEffects([])
    setCustomSideEffect('')
    setDosages('')
    setResult(null)
    setError(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading side effects analyzer...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Side Effects Analyzer</h1>
          <p className="text-muted-foreground">
            Educational analysis of potential side effects and management strategies.
          </p>
        </div>

        {/* Disclaimer Banner */}
        <Alert className="mb-8 border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            <strong>Educational tool only. Not medical advice. Consult your physician.</strong> All analysis provided is for educational purposes only and should not be used as a substitute for professional medical advice, diagnosis, or treatment.
          </AlertDescription>
        </Alert>

        {!result ? (
          /* Form */
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Compound Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Pill className="h-5 w-5" />
                  Select Compounds
                </CardTitle>
                <CardDescription>
                  Choose the compounds you're currently using or considering
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Add Compound</Label>
                  <Select onValueChange={addCompound}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a compound..." />
                    </SelectTrigger>
                    <SelectContent>
                      {compounds
                        .filter(c => !selectedCompounds.includes(c.id))
                        .map((compound) => (
                          <SelectItem key={compound.id} value={compound.id}>
                            {compound.name} ({compound.category})
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedCompounds.length > 0 && (
                  <div className="space-y-2">
                    <Label>Selected Compounds</Label>
                    <div className="flex flex-wrap gap-2">
                      {selectedCompounds.map((compoundId) => {
                        const compound = compounds.find(c => c.id === compoundId)
                        return compound ? (
                          <Badge key={compoundId} variant="secondary" className="flex items-center gap-1">
                            {compound.name}
                            <button
                              type="button"
                              onClick={() => removeCompound(compoundId)}
                              className="ml-1 hover:text-destructive"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ) : null
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Dosages */}
            <Card>
              <CardHeader>
                <CardTitle>Dosages (Optional)</CardTitle>
                <CardDescription>
                  Describe your current dosages or planned usage
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Example: Testosterone 100mg/week, Trenbolone 50mg/week, etc."
                  value={dosages}
                  onChange={(e) => setDosages(e.target.value)}
                  rows={4}
                />
              </CardContent>
            </Card>

            {/* Side Effects */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Select Side Effects
                </CardTitle>
                <CardDescription>
                  Choose the side effects you're experiencing or concerned about
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Common Side Effects</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {COMMON_SIDE_EFFECTS.filter(effect => !selectedSideEffects.includes(effect)).map((effect) => (
                      <Button
                        key={effect}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addSideEffect(effect)}
                        className="justify-start text-left h-auto py-2 px-3"
                      >
                        <Plus className="h-3 w-3 mr-2" />
                        {effect}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Custom Side Effect */}
                <div className="space-y-2">
                  <Label>Custom Side Effect</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter custom side effect..."
                      value={customSideEffect}
                      onChange={(e) => setCustomSideEffect(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomSideEffect())}
                    />
                    <Button type="button" onClick={addCustomSideEffect} size="sm">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {selectedSideEffects.length > 0 && (
                  <div className="space-y-2">
                    <Label>Selected Side Effects</Label>
                    <div className="flex flex-wrap gap-2">
                      {selectedSideEffects.map((effect) => (
                        <Badge key={effect} variant="destructive" className="flex items-center gap-1">
                          {effect}
                          <button
                            type="button"
                            onClick={() => removeSideEffect(effect)}
                            className="ml-1 hover:text-white"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Error Display */}
            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Submit Button */}
            <div className="flex justify-center">
              <Button
                type="submit"
                disabled={isSubmitting || selectedCompounds.length === 0 || selectedSideEffects.length === 0}
                size="lg"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Analyzing Side Effects...
                  </>
                ) : (
                  'Analyze Side Effects'
                )}
              </Button>
            </div>
          </form>
        ) : (
          /* Results */
          <div className="space-y-8">
            {/* Disclaimer */}
            <Alert className="border-destructive/50">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                <strong>Educational Analysis Only:</strong> This analysis explores potential mechanisms and commonly discussed management strategies. Individual responses vary significantly. This is not medical advice - consult qualified healthcare professionals for personalized guidance.
              </AlertDescription>
            </Alert>

            {/* Compound Analysis */}
            {result.compoundAnalysis && result.compoundAnalysis.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-6">Compound Analysis</h2>
                <div className="grid grid-cols-1 gap-6">
                  {result.compoundAnalysis.map((analysis, index) => (
                    <Card key={index}>
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          {analysis.compoundName}
                          <Badge variant={analysis.riskLevel === 'high' ? 'destructive' :
                                        analysis.riskLevel === 'medium' ? 'outline' : 'secondary'}>
                            {analysis.riskLevel} risk
                          </Badge>
                        </CardTitle>
                        <CardDescription>
                          Reported effects: {analysis.reportedEffects.join(', ')}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {analysis.potentialMechanisms && analysis.potentialMechanisms.length > 0 && (
                          <div>
                            <h4 className="font-semibold mb-2">Potential Mechanisms</h4>
                            <ul className="space-y-1">
                              {analysis.potentialMechanisms.map((mechanism, idx) => (
                                <li key={idx} className="text-sm text-muted-foreground flex items-start">
                                  <span className="text-primary mr-2">•</span>
                                  {mechanism}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {analysis.commonManagement && analysis.commonManagement.length > 0 && (
                          <div>
                            <h4 className="font-semibold mb-2">Common Management Approaches</h4>
                            <ul className="space-y-1">
                              {analysis.commonManagement.map((management, idx) => (
                                <li key={idx} className="text-sm text-muted-foreground flex items-start">
                                  <span className="text-green-500 mr-2">•</span>
                                  {management}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {analysis.monitoringMarkers && analysis.monitoringMarkers.length > 0 && (
                          <div>
                            <h4 className="font-semibold mb-2">Monitoring Markers</h4>
                            <div className="flex flex-wrap gap-1">
                              {analysis.monitoringMarkers.map((marker, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {marker}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Interactions */}
            {result.interactions && result.interactions.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Potential Interactions</CardTitle>
                  <CardDescription>
                    Educational analysis of compound interactions
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {result.interactions.map((interaction, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <h4 className="font-semibold mb-2">
                        {interaction.compounds.join(' + ')}
                      </h4>

                      {interaction.potentialEffects && interaction.potentialEffects.length > 0 && (
                        <div className="mb-3">
                          <h5 className="text-sm font-medium mb-1">Potential Effects:</h5>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            {interaction.potentialEffects.map((effect, idx) => (
                              <li key={idx} className="flex items-start">
                                <span className="text-orange-500 mr-2">•</span>
                                {effect}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {interaction.management && interaction.management.length > 0 && (
                        <div>
                          <h5 className="text-sm font-medium mb-1">Management:</h5>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            {interaction.management.map((mgmt, idx) => (
                              <li key={idx} className="flex items-start">
                                <span className="text-green-500 mr-2">•</span>
                                {mgmt}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Nutrition Impact */}
            {result.nutritionImpact && (
              <div>
                <h2 className="text-2xl font-bold mb-6">Nutrition Impact Analysis</h2>
                <CompoundNutritionCard compound={{
                  name: 'Nutrition Strategy Overview',
                  description: 'Educational nutritional considerations for side effect management',
                  benefits: [],
                  risks: [],
                  interactions: [],
                  dosage: undefined
                }} />

                <Card className="mt-4">
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {result.nutritionImpact.dietaryConsiderations && (
                        <div>
                          <h4 className="font-semibold mb-2">Dietary Considerations</h4>
                          <p className="text-sm text-muted-foreground">
                            {result.nutritionImpact.dietaryConsiderations}
                          </p>
                        </div>
                      )}

                      {result.nutritionImpact.supportiveNutrition && (
                        <div>
                          <h4 className="font-semibold mb-2">Supportive Nutrition</h4>
                          <p className="text-sm text-muted-foreground">
                            {result.nutritionImpact.supportiveNutrition}
                          </p>
                        </div>
                      )}

                      {result.nutritionImpact.timingStrategies && (
                        <div>
                          <h4 className="font-semibold mb-2">Timing Strategies</h4>
                          <p className="text-sm text-muted-foreground">
                            {result.nutritionImpact.timingStrategies}
                          </p>
                        </div>
                      )}

                      {result.nutritionImpact.supplementInteractions && (
                        <div>
                          <h4 className="font-semibold mb-2">Supplement Interactions</h4>
                          <p className="text-sm text-muted-foreground">
                            {result.nutritionImpact.supplementInteractions}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Monitoring Protocol */}
            {result.monitoringProtocol && result.monitoringProtocol.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Monitoring Recommendations</CardTitle>
                  <CardDescription>
                    Educational suggestions for tracking and safety monitoring
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {result.monitoringProtocol.map((recommendation, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{recommendation}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Educational Notes */}
            {result.educationalNotes && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{result.educationalNotes}</AlertDescription>
              </Alert>
            )}

        {/* Personalized Supp Stack - Elite Feature */}
        <PersonalizedSuppStack analysisType="side-effects" />

        {/* Commonly Discussed Supports */}
        {result.commonlyDiscussedSupports && result.commonlyDiscussedSupports.length > 0 && (
          <CommonSupportsCard
            supports={result.commonlyDiscussedSupports}
            analysisType="side-effects"
            isElite={false} // TODO: Implement tier checking
          />
        )}

            {/* PDF Button */}
            <div className="flex justify-center">
              <DoctorPdfButton
                patientData={{
                  name: 'Side Effects Analysis Report',
                  id: 'side-effects-analysis',
                  analysis: result
                }}
                analysisType="side-effects"
              />
            </div>

            {/* Analyze Again Button */}
            <div className="flex justify-center">
              <Button onClick={resetForm} variant="outline">
                Analyze Different Side Effects
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}