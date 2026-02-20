'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useDevMode } from '@/hooks/useDevMode'
import { TierGate } from '@/components/TierGate'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { DoctorPdfButton } from '@/components/DoctorPdfButton'
import { DataInputModal } from '@/components/DataInputModal'
import {
  TrendingUp,
  AlertTriangle,
  Loader2,
  CheckCircle,
  Clock,
  Target,
  BarChart3,
  Zap,
  AlertCircle,
  Calendar,
  History,
  Trash2,
  Beaker,
  Stethoscope
} from 'lucide-react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'

interface WeekForecast {
  timeline: string
  bodyComposition?: string
  bloodMarkers?: string
  potentialSides?: string
  recoveryEnergySleep?: string
  generalNotes?: string
  // Legacy format (for backward compatibility)
  expectedChanges?: Array<{
    category: string
    description: string
    confidence: string
    influencingFactors: string[]
  }>
  monitoringFocus?: string[]
  educationalNotes?: string
}

/** Risk consideration (expanded format with category, likelihood, mitigation) */
interface RiskConsideration {
  category?: string
  description?: string
  riskType?: string
  communityLikelihood?: string
  educationalMitigation?: string
  mitigation?: string[]
}

interface PotentialInteractions {
  synergies?: string[]
  conflicts?: string[]
  educationalNotes?: string
}

interface PctProjections {
  overview?: string
  timeline?: {
    earlyPostIntervention?: string
    earlyRecoveryPhase?: string
    extendedRecoveryPhase?: string
    /** @deprecated use earlyPostIntervention */
    immediate?: string
    /** @deprecated use earlyRecoveryPhase */
    'weeks2-4'?: string
    /** @deprecated use extendedRecoveryPhase */
    'weeks4-12'?: string
  }
  commonConcepts?: string[]
  monitoringNotes?: string
}

interface ForecastResult {
  currentAssessment: {
    protocolSummary: string
    overallStartingPoint: string
    baselineMarkers?: string
    progressIndicators?: string
  }
  forecasts: {
    week4: WeekForecast
    week8: WeekForecast
    week12: WeekForecast
  }
  individualFactors: Array<{
    factor: string
    impact: string
    monitoring: string
  }>
  potentialInteractions?: PotentialInteractions
  riskConsiderations?: RiskConsideration[]
  pctProjections?: PctProjections
  educationalSummary: {
    keyTakeaways: string[]
    monitoringImportance: string
    professionalOversight: string
    realisticExpectations: string
    nextSteps?: string[]
  }
}

