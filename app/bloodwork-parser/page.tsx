'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { DoctorPdfButton } from '@/components/DoctorPdfButton'
import { BloodPanelUpsell } from '@/components/BloodPanelUpsell'
import {
  FileText,
  Upload,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Loader2,
  BarChart3,
  Calendar
} from 'lucide-react'

interface BloodworkAnalysisResult {
  analysisSummary: {
    testDate: string
    totalMarkers: number
    markersAnalyzed: number
    keyObservations: string[]
  }
  markerAnalysis: Array<{
    marker: string
    value: string
    referenceRange: string
    status: 'within_range' | 'above_range' | 'below_range'
    educationalNotes: string
    commonInfluences: string[]
    monitoringImportance: string
  }>
  patternRecognition: {
    hormonalProfile: string
    metabolicMarkers: string
    inflammationMarkers: string
    liverKidneyFunction: string
  }
  flags: Array<{
    severity: 'low' | 'medium' | 'high'
    category: string
    description: string
    educationalContext: string
    recommendations: string[]
  }>
  projections: {
    shortTerm: string
    mediumTerm: string
    longTerm: string
    influencingFactors: string[]
  }
  educationalRecommendations: string[]
}

export default function BloodworkParserPage() {
  const [bloodworkText, setBloodworkText] = useState('')
  const [testDate, setTestDate] = useState('')
  const [source, setSource] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [result, setResult] = useState<BloodworkAnalysisResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleAnalyze = async () => {
    if (!bloodworkText.trim()) {
      setError('Please enter your bloodwork data')
      return
    }

    setIsAnalyzing(true)
    setError(null)

    try {
      // Parse the bloodwork text into structured data
      const bloodworkData = parseBloodworkText(bloodworkText)

      const response = await fetch('/api/analyze-bloodwork', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bloodworkData,
          testDate: testDate || undefined,
          source: source || undefined
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze bloodwork')
      }

      setResult(data.data)

    } catch (err: any) {
      setError(err.message || 'An error occurred while analyzing bloodwork')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const parseBloodworkText = (text: string) => {
    // Simple parsing - in a real app, this would be more sophisticated
    const lines = text.split('\n')
    const markers: Record<string, any> = {}

    lines.forEach(line => {
      // Look for patterns like "Testosterone: 500 ng/dL (300-1000)"
      const match = line.match(/^(.+?):\s*([^\s(]+).*?\(([^)]+)\)/)
      if (match) {
        const [, marker, value, range] = match
        markers[marker.trim()] = {
          value: value.trim(),
          range: range.trim(),
          unit: extractUnit(line)
        }
      }
    })

    return markers
  }

  const extractUnit = (line: string): string => {
    // Extract units from the line
    const unitMatch = line.match(/([A-Za-z]+\/[A-Za-z]+|[A-Za-z]+%|[A-Za-z]+\/dL|ng\/mL|pg\/mL|μg\/dL|mg\/dL|IU\/L|mmol\/L|μmol\/L)/)
    return unitMatch ? unitMatch[1] : ''
  }

  const resetAnalysis = () => {
    setResult(null)
    setError(null)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'within_range': return 'bg-green-100 text-green-800'
      case 'above_range': return 'bg-yellow-100 text-yellow-800'
      case 'below_range': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
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
          <h1 className="text-3xl font-bold text-foreground mb-2">Bloodwork Parser</h1>
          <p className="text-muted-foreground">
            Upload and analyze your blood test results with AI-powered educational insights.
          </p>
        </div>

        {/* Disclaimer Banner */}
        <Alert className="mb-8 border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            <strong>Educational tool only. Not medical advice. Consult your physician.</strong> Bloodwork analysis is for educational purposes only and should not be used as a substitute for professional medical advice, diagnosis, or treatment.
          </AlertDescription>
        </Alert>

        {/* Elite Blood Panel Upsell */}
        <div className="mb-8">
          <BloodPanelUpsell />
        </div>

        {!result ? (
          /* Input Form */
          <div className="space-y-8">
            {/* Input Instructions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  How to Input Your Bloodwork
                </CardTitle>
                <CardDescription>
                  Enter your blood test results in a simple format for analysis
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Example Format:</h4>
                  <pre className="text-sm text-muted-foreground">
{`Total Testosterone: 450 (300-1000) ng/dL
Free Testosterone: 15 (50-210) pg/mL
SHBG: 30 (10-50) nmol/L
LH: 4.5 (1.5-9.3) mIU/mL
FSH: 3.2 (1.4-18.1) mIU/mL`}
                  </pre>
                </div>
                <p className="text-sm text-muted-foreground">
                  Include marker name, value, reference range, and units. The parser will automatically extract this information.
                </p>
              </CardContent>
            </Card>

            {/* Bloodwork Input */}
            <Card>
              <CardHeader>
                <CardTitle>Bloodwork Data</CardTitle>
                <CardDescription>
                  Paste your blood test results below
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="test-date">Test Date (Optional)</Label>
                    <Input
                      id="test-date"
                      type="date"
                      value={testDate}
                      onChange={(e) => setTestDate(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="source">Lab/Source (Optional)</Label>
                    <Input
                      id="source"
                      placeholder="e.g., Quest Diagnostics, LabCorp"
                      value={source}
                      onChange={(e) => setSource(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bloodwork">Bloodwork Results</Label>
                  <Textarea
                    id="bloodwork"
                    placeholder="Paste your blood test results here..."
                    value={bloodworkText}
                    onChange={(e) => setBloodworkText(e.target.value)}
                    rows={12}
                    className="font-mono text-sm"
                  />
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
                disabled={isAnalyzing || !bloodworkText.trim()}
                size="lg"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Analyzing Bloodwork...
                  </>
                ) : (
                  'Analyze Bloodwork'
                )}
              </Button>
            </div>
          </div>
        ) : (
          /* Results Display */
          <div className="space-y-8">
            {/* Summary */}
            {result.analysisSummary && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Analysis Summary
                  </CardTitle>
                  <CardDescription>
                    Overview of your bloodwork analysis
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">
                        {result.analysisSummary.totalMarkers}
                      </div>
                      <div className="text-sm text-muted-foreground">Total Markers</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">
                        {result.analysisSummary.markersAnalyzed}
                      </div>
                      <div className="text-sm text-muted-foreground">Analyzed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">
                        {result.flags?.length || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">Flags</div>
                    </div>
                    <div className="text-center">
                      <Calendar className="h-8 w-8 mx-auto mb-1 text-muted-foreground" />
                      <div className="text-sm text-muted-foreground">
                        {result.analysisSummary.testDate || 'Recent'}
                      </div>
                    </div>
                  </div>

                  {result.analysisSummary.keyObservations && result.analysisSummary.keyObservations.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">Key Educational Observations</h4>
                      <ul className="space-y-1">
                        {result.analysisSummary.keyObservations.map((obs, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm">
                            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                            {obs}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Pattern Recognition */}
            {result.patternRecognition && (
              <Card>
                <CardHeader>
                  <CardTitle>Educational Pattern Recognition</CardTitle>
                  <CardDescription>
                    Overview of marker patterns and relationships
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-2">Hormonal Profile</h4>
                      <p className="text-sm text-muted-foreground">
                        {result.patternRecognition.hormonalProfile}
                      </p>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Metabolic Markers</h4>
                      <p className="text-sm text-muted-foreground">
                        {result.patternRecognition.metabolicMarkers}
                      </p>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Inflammation Markers</h4>
                      <p className="text-sm text-muted-foreground">
                        {result.patternRecognition.inflammationMarkers}
                      </p>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Liver/Kidney Function</h4>
                      <p className="text-sm text-muted-foreground">
                        {result.patternRecognition.liverKidneyFunction}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Flags */}
            {result.flags && result.flags.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Educational Flags</CardTitle>
                  <CardDescription>
                    Areas that may benefit from professional medical attention
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {result.flags.map((flag, index) => (
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

            {/* Projections */}
            {result.projections && (
              <Card>
                <CardHeader>
                  <CardTitle>Educational Projections</CardTitle>
                  <CardDescription>
                    General educational insights about potential marker trends
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                      <h4 className="font-semibold mb-2">4-Week Outlook</h4>
                      <p className="text-sm text-muted-foreground">
                        {result.projections.shortTerm}
                      </p>
                    </div>

                    <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                      <h4 className="font-semibold mb-2">8-12 Week Outlook</h4>
                      <p className="text-sm text-muted-foreground">
                        {result.projections.mediumTerm}
                      </p>
                    </div>

                    <div className="p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                      <h4 className="font-semibold mb-2">Long-term Considerations</h4>
                      <p className="text-sm text-muted-foreground">
                        {result.projections.longTerm}
                      </p>
                    </div>
                  </div>

                  {result.projections.influencingFactors && result.projections.influencingFactors.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">Influencing Factors</h4>
                      <div className="flex flex-wrap gap-2">
                        {result.projections.influencingFactors.map((factor, index) => (
                          <Badge key={index} variant="outline">
                            {factor}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Educational Recommendations */}
            {result.educationalRecommendations && result.educationalRecommendations.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Educational Recommendations</CardTitle>
                  <CardDescription>
                    General educational suggestions for monitoring and follow-up
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {result.educationalRecommendations.map((rec, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <TrendingUp className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                        {rec}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* PDF Button */}
            <div className="flex justify-center">
              <DoctorPdfButton
                patientData={{
                  name: 'Bloodwork Analysis Report',
                  id: 'bloodwork-analysis',
                  analysis: result
                }}
                analysisType="bloodwork-analysis"
              />
            </div>

            {/* Analyze New Bloodwork Button */}
            <div className="flex justify-center">
              <Button onClick={resetAnalysis} variant="outline">
                Analyze New Bloodwork
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}