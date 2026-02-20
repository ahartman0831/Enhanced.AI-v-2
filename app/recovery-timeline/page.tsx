'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TierGate } from '@/components/TierGate'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { DoctorPdfButton } from '@/components/DoctorPdfButton'
import { RecoveryConfirmModal, type RecoveryCycleContext } from '@/components/RecoveryConfirmModal'
import { TELEHEALTH_PARTNERS } from '@/lib/affiliates'
import {
  Clock,
  AlertTriangle,
  Loader2,
  CheckCircle,
  Calendar,
  TrendingUp,
  Apple,
  Shield,
  Target,
  History,
  Trash2,
  ExternalLink,
  Beaker,
  Stethoscope,
} from 'lucide-react'

interface RecoveryTimelineResult {
  plainEnglishSummary?: string
  recoveryTimeline: Array<{
    phase: string
    timeframe: string
    plainEnglishExpectations?: string
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
  graphData?: {
    phases?: Array<{ phase: string; startWeek: number; endWeek: number; color?: string }>
    compoundCurves?: Array<{ compound: string; recoverySlope?: string; suppressionWeeks?: number; notes?: string }>
    sideEffectOverlays?: Array<{ symptom: string; typicalDissipationWeek?: number; note?: string }>
    harshRealityNote?: string
  } | null
}

export default function RecoveryTimelinePage() {
  const [confirmModalOpen, setConfirmModalOpen] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [result, setResult] = useState<RecoveryTimelineResult | null>(null)
  const [cycleContext, setCycleContext] = useState<{ compounds: string[]; sideEffects: string[] } | null>(null)
  const [bloodworkMarkers, setBloodworkMarkers] = useState<Record<string, { value: number | string; unit?: string }> | null>(null)
  const [savedAnalyses, setSavedAnalyses] = useState<Array<{ id: string; stack_json: { recoveryAnalysis: RecoveryTimelineResult }; created_at: string }>>([])
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [hasData, setHasData] = useState(false)

  const fetchSavedAnalyses = async () => {
    try {
      const res = await fetch('/api/recovery-timeline/reports')
      if (res.ok) {
        const { reports } = await res.json()
        setSavedAnalyses(reports ?? [])
      }
    } catch {
      // Ignore
    }
  }

  useEffect(() => {
    fetchSavedAnalyses()
  }, [])

  useEffect(() => {
    const win = window as unknown as { __recoveryViewingResults?: boolean }
    win.__recoveryViewingResults = !!result
    return () => { win.__recoveryViewingResults = false }
  }, [result])

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

  const runRecoveryAnalysis = async (body: { cycleContext?: RecoveryCycleContext; useLastKnown?: boolean }) => {
    setIsAnalyzing(true)
    setError(null)

    try {
      const response = await fetch('/api/recovery-timeline', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })

      const data = await response.json()

      if (!response.ok) {
        const msg = data.error || 'Failed to generate recovery timeline'
        const flags = data.flags as string[] | undefined
        throw new Error(flags?.length ? `${msg} Flagged: ${flags.join(', ')}` : msg)
      }

      setResult(data.data)
      if (data.cycleContext) {
        setCycleContext({
          compounds: data.cycleContext.compounds ?? [],
          sideEffects: data.cycleContext.sideEffects ?? [],
        })
      } else {
        setCycleContext(null)
      }
      setBloodworkMarkers(data.bloodworkMarkers ?? null)
      fetchSavedAnalyses()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred while generating recovery timeline')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleSaveAndAnalyze = async (context: RecoveryCycleContext) => {
    await runRecoveryAnalysis({ cycleContext: context })
  }

  const handleSkipAndUseLastKnown = async () => {
    await runRecoveryAnalysis({ useLastKnown: true })
  }

  const resetAnalysis = () => {
    setResult(null)
    setCycleContext(null)
    setBloodworkMarkers(null)
    setError(null)
  }

  const resetRef = useRef(resetAnalysis)
  resetRef.current = resetAnalysis
  useEffect(() => {
    const handler = () => resetRef.current()
    window.addEventListener('recovery-timeline:back-to-form', handler)
    return () => window.removeEventListener('recovery-timeline:back-to-form', handler)
  }, [])

  const handleLoadSaved = (report: { id: string; stack_json: { recoveryAnalysis: RecoveryTimelineResult }; created_at: string }) => {
    const analysis = report.stack_json?.recoveryAnalysis
    if (analysis) {
      setResult(analysis)
      setCycleContext(null)
      setBloodworkMarkers(null)
      setError(null)
    }
  }

  const handleDeleteSaved = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('Delete this saved analysis? This cannot be undone.')) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/recovery-timeline/reports/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setSavedAnalyses((prev) => prev.filter((r) => r.id !== id))
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

            {/* Analyze Button - opens confirmation modal */}
            <div className="flex justify-center">
              <Button
                onClick={() => setConfirmModalOpen(true)}
                disabled={isAnalyzing || !hasData}
                size="lg"
                className="bg-cyan-600 hover:bg-cyan-700"
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

            <RecoveryConfirmModal
              open={confirmModalOpen}
              onOpenChange={setConfirmModalOpen}
              onSaveAndAnalyze={handleSaveAndAnalyze}
              onSkipAndUseLastKnown={handleSkipAndUseLastKnown}
              isAnalyzing={isAnalyzing}
            />

