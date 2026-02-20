'use client'

import { useState, useRef } from 'react'
import { TierGate } from '@/components/TierGate'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { DoctorPdfButton } from '@/components/DoctorPdfButton'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { BloodPanelUpsell } from '@/components/BloodPanelUpsell'
import {
  FileText,
  Upload,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Loader2,
  BarChart3,
  Calendar,
  X,
  ImageIcon,
  Shield,
  ChevronDown,
  ExternalLink,
  Package,
  Stethoscope
} from 'lucide-react'
import Link from 'next/link'
import { TELEHEALTH_PARTNERS, getAffiliateDisclosure } from '@/lib/affiliates'

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
    androgenicEstrogenicBalance?: string
    suppressionPatterns?: string
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
  harmReductionObservations?: string[]
  harmReductionPlainLanguage?: string
  mitigationObservations?: Array<{
    marker: string
    laymanExplanation?: { whatItIs: string; whyMonitor: string }
    commonlyDiscussedMitigations: string
    observationalRisks: string
    actionableSteps: string
    amazonLink?: string
    amazonProductName?: string
  }>
  educationalRecommendations: string[]
  extractedMetadata?: {
    test_date?: string
    lab_source?: string
    location?: string
    patient_notes?: string
    verification_needed?: boolean
    other?: Record<string, unknown>
  }
}

