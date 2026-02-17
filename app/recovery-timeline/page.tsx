'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { DoctorPdfButton } from '@/components/DoctorPdfButton'
import {
  Clock,
  AlertTriangle,
  Loader2,
  CheckCircle,
  Calendar,
  TrendingUp
} from 'lucide-react'

interface RecoveryTimelineResult {
  recoveryTimeline: Array<{
    phase: string
    timeframe: string
    keyConsiderations: string[]
    typicalMarkers: string[]
    educationalNotes: string
  }>
  pctConsiderations: {
    commonlyDiscussedApproaches: Array<{
      approachName: string
      typicalDuration: string
      rationale: string
      monitoring: string[]
      considerations: string[]
    }>
    timingConsiderations: string
    individualFactors: string[]
  }
  monitoringProtocol: string[]
  educationalNotes: string
}

export default function RecoveryTimelinePage() {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [result, setResult] = useState<RecoveryTimelineResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [hasData, setHasData] = useState(false)

  // Check if user has protocols or bloodwork data
  useEffect(() => {
    const checkUserData = async () => {
      try {
        // This would check if user has protocols/bloodwork
        // For now, we'll assume they do
        setHasData(true)
      } catch (err) {
        console.error('Error checking user data:', err)
      }
    }

    checkUserData()
  }, [])

  const handleAnalyze = async () => {
    setIsAnalyzing(true)
    setError(null)

    try {
      const response = await fetch('/api/recovery-timeline', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate recovery timeline')
      }

      setResult(data.data)

    } catch (err: any) {
      setError(err.message || 'An error occurred while generating recovery timeline')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const resetAnalysis = () => {
    setResult(null)
    setError(null)
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Recovery Timeline</h1>
          <p className="text-muted-foreground">
            Educational analysis of recovery timelines and commonly discussed approaches.
          </p>
        </div>

        {/* Disclaimer Banner */}
        <Alert className="mb-8 border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            <strong>Educational tool only. Not medical advice. Consult your physician.</strong> Recovery timeline analysis is for educational purposes only and should not be used as a substitute for professional medical advice, diagnosis, or treatment.
          </AlertDescription>
        </Alert>

        {!result ? (
          /* Analysis Form */
          <div className="space-y-8">
            {/* Data Requirements */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Recovery Timeline Analysis
                </CardTitle>
                <CardDescription>
                  This analysis uses your latest protocol data and bloodwork results to provide educational insights about commonly discussed recovery timelines.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <h4 className="font-semibold">Data Sources Used:</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>• Latest supplementation protocols</li>
                      <li>• Recent bloodwork results</li>
                      <li>• Protocol duration and intensity</li>
                      <li>• Individual health markers</li>
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-semibold">Analysis Covers:</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>• Recovery phase timelines</li>
                      <li>• Educational PCT concepts</li>
                      <li>• Monitoring recommendations</li>
                      <li>• Individual factor considerations</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Error Display */}
            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Analyze Button */}
            <div className="flex justify-center">
              <Button
                onClick={handleAnalyze}
                disabled={isAnalyzing || !hasData}
                size="lg"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating Recovery Timeline...
                  </>
                ) : (
                  'Generate Recovery Timeline'
                )}
              </Button>
            </div>

            {!hasData && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>No Data Available:</strong> Recovery timeline analysis requires existing protocol and bloodwork data.
                  Please complete a stack analysis and upload bloodwork results first.
                </AlertDescription>
              </Alert>
            )}
          </div>
        ) : (
          /* Results Display */
          <div className="space-y-8">
            {/* Recovery Timeline */}
            {result.recoveryTimeline && result.recoveryTimeline.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-6">Recovery Timeline Analysis</h2>
                <div className="space-y-6">
                  {result.recoveryTimeline.map((phase, index) => (
                    <Card key={index}>
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            <Clock className="h-5 w-5" />
                            {phase.phase}
                          </span>
                          <Badge variant="outline">{phase.timeframe}</Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {phase.keyConsiderations && phase.keyConsiderations.length > 0 && (
                          <div>
                            <h4 className="font-semibold mb-2">Key Educational Considerations</h4>
                            <ul className="space-y-1">
                              {phase.keyConsiderations.map((consideration, idx) => (
                                <li key={idx} className="flex items-start gap-2 text-sm">
                                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                                  {consideration}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {phase.typicalMarkers && phase.typicalMarkers.length > 0 && (
                          <div>
                            <h4 className="font-semibold mb-2">Markers Commonly Monitored</h4>
                            <div className="flex flex-wrap gap-1">
                              {phase.typicalMarkers.map((marker, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                  {marker}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {phase.educationalNotes && (
                          <Alert>
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription className="text-sm">
                              {phase.educationalNotes}
                            </AlertDescription>
                          </Alert>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* PCT Considerations */}
            {result.pctConsiderations && (
              <div>
                <h2 className="text-2xl font-bold mb-6">PCT Educational Concepts</h2>

                {result.pctConsiderations.timingConsiderations && (
                  <Card className="mb-6">
                    <CardHeader>
                      <CardTitle>Timing Considerations</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">{result.pctConsiderations.timingConsiderations}</p>
                    </CardContent>
                  </Card>

                )}

                {result.pctConsiderations.commonlyDiscussedApproaches && result.pctConsiderations.commonlyDiscussedApproaches.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Commonly Discussed PCT Approaches</h3>
                    {result.pctConsiderations.commonlyDiscussedApproaches.map((approach, index) => (
                      <Card key={index}>
                        <CardHeader>
                          <CardTitle className="flex items-center justify-between">
                            {approach.approachName}
                            <Badge variant="outline">{approach.typicalDuration}</Badge>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div>
                            <h4 className="font-semibold mb-2">Educational Rationale</h4>
                            <p className="text-sm text-muted-foreground">{approach.rationale}</p>
                          </div>

                          {approach.monitoring && approach.monitoring.length > 0 && (
                            <div>
                              <h4 className="font-semibold mb-2">Monitoring Recommendations</h4>
                              <ul className="space-y-1">
                                {approach.monitoring.map((item, idx) => (
                                  <li key={idx} className="flex items-start gap-2 text-sm">
                                    <CheckCircle className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                                    {item}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {approach.considerations && approach.considerations.length > 0 && (
                            <div>
                              <h4 className="font-semibold mb-2">Key Educational Considerations</h4>
                              <ul className="space-y-1">
                                {approach.considerations.map((item, idx) => (
                                  <li key={idx} className="flex items-start gap-2 text-sm">
                                    <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                                    {item}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {result.pctConsiderations.individualFactors && result.pctConsiderations.individualFactors.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Individual Factors to Consider</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {result.pctConsiderations.individualFactors.map((factor, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm">
                            <TrendingUp className="h-4 w-4 text-purple-500 mt-0.5 flex-shrink-0" />
                            {factor}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Monitoring Protocol */}
            {result.monitoringProtocol && result.monitoringProtocol.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Educational Monitoring Protocol</CardTitle>
                  <CardDescription>
                    General recommendations for monitoring during recovery phases
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {result.monitoringProtocol.map((protocol, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        {protocol}
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

            {/* PDF Button */}
            <div className="flex justify-center">
              <DoctorPdfButton
                patientData={{
                  name: 'Recovery Timeline Analysis Report',
                  id: 'recovery-timeline',
                  analysis: result
                }}
                analysisType="recovery-timeline"
              />
            </div>

            {/* Generate New Analysis Button */}
            <div className="flex justify-center">
              <Button onClick={resetAnalysis} variant="outline">
                Generate New Recovery Analysis
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}