            {savedAnalyses.length > 0 && (
              <div className="mt-8 pt-8 border-t">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Saved Recovery Analyses
                </h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Your recovery timeline analyses are saved automatically. Click to view or delete.
                </p>
                <div className="space-y-3">
                  {savedAnalyses.map((report) => (
                    <Card
                      key={report.id}
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => handleLoadSaved(report)}
                    >
                      <CardHeader className="py-4">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{formatDate(report.created_at)}</span>
                            {report.stack_json?.recoveryAnalysis?.recoveryTimeline?.length > 0 && (
                              <Badge variant="secondary" className="text-xs">
                                {report.stack_json.recoveryAnalysis.recoveryTimeline.length} phases
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              onClick={(e) => handleDeleteSaved(report.id, e)}
                              disabled={deletingId === report.id}
                              aria-label="Delete analysis"
                            >
                              {deletingId === report.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                        {report.stack_json?.recoveryAnalysis?.plainEnglishSummary && (
                          <CardDescription className="mt-2 line-clamp-2 text-left">
                            {report.stack_json.recoveryAnalysis.plainEnglishSummary.slice(0, 150)}...
                          </CardDescription>
                        )}
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
                  <strong>No Data Available:</strong> Recovery timeline analysis requires existing protocol and bloodwork data.
                  Please complete a stack analysis and upload bloodwork results first.
                </AlertDescription>
              </Alert>
            )}
          </div>
        ) : (
          /* Results Display */
          <div className="space-y-8">
            {/* Plain English Summary - at the very top */}
            {result.plainEnglishSummary && (
              <Card className="border-cyan-500/20 bg-cyan-500/5 dark:bg-cyan-950/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Target className="h-5 w-5 text-cyan-500" />
                    In Plain English: What You&apos;re About to Read
                  </CardTitle>
                  <CardDescription>
                    A quick overview before you dive into the details
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm dark:prose-invert max-w-none text-foreground whitespace-pre-line">
                    {result.plainEnglishSummary}
                  </div>
                </CardContent>
              </Card>
            )}

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
                        {phase.plainEnglishExpectations && (
                          <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 dark:bg-cyan-950/20 p-4">
                            <h4 className="font-semibold mb-2 text-cyan-900 dark:text-cyan-100">What to Expect in Plain English</h4>
                            <p className="text-sm text-foreground/90">{phase.plainEnglishExpectations}</p>
                          </div>
                        )}
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

            {/* Severe Cases Disclaimer + Bloodwork & Telehealth CTAs */}
            <Card className="border-cyan-500/30 bg-cyan-500/5 dark:bg-cyan-950/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Stethoscope className="h-5 w-5 text-cyan-500" />
                  Professional Support & Monitoring
                </CardTitle>
                <CardDescription>
                  Severe cases often need pro intervention. Order bloodwork to track markers or connect with telehealth for physician-guided care.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {result.graphData?.harshRealityNote && (
                  <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="text-sm font-medium">
                      {result.graphData.harshRealityNote}
                    </AlertDescription>
                  </Alert>
                )}
                {!result.graphData?.harshRealityNote && (
                  <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="text-sm font-medium">
                      Severe cases often discuss HCG, Clomid, or TRT—pro intervention is key. Consult a physician for personalized care.
                    </AlertDescription>
                  </Alert>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="rounded-xl border-2 border-cyan-500/30 bg-background/80 dark:bg-background/50 p-6 space-y-4">
                    <div className="flex items-center gap-2">
                      <Beaker className="h-6 w-6 text-cyan-500" />
                      <h4 className="font-semibold text-base">Order Bloodwork</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Monitor recovery with lab panels. Track testosterone, lipids, liver enzymes, and more.
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <Button size="lg" className="bg-cyan-600 hover:bg-cyan-700" asChild>
                        <a href={TELEHEALTH_PARTNERS.quest} target="_blank" rel="noopener noreferrer">
                          Quest Diagnostics
                          <ExternalLink className="h-4 w-4 ml-2" />
                        </a>
                      </Button>
                      <Button size="lg" variant="outline" className="border-cyan-500/50 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500/10" asChild>
                        <a href={TELEHEALTH_PARTNERS.letsGetChecked} target="_blank" rel="noopener noreferrer">
                          LetsGetChecked
                          <ExternalLink className="h-4 w-4 ml-2" />
                        </a>
                      </Button>
                    </div>
                  </div>
                  <div className="rounded-xl border-2 border-cyan-500/30 bg-background/80 dark:bg-background/50 p-6 space-y-4">
                    <div className="flex items-center gap-2">
                      <Stethoscope className="h-6 w-6 text-cyan-500" />
                      <h4 className="font-semibold text-base">Telehealth Consult</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Discuss recovery with a healthcare professional. Not medical advice—physician must verify.
                    </p>
                    <Button size="lg" className="bg-cyan-600 hover:bg-cyan-700 w-full md:w-auto" asChild>
                      <a href={TELEHEALTH_PARTNERS.hims} target="_blank" rel="noopener noreferrer">
                        Connect with Hims Telehealth
                        <ExternalLink className="h-4 w-4 ml-2" />
                      </a>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

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
    </TierGate>
  )
}