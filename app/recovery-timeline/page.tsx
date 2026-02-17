'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { DoctorPdfButton } from '@/components/DoctorPdfButton'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart, ComposedChart } from 'recharts'
import {
  Clock,
  AlertTriangle,
  Loader2,
  CheckCircle,
  Calendar,
  TrendingUp,
  Apple,
  Activity,
  Shield,
  Target
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
  nutritionImpact: {
    proteinConsiderations: string
    calorieManagement: string
    micronutrientFocus: string
    timingStrategies: string
    supplementSynergy: string
  }
  sideEffectFlags: Array<{
    severity: 'low' | 'medium' | 'high'
    category: string
    description: string
    educationalContext: string
    recommendations: string[]
  }>
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

  // Generate timeline data for chart visualization
  const generateTimelineData = (timeline: RecoveryTimelineResult['recoveryTimeline']) => {
    if (!timeline) return []

    const data = []
    let weekCounter = 0

    timeline.forEach((phase, index) => {
      // Parse timeframe to get approximate weeks
      const timeMatch = phase.timeframe.match(/(\d+)-?(\d+)?\s*(week|month)/i)
      let weeks = 4 // default

      if (timeMatch) {
        const num1 = parseInt(timeMatch[1])
        const num2 = timeMatch[2] ? parseInt(timeMatch[2]) : num1
        const unit = timeMatch[3].toLowerCase()

        if (unit.includes('month')) {
          weeks = Math.round(((num1 + num2) / 2) * 4.3) // rough month to weeks conversion
        } else {
          weeks = Math.round((num1 + num2) / 2)
        }
      }

      // Add data points for this phase
      for (let i = 0; i < weeks; i++) {
        const recoveryProgress = Math.min(100, ((weekCounter + i) / 16) * 100) // Assume 16 weeks total recovery
        const hormoneRecovery = phase.phase.toLowerCase().includes('acute') ? 95 :
                               phase.phase.toLowerCase().includes('extended') ? 85 : 75

        data.push({
          week: weekCounter + i,
          phase: phase.phase,
          recoveryProgress: Math.round(recoveryProgress),
          hormoneRecovery: Math.round(hormoneRecovery - (i * 2)), // Gradual improvement
          testosterone: phase.phase.toLowerCase().includes('acute') ? 85 :
                       phase.phase.toLowerCase().includes('extended') ? 75 : 65,
          cortisol: phase.phase.toLowerCase().includes('acute') ? 65 :
                   phase.phase.toLowerCase().includes('extended') ? 55 : 45
        })
      }

      weekCounter += weeks
    })

    return data
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
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

            {/* Recovery Timeline Graph */}
            {result.recoveryTimeline && result.recoveryTimeline.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Recovery Progress Timeline
                  </CardTitle>
                  <CardDescription>
                    Educational visualization of typical recovery progression (individual results may vary significantly)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={generateTimelineData(result.recoveryTimeline)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="week"
                          label={{ value: 'Weeks Post-Protocol', position: 'insideBottom', offset: -10 }}
                        />
                        <YAxis
                          label={{ value: 'Recovery %', angle: -90, position: 'insideLeft' }}
                        />
                        <Tooltip
                          formatter={(value: number, name: string) => [
                            `${value}%`,
                            name === 'recoveryProgress' ? 'Overall Recovery' :
                            name === 'hormoneRecovery' ? 'Hormone Recovery' :
                            name === 'testosterone' ? 'Testosterone' :
                            name === 'cortisol' ? 'Cortisol' : name
                          ]}
                          labelFormatter={(week) => `Week ${week}`}
                        />
                        <Area
                          type="monotone"
                          dataKey="recoveryProgress"
                          stackId="1"
                          stroke="#3b82f6"
                          fill="#3b82f6"
                          fillOpacity={0.3}
                          name="Overall Recovery"
                        />
                        <Area
                          type="monotone"
                          dataKey="hormoneRecovery"
                          stackId="2"
                          stroke="#10b981"
                          fill="#10b981"
                          fillOpacity={0.3}
                          name="Hormone Recovery"
                        />
                        <Line
                          type="monotone"
                          dataKey="testosterone"
                          stroke="#f59e0b"
                          strokeWidth={2}
                          dot={{ fill: '#f59e0b', strokeWidth: 2, r: 4 }}
                          name="Testosterone"
                        />
                        <Line
                          type="monotone"
                          dataKey="cortisol"
                          stroke="#ef4444"
                          strokeWidth={2}
                          dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
                          name="Cortisol"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-blue-500 rounded"></div>
                      <span>Overall Recovery Progress</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-green-500 rounded"></div>
                      <span>Hormone Recovery Trend</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
                      <span>Testosterone Levels</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                      <span>Cortisol Levels</span>
                    </div>
                  </div>

                  <Alert className="mt-4">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      <strong>Educational Visualization Only:</strong> This timeline represents generalized recovery patterns commonly discussed in health optimization communities.
                      Individual recovery timelines vary dramatically based on protocol duration, intensity, genetics, and numerous other factors.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            )}

            {/* Nutrition Impact Snapshot */}
            {result.nutritionImpact && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Apple className="h-5 w-5" />
                    Nutrition Impact During Recovery
                  </CardTitle>
                  <CardDescription>
                    Educational nutritional considerations commonly discussed during recovery phases
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        Protein Considerations
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {result.nutritionImpact.proteinConsiderations}
                      </p>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Calorie Management</h4>
                      <p className="text-sm text-muted-foreground">
                        {result.nutritionImpact.calorieManagement}
                      </p>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Micronutrient Focus</h4>
                      <p className="text-sm text-muted-foreground">
                        {result.nutritionImpact.micronutrientFocus}
                      </p>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Timing Strategies</h4>
                      <p className="text-sm text-muted-foreground">
                        {result.nutritionImpact.timingStrategies}
                      </p>
                    </div>
                  </div>

                  {result.nutritionImpact.supplementSynergy && (
                    <div className="mt-4">
                      <h4 className="font-semibold mb-2">Supplement Synergy Considerations</h4>
                      <p className="text-sm text-muted-foreground">
                        {result.nutritionImpact.supplementSynergy}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Side Effect Flags */}
            {result.sideEffectFlags && result.sideEffectFlags.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Potential Side Effect Considerations
                  </CardTitle>
                  <CardDescription>
                    Educational flags for symptoms commonly monitored during recovery
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {result.sideEffectFlags.map((flag, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold">{flag.description}</h4>
                        <Badge className={getSeverityColor(flag.severity)}>
                          {flag.severity} priority
                        </Badge>
                      </div>

                      <p className="text-sm text-muted-foreground mb-3">
                        {flag.educationalContext}
                      </p>

                      {flag.recommendations && flag.recommendations.length > 0 && (
                        <div>
                          <h5 className="text-sm font-medium mb-1">Educational Recommendations:</h5>
                          <ul className="text-sm space-y-1">
                            {flag.recommendations.map((rec, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                                {rec}
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