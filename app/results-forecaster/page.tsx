'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { DoctorPdfButton } from '@/components/DoctorPdfButton'
import {
  TrendingUp,
  AlertTriangle,
  Loader2,
  CheckCircle,
  Clock,
  Target,
  BarChart3
} from 'lucide-react'

interface ForecastResult {
  currentAssessment: {
    protocolSummary: string
    baselineMarkers: string
    progressIndicators: string
    overallStartingPoint: string
  }
  forecasts: {
    week4: {
      timeline: string
      expectedChanges: Array<{
        category: string
        description: string
        confidence: string
        influencingFactors: string[]
      }>
      monitoringFocus: string[]
      educationalNotes: string
    }
    week8: {
      timeline: string
      expectedChanges: Array<{
        category: string
        description: string
        confidence: string
        influencingFactors: string[]
      }>
      monitoringFocus: string[]
      educationalNotes: string
    }
    week12: {
      timeline: string
      expectedChanges: Array<{
        category: string
        description: string
        confidence: string
        influencingFactors: string[]
      }>
      monitoringFocus: string[]
      educationalNotes: string
    }
  }
  individualFactors: Array<{
    factor: string
    impact: string
    monitoring: string
  }>
  riskConsiderations: Array<{
    riskType: string
    description: string
    mitigation: string[]
  }>
  educationalSummary: {
    keyTakeaways: string[]
    monitoringImportance: string
    professionalOversight: string
    realisticExpectations: string
  }
}

