'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Eye,
  Scale,
  Target,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Info,
  Zap
} from 'lucide-react'

interface PhotoAnalysisResult {
  visualAssessment: {
    overallChanges: string
    bodyComposition: string
    postureAlignment: string
    confidenceLevel: string
  }
  symmetryAnalysis: {
    bilateralSymmetry: string
    proportionalDevelopment: string
    asymmetryNotes: string
    recommendations: string[]
  }
  regionalAnalysis: {
    upperBody: {
      shoulders: string
      chest: string
      arms: string
      back: string
    }
    coreMidsection: {
      abdominals: string
      obliques: string
      overallDefinition: string
    }
    lowerBody: {
      quadriceps: string
      hamstrings: string
      calves: string
      glutes: string
    }
  }
  progressIndicators: Array<{
    category: string
    observation: string
    timeline: string
    confidence: string
  }>
  methodologicalLimitations: string[]
  educationalRecommendations: string[]
  educationalNotes: string
}

interface VisionReportCardProps {
  result: PhotoAnalysisResult
}

export function VisionReportCard({ result }: VisionReportCardProps) {
  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high': return 'bg-green-100 text-green-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      {/* Visual Assessment Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Visual Assessment Summary
          </CardTitle>
          <CardDescription>
            Educational overview of apparent visual changes and body composition
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold mb-2">Overall Changes</h4>
              <p className="text-sm text-muted-foreground">
                {result.visualAssessment.overallChanges}
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Body Composition</h4>
              <p className="text-sm text-muted-foreground">
                {result.visualAssessment.bodyComposition}
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Posture & Alignment</h4>
              <p className="text-sm text-muted-foreground">
                {result.visualAssessment.postureAlignment}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <h4 className="font-semibold">Confidence Level:</h4>
              <Badge className={getConfidenceColor(result.visualAssessment.confidenceLevel)}>
                {result.visualAssessment.confidenceLevel}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Symmetry Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5" />
            Symmetry & Proportional Analysis
          </CardTitle>
          <CardDescription>
            Educational assessment of bilateral balance and development proportions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold mb-2">Bilateral Symmetry</h4>
              <p className="text-sm text-muted-foreground">
                {result.symmetryAnalysis.bilateralSymmetry}
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Proportional Development</h4>
              <p className="text-sm text-muted-foreground">
                {result.symmetryAnalysis.proportionalDevelopment}
              </p>
            </div>
          </div>

          {result.symmetryAnalysis.asymmetryNotes && (
            <div>
              <h4 className="font-semibold mb-2">Asymmetry Notes</h4>
              <p className="text-sm text-muted-foreground">
                {result.symmetryAnalysis.asymmetryNotes}
              </p>
            </div>
          )}

          {result.symmetryAnalysis.recommendations && result.symmetryAnalysis.recommendations.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2">Educational Recommendations</h4>
              <ul className="space-y-1">
                {result.symmetryAnalysis.recommendations.map((rec, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Regional Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Regional Muscle Group Analysis
          </CardTitle>
          <CardDescription>
            Educational assessment by major muscle groups and body regions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Upper Body */}
          <div>
            <h4 className="font-semibold mb-3 text-primary">Upper Body</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="font-medium text-sm">Shoulders:</span>
                <p className="text-sm text-muted-foreground mt-1">
                  {result.regionalAnalysis.upperBody.shoulders}
                </p>
              </div>
              <div>
                <span className="font-medium text-sm">Chest:</span>
                <p className="text-sm text-muted-foreground mt-1">
                  {result.regionalAnalysis.upperBody.chest}
                </p>
              </div>
              <div>
                <span className="font-medium text-sm">Arms:</span>
                <p className="text-sm text-muted-foreground mt-1">
                  {result.regionalAnalysis.upperBody.arms}
                </p>
              </div>
              <div>
                <span className="font-medium text-sm">Back:</span>
                <p className="text-sm text-muted-foreground mt-1">
                  {result.regionalAnalysis.upperBody.back}
                </p>
              </div>
            </div>
          </div>

          {/* Core */}
          <div>
            <h4 className="font-semibold mb-3 text-primary">Core & Midsection</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <span className="font-medium text-sm">Abdominals:</span>
                <p className="text-sm text-muted-foreground mt-1">
                  {result.regionalAnalysis.coreMidsection.abdominals}
                </p>
              </div>
              <div>
                <span className="font-medium text-sm">Obliques:</span>
                <p className="text-sm text-muted-foreground mt-1">
                  {result.regionalAnalysis.coreMidsection.obliques}
                </p>
              </div>
              <div>
                <span className="font-medium text-sm">Overall Definition:</span>
                <p className="text-sm text-muted-foreground mt-1">
                  {result.regionalAnalysis.coreMidsection.overallDefinition}
                </p>
              </div>
            </div>
          </div>

          {/* Lower Body */}
          <div>
            <h4 className="font-semibold mb-3 text-primary">Lower Body</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="font-medium text-sm">Quadriceps:</span>
                <p className="text-sm text-muted-foreground mt-1">
                  {result.regionalAnalysis.lowerBody.quadriceps}
                </p>
              </div>
              <div>
                <span className="font-medium text-sm">Hamstrings:</span>
                <p className="text-sm text-muted-foreground mt-1">
                  {result.regionalAnalysis.lowerBody.hamstrings}
                </p>
              </div>
              <div>
                <span className="font-medium text-sm">Calves:</span>
                <p className="text-sm text-muted-foreground mt-1">
                  {result.regionalAnalysis.lowerBody.calves}
                </p>
              </div>
              <div>
                <span className="font-medium text-sm">Glutes:</span>
                <p className="text-sm text-muted-foreground mt-1">
                  {result.regionalAnalysis.lowerBody.glutes}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Progress Indicators */}
      {result.progressIndicators && result.progressIndicators.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Progress Indicators
            </CardTitle>
            <CardDescription>
              Educational observations of potential progress markers
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {result.progressIndicators.map((indicator, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold capitalize">
                    {indicator.category.replace('_', ' ')}
                  </h4>
                  <Badge className={getConfidenceColor(indicator.confidence)}>
                    {indicator.confidence} confidence
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div>
                    <span className="font-medium text-sm">Observation:</span>
                    <p className="text-sm text-muted-foreground mt-1">
                      {indicator.observation}
                    </p>
                  </div>

                  <div>
                    <span className="font-medium text-sm">Expected Timeline:</span>
                    <p className="text-sm text-muted-foreground mt-1">
                      {indicator.timeline}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Methodological Limitations */}
      {result.methodologicalLimitations && result.methodologicalLimitations.length > 0 && (
        <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <strong>Important Methodological Limitations:</strong>
              <ul className="space-y-1 mt-2">
                {result.methodologicalLimitations.map((limitation, index) => (
                  <li key={index} className="text-sm">• {limitation}</li>
                ))}
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Educational Recommendations */}
      {result.educationalRecommendations && result.educationalRecommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              Educational Recommendations
            </CardTitle>
            <CardDescription>
              Suggestions for continued monitoring and assessment
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {result.educationalRecommendations.map((rec, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  {rec}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Educational Notes */}
      {result.educationalNotes && (
        <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800">
          <Info className="h-4 w-4" />
          <AlertDescription className="text-sm">
            <strong>Educational Context:</strong> {result.educationalNotes}
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}