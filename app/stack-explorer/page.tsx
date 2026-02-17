'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { CompoundNutritionCard } from '@/components/CompoundNutritionCard'
import { DoctorPdfButton } from '@/components/DoctorPdfButton'
import { PersonalizedSuppStack } from '@/components/PersonalizedSuppStack'
import {
  ChevronLeft,
  ChevronRight,
  Target,
  User,
  Shield,
  FileText,
  AlertTriangle,
  Loader2,
  CheckCircle,
  Lightbulb
} from 'lucide-react'

interface StackAnalysisResult {
  commonApproaches: Array<{
    name: string
    description: string
    typicalCompounds: string[]
    rationale: string
    considerations: string[]
    experienceFit: string
    riskLevel: string
  }>
  nutritionImpact: {
    proteinConsiderations: string
    calorieManagement: string
    micronutrientFocus: string
    timingStrategies: string
    supplementSynergy: string
  }
  monitoringRecommendations: string[]
  educationalNotes: string
}

const GOALS_OPTIONS = [
  'Contest Prep',
  'Lean Bulk',
  'Cut',
  'TRT Optimization',
  'General Health Optimization',
  'Recovery Enhancement',
  'Strength Gains',
  'Endurance Improvement',
  'Body Recomposition',
  'Other'
]

const EXPERIENCE_LEVELS = [
  { value: 'beginner', label: 'Beginner (New to supplementation)' },
  { value: 'intermediate', label: 'Intermediate (Some experience)' },
  { value: 'advanced', label: 'Advanced (Extensive experience)' }
]

const RISK_TOLERANCE = [
  { value: 'low', label: 'Low (Prefer conservative approaches)' },
  { value: 'medium', label: 'Medium (Balanced risk/benefit)' },
  { value: 'high', label: 'High (Open to advanced strategies)' }
]