const ACCEPTED_FILE_TYPES = '.pdf,.jpg,.jpeg,.png'
const ACCEPTED_MIME = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default function BloodworkParserPage() {
  const [bloodworkText, setBloodworkText] = useState('')
  const [testDate, setTestDate] = useState('')
  const [source, setSource] = useState('')
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ file: File; id: string }>>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [result, setResult] = useState<BloodworkAnalysisResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const addFiles = (files: FileList | null) => {
    if (!files) return
    const newEntries: Array<{ file: File; id: string }> = []
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      if (ACCEPTED_MIME.includes(file.type)) {
        newEntries.push({ file, id: `${file.name}-${Date.now()}-${i}` })
      }
    }
    setUploadedFiles(prev => [...prev, ...newEntries])
  }

  const removeFile = (id: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== id))
  }

  const hasInput = bloodworkText.trim().length > 0 || uploadedFiles.length > 0

  const handleAnalyze = async () => {
    if (!hasInput) {
      setError('Please enter bloodwork data or upload PDF/image files')
      return
    }

    setIsAnalyzing(true)
    setError(null)

    try {
      let bloodworkData: Record<string, unknown> | undefined
      let imageDataUrls: string[] = []

      if (bloodworkText.trim()) {
        bloodworkData = parseBloodworkText(bloodworkText)
      }

      if (uploadedFiles.length > 0) {
        for (const { file } of uploadedFiles) {
          if (file.type === 'application/pdf') {
            const arrayBuffer = await file.arrayBuffer()
            const bytes = new Uint8Array(arrayBuffer)
            let binary = ''
            const chunk = 8192
            for (let i = 0; i < bytes.length; i += chunk) {
              binary += String.fromCharCode(...bytes.subarray(i, i + chunk))
            }
            const base64 = btoa(binary)
            const res = await fetch('/api/pdf-to-images', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ pdfBase64: base64 })
            })
            const json = await res.json()
            if (!res.ok) throw new Error(json.error || 'Failed to convert PDF')
            imageDataUrls.push(...(json.dataUrls || []))
          } else {
            const dataUrl = await fileToDataUrl(file)
            imageDataUrls.push(dataUrl)
          }
        }
      }

      const response = await fetch('/api/analyze-bloodwork', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bloodworkData,
          testDate: testDate || undefined,
          source: source || undefined,
          imageDataUrls: imageDataUrls.length > 0 ? imageDataUrls : undefined
        })
      })

      const data = await response.json()

      if (!response.ok) {
        const msg = data.error || 'Failed to analyze bloodwork'
        const flags = data.flags as string[] | undefined
        throw new Error(flags?.length ? `${msg} Flagged: ${flags.join(', ')}` : msg)
      }

      setResult(data.data)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred while analyzing bloodwork')
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
    setUploadedFiles([])
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
    <TierGate>
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

        {!result ? (
          /* Input Form */
          <div className="space-y-8">
            {/* File Upload */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Upload Bloodwork Results
                </CardTitle>
                <CardDescription>
                  Upload PDF or image files (JPG, PNG) of your lab results. Multiple files supported.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPTED_FILE_TYPES}
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    addFiles(e.target.files)
                    e.target.value = ''
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full"
                >
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Choose PDF or Images
                </Button>
                {uploadedFiles.length > 0 && (
                  <ul className="space-y-2">
                    {uploadedFiles.map(({ file, id }) => (
                      <li
                        key={id}
                        className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
                      >
                        <span className="truncate flex-1">{file.name}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                          onClick={() => removeFile(id)}
                          aria-label="Remove file"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            {/* Input Instructions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Or Paste Text
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
                  Include marker name, value, reference range, and units.
                </p>
              </CardContent>
            </Card>

            {/* Bloodwork Input */}
            <Card>
              <CardHeader>
                <CardTitle>Bloodwork Data</CardTitle>
                <CardDescription>
                  Paste your blood test results below (optional if you uploaded files)
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
                disabled={isAnalyzing || !hasInput}
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

            {/* Blood Test CTA - below input form */}
            <BloodPanelUpsell />
            <p className="text-center text-sm text-muted-foreground">
              <Link href="/bloodwork-history" className="text-cyan-600 dark:text-cyan-400 hover:underline">
                View your bloodwork history & trends →
              </Link>
            </p>
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

                  {result.extractedMetadata && (result.extractedMetadata.test_date || result.extractedMetadata.lab_source || result.extractedMetadata.location) && (
                    <div className="mb-4 rounded-lg border border-cyan-500/20 bg-cyan-500/5 dark:bg-cyan-950/20 p-3">
                      <h4 className="text-xs font-medium text-cyan-700 dark:text-cyan-300 mb-2">Extracted Report Info</h4>
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        {result.extractedMetadata.test_date && (
                          <span><strong className="text-foreground">Test Date:</strong> {result.extractedMetadata.test_date}</span>
                        )}
                        {result.extractedMetadata.lab_source && (
                          <span><strong className="text-foreground">Lab:</strong> {result.extractedMetadata.lab_source}</span>
                        )}
                        {result.extractedMetadata.location && (
                          <span><strong className="text-foreground">Location:</strong> {result.extractedMetadata.location}</span>
                        )}
                      </div>
                      {result.extractedMetadata.verification_needed && (
                        <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">Some values unclear—user verification recommended.</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-2 italic">Extracted for educational tracking only—not verified medical info.</p>
                    </div>
                  )}

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

            {/* Community Insights on Bloodwork Patterns */}
            {result.harmReductionObservations && result.harmReductionObservations.length > 0 && (
              <details className="group rounded-lg border-2 border-cyan-200 dark:border-cyan-800 bg-cyan-50/50 dark:bg-cyan-950/20 overflow-hidden">
                <summary className="flex items-center gap-3 cursor-pointer p-4 hover:bg-cyan-100/50 dark:hover:bg-cyan-900/20 transition-colors list-none">
                  <Shield className="h-5 w-5 text-cyan-600 flex-shrink-0" />
                  <span className="font-semibold text-cyan-900 dark:text-cyan-100">
                    Community Insights on Bloodwork Patterns
                  </span>
                  <ChevronDown className="h-4 w-4 text-cyan-600 ml-auto group-open:rotate-180 transition-transform" />
                </summary>
                <div className="px-4 pb-4 pt-0 space-y-2">
                  {result.harmReductionObservations.map((obs, idx) => (
                    <p key={idx} className="text-sm text-muted-foreground pl-8">
                      • {obs}
                    </p>
                  ))}
                  {result.harmReductionPlainLanguage && (
                    <div className="mt-4 pl-8 p-3 rounded-lg bg-cyan-100/50 dark:bg-cyan-900/30 border border-cyan-200 dark:border-cyan-800">
                      <p className="text-xs font-medium text-cyan-900 dark:text-cyan-100 mb-1">In plain terms</p>
                      <p className="text-sm text-cyan-800 dark:text-cyan-200">
                        {result.harmReductionPlainLanguage}
                      </p>
                    </div>
                  )}
                  <div className="mt-4 pl-8 flex flex-wrap gap-2 items-center">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-cyan-700 dark:text-cyan-300 border-cyan-300 dark:border-cyan-700 hover:bg-cyan-100 dark:hover:bg-cyan-900/40"
                      asChild
                    >
                      <a href={TELEHEALTH_PARTNERS.quest} target="_blank" rel="noopener noreferrer">
                        Quest Diagnostics <ExternalLink className="h-3 w-3 ml-1 inline" />
                      </a>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-cyan-700 dark:text-cyan-300 border-cyan-300 dark:border-cyan-700 hover:bg-cyan-100 dark:hover:bg-cyan-900/40"
                      asChild
                    >
                      <a href={TELEHEALTH_PARTNERS.letsGetChecked} target="_blank" rel="noopener noreferrer">
                        LetsGetChecked <ExternalLink className="h-3 w-3 ml-1 inline" />
                      </a>
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground pl-8 pt-1">
                    {getAffiliateDisclosure()}
                  </p>
                  <p className="text-xs text-muted-foreground pl-8 pt-2 italic">
                    These are general educational observations from community patterns and literature. Individual responses vary significantly. Always consult a qualified healthcare professional.
                  </p>
                </div>
              </details>
            )}

            {/* Mitigation Observations (Flagged Markers) */}
            {result.mitigationObservations && result.mitigationObservations.length > 0 && (
              <div className="space-y-4">
                <div className="rounded-lg border-2 border-amber-200 dark:border-amber-800 bg-amber-50/30 dark:bg-amber-950/10 p-4">
                  <h2 className="text-xl font-bold flex items-center gap-2 mb-2">
                    <Package className="h-5 w-5" />
                    Flagged Markers: Educational Insights
                  </h2>
                  <p className="text-sm text-muted-foreground mb-4">
                    <strong>Educational only — not medical advice.</strong> These are patterns often noted in communities and literature. Individual responses vary significantly. Always consult a qualified healthcare professional.
                  </p>
                  <Accordion type="multiple" className="w-full">
                    {result.mitigationObservations.map((mit, idx) => (
                      <AccordionItem key={idx} value={`mit-${idx}`} className="border rounded-lg mb-3 last:mb-0 bg-background/50">
                        <AccordionTrigger className="px-4 py-3 hover:no-underline [&[data-state=open]]:rounded-t-lg">
                          <span className="font-semibold text-left">{mit.marker}</span>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pb-4 space-y-4">
                          {mit.laymanExplanation && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 rounded-lg bg-muted/50">
                              <div>
                                <p className="text-xs font-medium text-muted-foreground mb-0.5">What it is</p>
                                <p className="text-sm">{mit.laymanExplanation.whatItIs}</p>
                              </div>
                              <div>
                                <p className="text-xs font-medium text-muted-foreground mb-0.5">Why monitor</p>
                                <p className="text-sm">{mit.laymanExplanation.whyMonitor}</p>
                              </div>
                            </div>
                          )}
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-0.5">Commonly discussed supports</p>
                            <p className="text-sm">{mit.commonlyDiscussedMitigations}</p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-0.5">Observational patterns</p>
                            <p className="text-sm text-amber-800 dark:text-amber-200">{mit.observationalRisks}</p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-0.5">Actionable steps</p>
                            <p className="text-sm">{mit.actionableSteps}</p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {mit.amazonLink && mit.amazonProductName && (
                              <Button variant="outline" size="sm" asChild>
                                <a href={mit.amazonLink} target="_blank" rel="noopener noreferrer">
                                  Explore {mit.amazonProductName} <ExternalLink className="h-3 w-3 ml-1 inline" />
                                </a>
                              </Button>
                            )}
                            <Button variant="outline" size="sm" asChild>
                              <a href={TELEHEALTH_PARTNERS.quest} target="_blank" rel="noopener noreferrer">
                                Quest Diagnostics <ExternalLink className="h-3 w-3 ml-1 inline" />
                              </a>
                            </Button>
                            <Button variant="outline" size="sm" asChild>
                              <a href={TELEHEALTH_PARTNERS.letsGetChecked} target="_blank" rel="noopener noreferrer">
                                LetsGetChecked <ExternalLink className="h-3 w-3 ml-1 inline" />
                              </a>
                            </Button>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                  <p className="text-xs text-muted-foreground italic mt-4">
                    {getAffiliateDisclosure()}
                  </p>
                </div>
              </div>
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
                    {result.patternRecognition.androgenicEstrogenicBalance && (
                      <div>
                        <h4 className="font-semibold mb-2">Androgenic/Estrogenic Balance</h4>
                        <p className="text-sm text-muted-foreground">
                          {result.patternRecognition.androgenicEstrogenicBalance}
                        </p>
                      </div>
                    )}
                    {result.patternRecognition.suppressionPatterns && (
                      <div>
                        <h4 className="font-semibold mb-2">Suppression Patterns (Observational)</h4>
                        <p className="text-sm text-muted-foreground">
                          {result.patternRecognition.suppressionPatterns}
                        </p>
                      </div>
                    )}
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

            {/* Telehealth Consultation CTA */}
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="p-3 rounded-lg bg-primary/10">
                    <Stethoscope className="h-8 w-8 text-primary" />
                  </div>
                  <div className="flex-1 text-center sm:text-left">
                    <h3 className="font-semibold text-lg">Discuss Your Results with a Physician</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Schedule a telehealth consultation to review your bloodwork with a licensed physician.
                    </p>
                  </div>
                  <Button asChild>
                    <Link href={TELEHEALTH_PARTNERS.hims} target="_blank" rel="noopener noreferrer">
                      Explore Telehealth Options
                      <ExternalLink className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-4 text-center sm:text-left">
                  {getAffiliateDisclosure()}
                </p>
              </CardContent>
            </Card>

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

            {/* Blood Test CTA - below results */}
            <BloodPanelUpsell />
            <p className="text-center text-sm text-muted-foreground">
              <Link href="/bloodwork-history" className="text-cyan-600 dark:text-cyan-400 hover:underline">
                View your bloodwork history & trends →
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
    </TierGate>
  )
}