export default function ResultsForecasterPage() {
  const { devModeEnabled, loading: devLoading } = useDevMode()
  const [isGenerating, setIsGenerating] = useState(false)
  const [result, setResult] = useState<ForecastResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [hasData, setHasData] = useState(false)
  const [dataModalOpen, setDataModalOpen] = useState(false)
  const [savedForecasts, setSavedForecasts] = useState<Array<{ id: string; stack_json: { forecast: ForecastResult }; created_at: string }>>([])
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [selectedForecastId, setSelectedForecastId] = useState<string | null>(null)

  const fetchSavedForecasts = async () => {
    try {
      const res = await fetch('/api/forecast-results/reports')
      if (res.ok) {
        const { reports } = await res.json()
        setSavedForecasts(reports ?? [])
      }
    } catch {
      // Ignore
    }
  }

  useEffect(() => {
    fetchSavedForecasts()
  }, [])

  useEffect(() => {
    const checkUserData = async () => {
      try {
        setHasData(true)
      } catch (err) {
        console.error('Error checking user data:', err)
      }
    }

    checkUserData()
  }, [])

  // Dev mode: bypass tier gate for development. Otherwise tier gate applies.
  if (devLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    )
  }

  const handleGenerateForecast = async (payload?: { protocolData: string; bloodworkData: string; photoData: string }) => {
    setIsGenerating(true)
    setError(null)

    try {
      const response = await fetch('/api/forecast-results', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: payload ? JSON.stringify(payload) : undefined,
      })

      const data = await response.json()

      if (!response.ok) {
        const msg = data.error || 'Failed to generate forecast'
        const flags = data.flags as string[] | undefined
        throw new Error(flags?.length ? `${msg} Flagged: ${flags.join(', ')}` : msg)
      }

      setResult(data.data)
      setSelectedForecastId(data.forecastId ?? null)
      fetchSavedForecasts()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred while generating forecast')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleLoadSaved = (report: { id: string; stack_json: { forecast: ForecastResult }; created_at: string }) => {
    const forecast = report.stack_json?.forecast
    if (forecast) {
      setResult(forecast)
      setSelectedForecastId(report.id)
      setError(null)
    }
  }

  const handleDeleteSaved = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('Delete this saved forecast? This cannot be undone.')) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/forecast-results/reports/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setSavedForecasts((prev) => prev.filter((r) => r.id !== id))
        if (selectedForecastId === id) {
          setResult(null)
          setSelectedForecastId(null)
        }
      }
    } catch {
      // Ignore
    } finally {
      setDeletingId(null)
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  const handleModalSubmit = async (payload: { protocolData: string }) => {
    await handleGenerateForecast(payload)
  }

  const handleSkipAndUseLastKnown = async () => {
    await handleGenerateForecast()
  }

  const resetForecast = () => {
    setResult(null)
    setError(null)
    setSelectedForecastId(null)
  }

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high': return 'bg-green-100 text-green-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getRiskLikelihoodColor = (likelihood: string | undefined) => {
    const s = (likelihood ?? '').toLowerCase()
    if (s.includes('high') || s.includes('commonly reported')) return 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300 border-red-300'
    if (s.includes('medium') || s.includes('frequently')) return 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border-amber-300'
    if (s.includes('low') || s.includes('less frequently')) return 'bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-300 border-green-300'
    return 'bg-muted text-muted-foreground border-border'
  }

  const getRiskLikelihoodSortOrder = (likelihood: string | undefined) => {
    const s = (likelihood ?? '').toLowerCase()
    if (s.includes('high') || s.includes('commonly reported')) return 0
    if (s.includes('medium') || s.includes('frequently')) return 1
    if (s.includes('low') || s.includes('less frequently')) return 2
    return 3
  }

  const sortedRiskConsiderations = [...(result?.riskConsiderations ?? [])].sort(
    (a, b) =>
      getRiskLikelihoodSortOrder(a.communityLikelihood ?? a.riskType) -
      getRiskLikelihoodSortOrder(b.communityLikelihood ?? b.riskType)
  )

  const content = (
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
                  Generate educational projections based on your current protocol
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                    <Clock className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                    <h4 className="font-semibold mb-1">Early Exposure Phase</h4>
                    <p className="text-sm text-muted-foreground">
                      Early exposure phase projections based on current status
                    </p>
                  </div>

                  <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                    <BarChart3 className="h-8 w-8 mx-auto mb-2 text-green-600" />
                    <h4 className="font-semibold mb-1">Accumulated Exposure Phase</h4>
                    <p className="text-sm text-muted-foreground">
                      Accumulated exposure phase projections with adaptations
                    </p>
                  </div>

                  <div className="text-center p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                    <Target className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                    <h4 className="font-semibold mb-1">Longer-Duration Outlook</h4>
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

            {/* Generate Button - opens confirmation modal (same flow as Recovery Timeline) */}
            <div className="flex justify-center">
              <Button
                onClick={() => setDataModalOpen(true)}
                disabled={isGenerating}
                size="lg"
                className="bg-cyan-600 hover:bg-cyan-700"
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

            <DataInputModal
              open={dataModalOpen}
              onOpenChange={setDataModalOpen}
              onSubmit={handleModalSubmit}
              onSkipAndUseLastKnown={handleSkipAndUseLastKnown}
              title="Confirm Current Protocol & Data"
              description="Please review/update before we generate your educational forecast."
              isSubmitting={isGenerating}
            />

            {savedForecasts.length > 0 && (
              <div className="mt-8 pt-8 border-t">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Saved Forecasts
                </h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Your results forecasts are saved automatically. Click to view or delete.
                </p>
                <div className="space-y-3">
                  {savedForecasts.map((report) => (
                    <Card
                      key={report.id}
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => handleLoadSaved(report)}
                    >
                      <CardHeader className="py-4">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{formatDate(report.created_at)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              onClick={(e) => handleDeleteSaved(report.id, e)}
                              disabled={deletingId === report.id}
                              aria-label="Delete forecast"
                            >
                              {deletingId === report.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {!hasData && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>No Data Available:</strong> Results forecasting requires protocol data.
                  Please complete a stack analysis or side effects check first.
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
                      <h4 className="font-semibold mb-2">Self-Reported Exposure Pattern</h4>
                      <p className="text-sm text-muted-foreground">
                        {result.currentAssessment.protocolSummary}
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
                        Early Exposure Phase
                      </CardTitle>
                      <CardDescription>{result.forecasts.week4.timeline}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {result.forecasts.week4.bodyComposition && (
                        <div>
                          <h4 className="font-semibold mb-2">Body Composition</h4>
                          <p className="text-sm text-muted-foreground">{result.forecasts.week4.bodyComposition}</p>
                        </div>
                      )}
                      {result.forecasts.week4.bloodMarkers && (
                        <div>
                          <h4 className="font-semibold mb-2">Blood Markers</h4>
                          <p className="text-sm text-muted-foreground">{result.forecasts.week4.bloodMarkers}</p>
                        </div>
                      )}
                      {result.forecasts.week4.potentialSides && (
                        <div>
                          <h4 className="font-semibold mb-2">Potential Sides</h4>
                          <p className="text-sm text-muted-foreground">{result.forecasts.week4.potentialSides}</p>
                        </div>
                      )}
                      {result.forecasts.week4.recoveryEnergySleep && (
                        <div>
                          <h4 className="font-semibold mb-2">Recovery, Energy & Sleep</h4>
                          <p className="text-sm text-muted-foreground">{result.forecasts.week4.recoveryEnergySleep}</p>
                        </div>
                      )}
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
                      {(result.forecasts.week4.generalNotes || result.forecasts.week4.educationalNotes) && (
                        <Alert>
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription className="text-sm">
                            {result.forecasts.week4.generalNotes || result.forecasts.week4.educationalNotes}
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
                        Accumulated Exposure Phase
                      </CardTitle>
                      <CardDescription>{result.forecasts.week8.timeline}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {result.forecasts.week8.bodyComposition && (
                        <div>
                          <h4 className="font-semibold mb-2">Body Composition</h4>
                          <p className="text-sm text-muted-foreground">{result.forecasts.week8.bodyComposition}</p>
                        </div>
                      )}
                      {result.forecasts.week8.bloodMarkers && (
                        <div>
                          <h4 className="font-semibold mb-2">Blood Markers</h4>
                          <p className="text-sm text-muted-foreground">{result.forecasts.week8.bloodMarkers}</p>
                        </div>
                      )}
                      {result.forecasts.week8.potentialSides && (
                        <div>
                          <h4 className="font-semibold mb-2">Potential Sides</h4>
                          <p className="text-sm text-muted-foreground">{result.forecasts.week8.potentialSides}</p>
                        </div>
                      )}
                      {result.forecasts.week8.recoveryEnergySleep && (
                        <div>
                          <h4 className="font-semibold mb-2">Recovery, Energy & Sleep</h4>
                          <p className="text-sm text-muted-foreground">{result.forecasts.week8.recoveryEnergySleep}</p>
                        </div>
                      )}
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

                      {(result.forecasts.week8.generalNotes || result.forecasts.week8.educationalNotes) && (
                        <Alert>
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription className="text-sm">
                            {result.forecasts.week8.generalNotes || result.forecasts.week8.educationalNotes}
                          </AlertDescription>
                        </Alert>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Extended Exposure Forecast */}
                {result.forecasts.week12 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5 text-purple-600" />
                        Extended Exposure
                      </CardTitle>
                      <CardDescription>{result.forecasts.week12.timeline}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {result.forecasts.week12.bodyComposition && (
                        <div>
                          <h4 className="font-semibold mb-2">Body Composition</h4>
                          <p className="text-sm text-muted-foreground">{result.forecasts.week12.bodyComposition}</p>
                        </div>
                      )}
                      {result.forecasts.week12.bloodMarkers && (
                        <div>
                          <h4 className="font-semibold mb-2">Blood Markers</h4>
                          <p className="text-sm text-muted-foreground">{result.forecasts.week12.bloodMarkers}</p>
                        </div>
                      )}
                      {result.forecasts.week12.potentialSides && (
                        <div>
                          <h4 className="font-semibold mb-2">Potential Sides</h4>
                          <p className="text-sm text-muted-foreground">{result.forecasts.week12.potentialSides}</p>
                        </div>
                      )}
                      {result.forecasts.week12.recoveryEnergySleep && (
                        <div>
                          <h4 className="font-semibold mb-2">Recovery, Energy & Sleep</h4>
                          <p className="text-sm text-muted-foreground">{result.forecasts.week12.recoveryEnergySleep}</p>
                        </div>
                      )}
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
                      {(result.forecasts.week12.generalNotes || result.forecasts.week12.educationalNotes) && (
                        <Alert>
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription className="text-sm">
                            {result.forecasts.week12.generalNotes || result.forecasts.week12.educationalNotes}
                          </AlertDescription>
                        </Alert>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Potential Interactions (Educational Edition) */}
            {result.potentialInteractions &&
              ((result.potentialInteractions.synergies?.length ?? 0) > 0 ||
                (result.potentialInteractions.conflicts?.length ?? 0) > 0 ||
                !!result.potentialInteractions.educationalNotes) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-amber-600" />
                    Potential Interactions (Educational)
                  </CardTitle>
                  <CardDescription>
                    Commonly discussed synergies and conflicts from community reports — educational only
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    {(result.potentialInteractions.synergies?.length ?? 0) > 0 && (
                      <AccordionItem value="synergies">
                        <AccordionTrigger className="text-left">
                          Synergies (community-reported patterns)
                        </AccordionTrigger>
                        <AccordionContent>
                          <ul className="space-y-1.5 text-sm text-muted-foreground">
                            {result.potentialInteractions.synergies!.map((s, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                                {s}
                              </li>
                            ))}
                          </ul>
                        </AccordionContent>
                      </AccordionItem>
                    )}
                    {(result.potentialInteractions.conflicts?.length ?? 0) > 0 && (
                      <AccordionItem value="conflicts">
                        <AccordionTrigger className="text-left">
                          Conflicts (community-reported patterns)
                        </AccordionTrigger>
                        <AccordionContent>
                          <ul className="space-y-1.5 text-sm text-muted-foreground">
                            {result.potentialInteractions.conflicts!.map((c, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                                {c}
                              </li>
                            ))}
                          </ul>
                        </AccordionContent>
                      </AccordionItem>
                    )}
                  </Accordion>
                  {result.potentialInteractions.educationalNotes && (
                    <p className="mt-4 text-sm text-muted-foreground border-t pt-4">
                      {result.potentialInteractions.educationalNotes}
                    </p>
                  )}
                </CardContent>
              </Card>
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

            {/* Risk Considerations (table for expanded format, cards for legacy) */}
            {result.riskConsiderations && result.riskConsiderations.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Educational Risk Considerations</CardTitle>
                  <CardDescription>
                    Important factors to monitor for safety and effectiveness
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {result.riskConsiderations.some((r) => r.category || r.communityLikelihood || r.educationalMitigation) ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm border-collapse">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2 px-3 font-semibold">Category</th>
                            <th className="text-left py-2 px-3 font-semibold">Description</th>
                            <th className="text-left py-2 px-3 font-semibold">Community Likelihood</th>
                            <th className="text-left py-2 px-3 font-semibold">Educational Mitigation</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sortedRiskConsiderations.map((risk, index) => {
                            const likelihood = risk.communityLikelihood ?? risk.riskType ?? '—'
                            const category = risk.category ?? risk.riskType ?? '—'
                            return (
                              <tr
                                key={index}
                                className={`border-b last:border-0 border-l-4 ${
                                  getRiskLikelihoodSortOrder(likelihood) === 0
                                    ? 'border-l-red-500'
                                    : getRiskLikelihoodSortOrder(likelihood) === 1
                                      ? 'border-l-amber-500'
                                      : getRiskLikelihoodSortOrder(likelihood) === 2
                                        ? 'border-l-green-500'
                                        : 'border-l-muted'
                                }`}
                              >
                                <td className="py-3 px-3 font-medium">{category}</td>
                                <td className="py-3 px-3">{risk.description ?? '—'}</td>
                                <td className="py-3 px-3">
                                  <Badge variant="outline" className={`capitalize ${getRiskLikelihoodColor(likelihood)}`}>
                                    {likelihood}
                                  </Badge>
                                </td>
                                <td className="py-3 px-3 text-muted-foreground">
                                  {risk.educationalMitigation ??
                                    (risk.mitigation?.length ? risk.mitigation.join('; ') : '—')}
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {sortedRiskConsiderations.map((risk, index) => (
                        <div
                          key={index}
                          className={`border rounded-lg p-4 border-l-4 ${
                            getRiskLikelihoodSortOrder(risk.riskType) === 0
                              ? 'border-l-red-500'
                              : getRiskLikelihoodSortOrder(risk.riskType) === 1
                                ? 'border-l-amber-500'
                                : getRiskLikelihoodSortOrder(risk.riskType) === 2
                                  ? 'border-l-green-500'
                                  : 'border-l-muted'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-semibold">{risk.description}</h4>
                            <Badge variant="outline" className={`capitalize ${getRiskLikelihoodColor(risk.riskType)}`}>
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
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* PCT Educational Planner */}
            {result.pctProjections &&
              (!!result.pctProjections.overview ||
                !!result.pctProjections.timeline ||
                (result.pctProjections.commonConcepts?.length ?? 0) > 0 ||
                !!result.pctProjections.monitoringNotes) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-teal-600" />
                    Post-Intervention Endocrine Recovery
                  </CardTitle>
                  <CardDescription>
                    Post-intervention endocrine recovery considerations — medical strategies must be supervised by licensed professionals
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {result.pctProjections.overview && (
                    <p className="text-sm text-muted-foreground">{result.pctProjections.overview}</p>
                  )}
                  {result.pctProjections.timeline && (
                    <div className="space-y-3">
                      <h4 className="font-semibold">Recovery Timeline (Educational)</h4>
                      <div className="grid gap-3">
                        {(result.pctProjections.timeline.earlyPostIntervention ?? result.pctProjections.timeline.immediate) && (
                          <div className="rounded-lg border p-3">
                            <span className="text-xs font-medium text-muted-foreground">Early post-intervention</span>
                            <p className="text-sm mt-1">{result.pctProjections.timeline.earlyPostIntervention ?? result.pctProjections.timeline.immediate}</p>
                          </div>
                        )}
                        {(result.pctProjections.timeline.earlyRecoveryPhase ?? result.pctProjections.timeline['weeks2-4']) && (
                          <div className="rounded-lg border p-3">
                            <span className="text-xs font-medium text-muted-foreground">Early recovery phase</span>
                            <p className="text-sm mt-1">{result.pctProjections.timeline.earlyRecoveryPhase ?? result.pctProjections.timeline['weeks2-4']}</p>
                          </div>
                        )}
                        {(result.pctProjections.timeline.extendedRecoveryPhase ?? result.pctProjections.timeline['weeks4-12']) && (
                          <div className="rounded-lg border p-3">
                            <span className="text-xs font-medium text-muted-foreground">Extended recovery phase</span>
                            <p className="text-sm mt-1">{result.pctProjections.timeline.extendedRecoveryPhase ?? result.pctProjections.timeline['weeks4-12']}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  {result.pctProjections.commonConcepts && result.pctProjections.commonConcepts.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">Common Considerations</h4>
                      <ul className="space-y-1">
                        {result.pctProjections.commonConcepts.map((c, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                            {c}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {result.pctProjections.monitoringNotes && (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription className="text-sm">
                        {result.pctProjections.monitoringNotes}
                      </AlertDescription>
                    </Alert>
                  )}
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

                  {result.educationalSummary.nextSteps && result.educationalSummary.nextSteps.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">Recommended Next Steps</h4>
                      <ul className="space-y-1">
                        {result.educationalSummary.nextSteps.map((step, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm">
                            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                            {step}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
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

            {/* CTA: Order Blood Test / Explore Telehealth */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-6 border-t">
              <Button asChild variant="default" className="bg-cyan-600 hover:bg-cyan-700">
                <Link href="/blood-panel-order" className="inline-flex items-center gap-2">
                  <Beaker className="h-4 w-4" />
                  Order Blood Test
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/telehealth-referral" className="inline-flex items-center gap-2">
                  <Stethoscope className="h-4 w-4" />
                  Explore Telehealth Options
                </Link>
              </Button>
            </div>

            {/* Saved Forecasts - switch to another */}
            {savedForecasts.length > 0 && (
              <div className="pt-8 border-t">
                <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Saved Forecasts
                </h2>
                <p className="text-sm text-muted-foreground mb-3">
                  Click to view another saved forecast.
                </p>
                <div className="flex flex-wrap gap-2">
                  {savedForecasts.map((report) => (
                    <div
                      key={report.id}
                      className={`flex items-center gap-1 rounded-md border px-3 py-1.5 text-sm cursor-pointer transition-colors ${
                        selectedForecastId === report.id
                          ? 'border-primary bg-primary/10'
                          : 'border-input hover:bg-muted/50'
                      }`}
                      onClick={() => handleLoadSaved(report)}
                    >
                      <span>{formatDate(report.created_at)}</span>
                      <button
                        type="button"
                        className="ml-1 p-0.5 rounded hover:bg-destructive/20 hover:text-destructive disabled:opacity-50"
                        onClick={(e) => handleDeleteSaved(report.id, e)}
                        disabled={deletingId === report.id}
                        aria-label="Delete forecast"
                      >
                        {deletingId === report.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Trash2 className="h-3 w-3" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )

  // Dev mode bypasses tier gate; production uses tier gate (Pro required)
  return devModeEnabled ? content : <TierGate>{content}</TierGate>
}