export default function StackExplorerPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [result, setResult] = useState<StackAnalysisResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Form data
  const [goals, setGoals] = useState('')
  const [customGoal, setCustomGoal] = useState('')
  const [experience, setExperience] = useState('')
  const [riskTolerance, setRiskTolerance] = useState('')
  const [bloodwork, setBloodwork] = useState('')

  const totalSteps = 4

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setError(null)

    try {
      const finalGoals = goals === 'Other' ? customGoal : goals

      const response = await fetch('/api/stack-explorer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          goals: finalGoals,
          experience,
          riskTolerance,
          bloodwork: bloodwork || undefined
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze stack')
      }

      setResult(data.data)
      setCurrentStep(totalSteps + 1) // Show results

    } catch (err: any) {
      setError(err.message || 'An error occurred while analyzing your stack')
    } finally {
      setIsSubmitting(false)
    }
  }

  const canProceed = () => {
    switch (currentStep) {
      case 1: return goals && (goals !== 'Other' || customGoal.trim())
      case 2: return experience
      case 3: return riskTolerance
      case 4: return true // Bloodwork is optional
      default: return false
    }
  }

  const resetForm = () => {
    setCurrentStep(1)
    setResult(null)
    setError(null)
    setGoals('')
    setCustomGoal('')
    setExperience('')
    setRiskTolerance('')
    setBloodwork('')
  }

  // Render form steps
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Step 1: Define Your Goals
              </CardTitle>
              <CardDescription>
                What are your primary health and fitness objectives?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Primary Goal</Label>
                <Select value={goals} onValueChange={setGoals}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your primary goal" />
                  </SelectTrigger>
                  <SelectContent>
                    {GOALS_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {goals === 'Other' && (
                <div className="space-y-2">
                  <Label>Describe Your Goal</Label>
                  <Textarea
                    placeholder="Please describe your specific goals..."
                    value={customGoal}
                    onChange={(e) => setCustomGoal(e.target.value)}
                    rows={3}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        )

      case 2:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Step 2: Experience Level
              </CardTitle>
              <CardDescription>
                How familiar are you with supplementation and health optimization?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Experience Level</Label>
                <Select value={experience} onValueChange={setExperience}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your experience level" />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPERIENCE_LEVELS.map((level) => (
                      <SelectItem key={level.value} value={level.value}>
                        {level.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        )

      case 3:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Step 3: Risk Tolerance
              </CardTitle>
              <CardDescription>
                How comfortable are you with different levels of intervention?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Risk Tolerance</Label>
                <Select value={riskTolerance} onValueChange={setRiskTolerance}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your risk tolerance" />
                  </SelectTrigger>
                  <SelectContent>
                    {RISK_TOLERANCE.map((level) => (
                      <SelectItem key={level.value} value={level.value}>
                        {level.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        )

      case 4:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Step 4: Bloodwork Summary (Optional)
              </CardTitle>
              <CardDescription>
                Share any recent bloodwork results for more personalized insights
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Bloodwork Summary</Label>
                <Textarea
                  placeholder="Paste your bloodwork results here (optional)..."
                  value={bloodwork}
                  onChange={(e) => setBloodwork(e.target.value)}
                  rows={6}
                />
                <p className="text-sm text-muted-foreground">
                  Include key markers like testosterone, cortisol, lipids, liver enzymes, etc.
                </p>
              </div>
            </CardContent>
          </Card>
        )

      default:
        return null
    }
  }

  // Render results
  const renderResults = () => {
    if (!result) return null

    return (
      <div className="space-y-8">
        {/* Disclaimer */}
        <Alert className="border-destructive/50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            <strong>Educational Analysis Only:</strong> This is for educational purposes and provides general information about common approaches discussed in health optimization communities. This is not medical advice, personalized recommendations, or treatment plans. Always consult qualified healthcare professionals before making any changes to your health regimen.
          </AlertDescription>
        </Alert>

        {/* Common Approaches */}
        <div>
          <h2 className="text-2xl font-bold mb-6">Common Educational Approaches</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {result.commonApproaches?.map((approach, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-lg">{approach.name}</CardTitle>
                  <CardDescription>{approach.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-sm mb-2">Typical Compounds Discussed:</h4>
                    <div className="flex flex-wrap gap-1">
                      {approach.typicalCompounds?.map((compound, idx) => (
                        <Badge key={idx} variant="outline">{compound}</Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-sm mb-2">Educational Rationale:</h4>
                    <p className="text-sm text-muted-foreground">{approach.rationale}</p>
                  </div>

                  {approach.considerations && approach.considerations.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2">Key Considerations:</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {approach.considerations.map((consideration, idx) => (
                          <li key={idx} className="flex items-start">
                            <span className="text-primary mr-2">•</span>
                            {consideration}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Badge variant={approach.experienceFit === 'beginner' ? 'secondary' :
                                  approach.experienceFit === 'intermediate' ? 'outline' : 'destructive'}>
                      {approach.experienceFit}
                    </Badge>
                    <Badge variant={approach.riskLevel === 'low' ? 'secondary' :
                                  approach.riskLevel === 'medium' ? 'outline' : 'destructive'}>
                      {approach.riskLevel} risk
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Nutrition Impact */}
        {result.nutritionImpact && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Nutrition Impact Analysis</h2>
            <CompoundNutritionCard compound={{
              name: 'Nutrition Strategy Overview',
              description: 'Educational overview of nutritional considerations',
              benefits: [],
              risks: [],
              interactions: [],
              dosage: undefined
            }} />

            <Card className="mt-4">
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {result.nutritionImpact.proteinConsiderations && (
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Lightbulb className="h-4 w-4" />
                        Protein Considerations
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {result.nutritionImpact.proteinConsiderations}
                      </p>
                    </div>
                  )}

                  {result.nutritionImpact.calorieManagement && (
                    <div>
                      <h4 className="font-semibold mb-2">Calorie Management</h4>
                      <p className="text-sm text-muted-foreground">
                        {result.nutritionImpact.calorieManagement}
                      </p>
                    </div>
                  )}

                  {result.nutritionImpact.micronutrientFocus && (
                    <div>
                      <h4 className="font-semibold mb-2">Micronutrient Focus</h4>
                      <p className="text-sm text-muted-foreground">
                        {result.nutritionImpact.micronutrientFocus}
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
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Monitoring Recommendations */}
        {result.monitoringRecommendations && result.monitoringRecommendations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Monitoring Recommendations</CardTitle>
              <CardDescription>
                Educational suggestions for tracking progress and safety
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {result.monitoringRecommendations.map((recommendation, index) => (
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
            <Lightbulb className="h-4 w-4" />
            <AlertDescription>{result.educationalNotes}</AlertDescription>
          </Alert>
        )}

        {/* Personalized Supp Stack - Elite Feature */}
        <PersonalizedSuppStack analysisType="stack-explorer" />

            {/* PDF Button */}
            <div className="flex justify-center">
              <DoctorPdfButton
                patientData={{
                  name: 'Stack Analysis Report',
                  id: 'stack-analysis',
                  analysis: result
                }}
                analysisType="stack-explorer"
              />
            </div>

        {/* Start Over Button */}
        <div className="flex justify-center">
          <Button onClick={resetForm} variant="outline">
            Analyze Different Stack
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Stack Explorer</h1>
          <p className="text-muted-foreground">
            Educational analysis of supplementation approaches based on your goals and preferences.
          </p>
        </div>

        {/* Disclaimer Banner */}
        <Alert className="mb-8 border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            <strong>Educational tool only. Not medical advice. Consult your physician.</strong> All analysis provided is for educational purposes only and should not be used as a substitute for professional medical advice, diagnosis, or treatment.
          </AlertDescription>
        </Alert>

        {/* Progress Indicator */}
        {currentStep <= totalSteps && (
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm font-medium">
                Step {currentStep} of {totalSteps}
              </span>
              <span className="text-sm text-muted-foreground">
                {Math.round((currentStep / totalSteps) * 100)}% complete
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / totalSteps) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Form Steps or Results */}
        {currentStep <= totalSteps ? renderStep() : renderResults()}

        {/* Navigation Buttons */}
        {currentStep <= totalSteps && (
          <div className="flex justify-between mt-8">
            <Button
              onClick={prevStep}
              disabled={currentStep === 1}
              variant="outline"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>

            {currentStep < totalSteps ? (
              <Button onClick={nextStep} disabled={!canProceed()}>
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={!canProceed() || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  'Generate Analysis'
                )}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}