export default function ResultsForecasterPage() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [result, setResult] = useState<ForecastResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [hasData, setHasData] = useState(false)

  // Check if user has protocols or bloodwork data
  useState(() => {
    const checkUserData = async () => {
      try {
        // This would check if user has protocols/bloodwork/photos
        // For now, we'll assume they do
        setHasData(true)
      } catch (err) {
        console.error('Error checking user data:', err)
      }
    }

    checkUserData()
  })

  const handleGenerateForecast = async () => {
    setIsGenerating(true)
    setError(null)

    try {
      const response = await fetch('/api/forecast-results', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate forecast')
      }

      setResult(data.data)

    } catch (err: any) {
      setError(err.message || 'An error occurred while generating forecast')
    } finally {
      setIsGenerating(false)
    }
  }

  const resetForecast = () => {
    setResult(null)
    setError(null)
  }

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high': return 'bg-green-100 text-green-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Results Forecaster</h1>
          <p className="text-muted-foreground">
            Educational projections of potential health optimization outcomes.
          </p>
        </div>

        {/* Disclaimer Banner */}
        <Alert className="mb-8 border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            <strong>Educational tool only. Not predictions or guarantees. Individual results vary significantly.</strong> These projections are generalized educational estimates based on common community observations. Professional medical monitoring is essential.
          </AlertDescription>
        </Alert>

        {!result ? (
          /* Forecast Generation Form */
          <div className="space-y-8">
            {/* Forecast Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Results Forecasting
                </CardTitle>
                <CardDescription>
                  Generate educational projections based on your current protocol, bloodwork, and progress data
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                    <Clock className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                    <h4 className="font-semibold mb-1">4-Week Outlook</h4>
                    <p className="text-sm text-muted-foreground">
                      Short-term projections based on current status
                    </p>
                  </div>

                  <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                    <BarChart3 className="h-8 w-8 mx-auto mb-2 text-green-600" />
                    <h4 className="font-semibold mb-1">8-Week Outlook</h4>
                    <p className="text-sm text-muted-foreground">
                      Medium-term projections with adaptations
                    </p>
                  </div>

                  <div className="text-center p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                    <Target className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                    <h4 className="font-semibold mb-1">12-Week Outlook</h4>
                    <p className="text-sm text-muted-foreground">
                      Long-term considerations and trends
                    </p>
                  </div>
                </div>

                <div className="bg-muted/30 rounded-lg p-4">
                  <h4 className="font-semibold mb-2">Data Sources Used:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Current supplementation protocols</li>
                    <li>• Recent bloodwork results</li>
                    <li>• Progress photo analysis</li>
                    <li>• Individual baseline markers</li>
                  </ul>
                </div>

                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Educational Projections Only:</strong> These are generalized estimates based on common community observations,
                    not personalized predictions. Individual responses vary dramatically based on genetics, adherence, quality, and many other factors.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            {/* Error Display */}
            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Generate Button */}
            <div className="flex justify-center">
              <Button
                onClick={handleGenerateForecast}
                disabled={isGenerating || !hasData}
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating Forecast...
                  </>
                ) : (
                  'Generate Results Forecast'
                )}
              </Button>
            </div>

            {!hasData && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>No Data Available:</strong> Results forecasting requires existing protocol and bloodwork data.
                  Please complete a stack analysis, upload bloodwork, and add progress photos first.
                </AlertDescription>
              </Alert>
            )}
          </div>
        ) : (
          /* Results Display */
          <div className="space-y-8">
            {/* Current Assessment */}
            {result.currentAssessment && (
              <Card>
                <CardHeader>
                  <CardTitle>Current Assessment</CardTitle>
                  <CardDescription>
                    Educational overview of your starting point and current status
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-2">Protocol Summary</h4>
                      <p className="text-sm text-muted-foreground">
                        {result.currentAssessment.protocolSummary}
                      </p>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Baseline Markers</h4>
                      <p className="text-sm text-muted-foreground">
                        {result.currentAssessment.baselineMarkers}
                      </p>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Progress Indicators</h4>
                      <p className="text-sm text-muted-foreground">
                        {result.currentAssessment.progressIndicators}
                      </p>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Overall Starting Point</h4>
                      <p className="text-sm text-muted-foreground">
                        {result.currentAssessment.overallStartingPoint}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Forecasts by Timeline */}
            {result.forecasts && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">Educational Projections</h2>

                {/* 4-Week Forecast */}
                {result.forecasts.week4 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-blue-600" />
                        4-Week Educational Outlook
                      </CardTitle>
                      <CardDescription>{result.forecasts.week4.timeline}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {result.forecasts.week4.expectedChanges && result.forecasts.week4.expectedChanges.length > 0 && (
                        <div>
                          <h4 className="font-semibold mb-3">Expected Educational Changes</h4>
                          <div className="space-y-3">
                            {result.forecasts.week4.expectedChanges.map((change, index) => (
                              <div key={index} className="border rounded-lg p-3">
                                <div className="flex items-start justify-between mb-2">
                                  <h5 className="font-medium capitalize">{change.category.replace('_', ' ')}</h5>
                                  <Badge className={getConfidenceColor(change.confidence)}>
                                    {change.confidence} confidence
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground mb-2">{change.description}</p>
                                {change.influencingFactors && change.influencingFactors.length > 0 && (
                                  <div>
                                    <span className="text-xs font-medium">Influencing factors:</span>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {change.influencingFactors.map((factor, idx) => (
                                        <Badge key={idx} variant="outline" className="text-xs">
                                          {factor}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {result.forecasts.week4.monitoringFocus && result.forecasts.week4.monitoringFocus.length > 0 && (
                        <div>
                          <h4 className="font-semibold mb-2">Monitoring Focus</h4>
                          <ul className="space-y-1">
                            {result.forecasts.week4.monitoringFocus.map((focus, index) => (
                              <li key={index} className="flex items-start gap-2 text-sm">
                                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                                {focus}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {result.forecasts.week4.educationalNotes && (
                        <Alert>
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription className="text-sm">
                            {result.forecasts.week4.educationalNotes}
                          </AlertDescription>
                        </Alert>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* 8-Week Forecast */}
                {result.forecasts.week8 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-green-600" />
                        8-Week Educational Outlook
                      </CardTitle>
                      <CardDescription>{result.forecasts.week8.timeline}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {result.forecasts.week8.expectedChanges && result.forecasts.week8.expectedChanges.length > 0 && (
                        <div>
                          <h4 className="font-semibold mb-3">Expected Educational Changes</h4>
                          <div className="space-y-3">
                            {result.forecasts.week8.expectedChanges.map((change, index) => (
                              <div key={index} className="border rounded-lg p-3">
                                <div className="flex items-start justify-between mb-2">
                                  <h5 className="font-medium capitalize">{change.category.replace('_', ' ')}</h5>
                                  <Badge className={getConfidenceColor(change.confidence)}>
                                    {change.confidence} confidence
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground mb-2">{change.description}</p>
                                {change.influencingFactors && change.influencingFactors.length > 0 && (
                                  <div>
                                    <span className="text-xs font-medium">Influencing factors:</span>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {change.influencingFactors.map((factor, idx) => (
                                        <Badge key={idx} variant="outline" className="text-xs">
                                          {factor}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {result.forecasts.week8.monitoringFocus && result.forecasts.week8.monitoringFocus.length > 0 && (
                        <div>
                          <h4 className="font-semibold mb-2">Monitoring Focus</h4>
                          <ul className="space-y-1">
                            {result.forecasts.week8.monitoringFocus.map((focus, index) => (
                              <li key={index} className="flex items-start gap-2 text-sm">
                                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                                {focus}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {result.forecasts.week8.educationalNotes && (
                        <Alert>
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription className="text-sm">
                            {result.forecasts.week8.educationalNotes}
                          </AlertDescription>
                        </Alert>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* 12-Week Forecast */}
                {result.forecasts.week12 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5 text-purple-600" />
                        12-Week Educational Outlook
                      </CardTitle>
                      <CardDescription>{result.forecasts.week12.timeline}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {result.forecasts.week12.expectedChanges && result.forecasts.week12.expectedChanges.length > 0 && (
                        <div>
                          <h4 className="font-semibold mb-3">Expected Educational Changes</h4>
                          <div className="space-y-3">
                            {result.forecasts.week12.expectedChanges.map((change, index) => (
                              <div key={index} className="border rounded-lg p-3">
                                <div className="flex items-start justify-between mb-2">
                                  <h5 className="font-medium capitalize">{change.category.replace('_', ' ')}</h5>
                                  <Badge className={getConfidenceColor(change.confidence)}>
                                    {change.confidence} confidence
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground mb-2">{change.description}</p>
                                {change.influencingFactors && change.influencingFactors.length > 0 && (
                                  <div>
                                    <span className="text-xs font-medium">Influencing factors:</span>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {change.influencingFactors.map((factor, idx) => (
                                        <Badge key={idx} variant="outline" className="text-xs">
                                          {factor}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {result.forecasts.week12.monitoringFocus && result.forecasts.week12.monitoringFocus.length > 0 && (
                        <div>
                          <h4 className="font-semibold mb-2">Monitoring Focus</h4>
                          <ul className="space-y-1">
                            {result.forecasts.week12.monitoringFocus.map((focus, index) => (
                              <li key={index} className="flex items-start gap-2 text-sm">
                                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                                {focus}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {result.forecasts.week12.educationalNotes && (
                        <Alert>
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription className="text-sm">
                            {result.forecasts.week12.educationalNotes}
                          </AlertDescription>
                        </Alert>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Individual Factors */}
            {result.individualFactors && result.individualFactors.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Individual Factors to Consider</CardTitle>
                  <CardDescription>
                    Educational factors that may influence your personal response timeline
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {result.individualFactors.map((factor, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <h4 className="font-semibold mb-2">{factor.factor}</h4>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h5 className="text-sm font-medium mb-1">Potential Impact</h5>
                          <p className="text-sm text-muted-foreground">{factor.impact}</p>
                        </div>

                        <div>
                          <h5 className="text-sm font-medium mb-1">Monitoring Suggestions</h5>
                          <p className="text-sm text-muted-foreground">{factor.monitoring}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Risk Considerations */}
            {result.riskConsiderations && result.riskConsiderations.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Educational Risk Considerations</CardTitle>
                  <CardDescription>
                    Important factors to monitor for safety and effectiveness
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {result.riskConsiderations.map((risk, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold">{risk.description}</h4>
                        <Badge variant="outline" className="capitalize">
                          {risk.riskType} risk
                        </Badge>
                      </div>

                      {risk.mitigation && risk.mitigation.length > 0 && (
                        <div>
                          <h5 className="text-sm font-medium mb-1">Educational Mitigation Strategies</h5>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            {risk.mitigation.map((strategy, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                                {strategy}
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

            {/* Educational Summary */}
            {result.educationalSummary && (
              <Card>
                <CardHeader>
                  <CardTitle>Educational Summary</CardTitle>
                  <CardDescription>
                    Key educational takeaways from this forecasting analysis
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {result.educationalSummary.keyTakeaways && result.educationalSummary.keyTakeaways.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">Key Educational Takeaways</h4>
                      <ul className="space-y-1">
                        {result.educationalSummary.keyTakeaways.map((takeaway, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm">
                            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                            {takeaway}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                      <h4 className="font-semibold mb-2">Monitoring Importance</h4>
                      <p className="text-sm text-muted-foreground">
                        {result.educationalSummary.monitoringImportance}
                      </p>
                    </div>

                    <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                      <h4 className="font-semibold mb-2">Professional Oversight</h4>
                      <p className="text-sm text-muted-foreground">
                        {result.educationalSummary.professionalOversight}
                      </p>
                    </div>

                    <div className="p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                      <h4 className="font-semibold mb-2">Realistic Expectations</h4>
                      <p className="text-sm text-muted-foreground">
                        {result.educationalSummary.realisticExpectations}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Critical Disclaimer */}
            <Alert className="border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                <strong>Critical Educational Reminder:</strong> These projections are generalized educational estimates based on common community observations.
                Individual responses vary dramatically based on genetics, adherence, quality, and numerous other factors. These are NOT predictions or guarantees.
                Professional medical monitoring is essential for any health optimization approach.
              </AlertDescription>
            </Alert>

            {/* PDF Button */}
            <div className="flex justify-center">
              <DoctorPdfButton
                patientData={{
                  name: 'Results Forecast Analysis Report',
                  id: 'results-forecast',
                  analysis: result
                }}
                analysisType="results-forecast"
              />
            </div>

            {/* Generate New Forecast Button */}
            <div className="flex justify-center">
              <Button onClick={resetForecast} variant="outline">
                Generate New Forecast
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}