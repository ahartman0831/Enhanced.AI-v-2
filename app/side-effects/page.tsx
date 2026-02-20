'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { CompoundNutritionCard } from '@/components/CompoundNutritionCard'
import { DoctorPdfButton } from '@/components/DoctorPdfButton'
import { SideEffectsCompoundInput } from '@/components/SideEffectsCompoundInput'
import { PersonalizedSuppStack } from '@/components/PersonalizedSuppStack'
import { CommonSupportsCard } from '@/components/CommonSupportsCard'
import { useSubscriptionTier } from '@/hooks/useSubscriptionTier'
import { TierGate } from '@/components/TierGate'
import {
  AlertTriangle,
  Plus,
  X,
  Loader2,
  CheckCircle,
  Activity,
  Pill,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  History,
  Shield,
  Trash2,
  ExternalLink,
  BookOpen,
  Calendar
} from 'lucide-react'
import { useUnsavedAnalysis } from '@/contexts/UnsavedAnalysisContext'
import { TELEHEALTH_PARTNERS, getAffiliateDisclosure } from '@/lib/affiliates'

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
  harmReductionObservations?: string[]
  harmReductionPlainLanguage?: string
  commonlyDiscussedSupports?: Array<{
    name: string
    common_purpose: string
    affected_system: string
    amazon_affiliate_link?: string
    partnership_note?: string
  }>
}

interface SideEffectLog {
  id: string
  compounds: string[]
  dosages: string | null
  side_effects: string[]
  analysis_result: SideEffectAnalysisResult | null
  created_at: string
}

const DOSAGE_UNITS = ['mg', 'mcg', 'iu', 'g', 'ml', 'units', 'other'] as const
const DOSAGE_FREQUENCIES = [
  { value: 'daily', label: 'Daily' },
  { value: 'twice_daily', label: 'Twice daily' },
  { value: 'eod', label: 'EOD (every other day)' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'twice_weekly', label: 'Twice weekly' },
  { value: 'every_3_days', label: 'Every 3 days' },
  { value: 'other', label: 'Other' },
] as const

const DOSAGE_ROUTES = [
  { value: 'im', label: 'Intramuscular (IM)' },
  { value: 'subq', label: 'Subcutaneous (Sub-Q)' },
  { value: 'oral', label: 'Oral' },
  { value: 'transdermal', label: 'Transdermal' },
  { value: 'nasal', label: 'Nasal' },
  { value: 'other', label: 'Other' },
] as const

const DURATION_UNITS = [
  { value: 'days', label: 'Days' },
  { value: 'weeks', label: 'Weeks' },
  { value: 'months', label: 'Months' },
  { value: 'years', label: 'Years' },
] as const

const COMMON_SIDE_EFFECTS = [
  'Hair Loss',
  'Gynecomastia (Gyno)',
  'Nipple Pain / Sensitivity / Itching',
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
  'Testicle Pain',
  'Erectile Dysfunction',
  'Libido Changes',
  'Increased Aggression',
  'Water Retention',
  'Liver Strain',
  'Cholesterol Changes',
  'Sleep Apnea',
  'Injection Site Pain (PIP)',
  'Anxiety',
  'Depression',
  'Other'
]

export default function SideEffectsPage() {
  const { isElite } = useSubscriptionTier()
  const unsaved = useUnsavedAnalysis()
  const [selectedCompounds, setSelectedCompounds] = useState<string[]>([])
  const [selectedSideEffects, setSelectedSideEffects] = useState<string[]>([])
  const [customSideEffect, setCustomSideEffect] = useState('')
  const [compoundDosages, setCompoundDosages] = useState<Record<string, { amount: string; unit: string; frequency: string; route: string }>>({})
  const [dosageNotes, setDosageNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [result, setResult] = useState<SideEffectAnalysisResult | null>(null)
  const [analysisId, setAnalysisId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [previousAnalyses, setPreviousAnalyses] = useState<SideEffectLog[]>([])
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchPreviousAnalyses = useCallback(async () => {
    try {
      const res = await fetch('/api/side-effects')
      if (res.ok) {
        const { data } = await res.json()
        setPreviousAnalyses(data ?? [])
      }
    } catch {
      // Ignore fetch errors
    }
  }, [])

  useEffect(() => {
    fetchPreviousAnalyses()
  }, [fetchPreviousAnalyses])

  // Register unsaved state and navigate-away handler when viewing analysis results
  useEffect(() => {
    if (result) {
      unsaved?.setHasUnsavedSideEffectAnalysis(true)
      unsaved?.registerNavigateAwayHandler(() => setSaveDialogOpen(true))
    }
    return () => {
      unsaved?.unregisterNavigateAwayHandler()
    }
  }, [result, unsaved])

  // Prompt on tab close / refresh
  useEffect(() => {
    if (!result) return
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [result])

  const addCompound = (name: string) => {
    if (name && !selectedCompounds.includes(name)) {
      setSelectedCompounds([...selectedCompounds, name])
      setCompoundDosages((prev) => ({ ...prev, [name]: { amount: '', unit: 'mg', frequency: 'weekly', route: 'im', durationValue: '', durationUnit: 'weeks' } }))
    }
  }

  const removeCompound = (name: string) => {
    setSelectedCompounds(selectedCompounds.filter((n) => n !== name))
    setCompoundDosages((prev) => {
      const next = { ...prev }
      delete next[name]
      return next
    })
  }

  const updateCompoundDosage = (name: string, field: 'amount' | 'unit' | 'frequency' | 'route', value: string) => {
    setCompoundDosages((prev) => ({
      ...prev,
      [name]: { ...prev[name], [field]: value },
    }))
  }

  const buildDosagesString = (): string => {
    const parts: string[] = []
    selectedCompounds.forEach((name) => {
      const d = compoundDosages[name]
      if (!d) return
      const amount = d.amount.trim()
      const unit = d.unit && d.unit !== 'other' ? d.unit : ''
      const freqLabel = DOSAGE_FREQUENCIES.find((f) => f.value === d.frequency)?.label ?? d.frequency
      const routeLabel = DOSAGE_ROUTES.find((r) => r.value === d.route)?.label ?? d.route
      const durVal = (d.durationValue ?? '').trim()
      const durUnit = d.durationUnit || 'weeks'
      const durationStr = durVal && /^\d+$/.test(durVal) ? `, ${durVal} ${DURATION_UNITS.find((u) => u.value === durUnit)?.label ?? durUnit} used (no break)` : ''
      if (amount) {
        const unitStr = unit ? ` ${unit}` : ''
        parts.push(`${name}: ${amount}${unitStr} ${freqLabel} (${routeLabel})${durationStr}`.replace(/\s+/g, ' ').trim())
      } else {
        parts.push(`${name}: (not specified)${routeLabel ? ` — ${routeLabel}` : ''}`)
      }
    })
    if (dosageNotes.trim()) {
      parts.push(`Additional notes: ${dosageNotes.trim()}`)
    }
    return parts.join('. ')
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
      const response = await fetch('/api/side-effects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          compounds: selectedCompounds,
          dosages: buildDosagesString(),
          sideEffects: selectedSideEffects,
          additionalSupplements: dosageNotes.trim() || undefined
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze side effects')
      }

      setResult(data.data)
      setAnalysisId(data.analysisId ?? null)
      fetchPreviousAnalyses()

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
    setCompoundDosages({})
    setDosageNotes('')
    setResult(null)
    setAnalysisId(null)
    setError(null)
  }

  const handleBackClick = () => {
    setSaveDialogOpen(true)
  }

  const handleSaveAndReturn = () => {
    setSaveDialogOpen(false)
    unsaved?.setHasUnsavedSideEffectAnalysis(false)
    resetForm()
    fetchPreviousAnalyses()
  }

  const handleDontSave = async () => {
    setSaveDialogOpen(false)
    unsaved?.setHasUnsavedSideEffectAnalysis(false)
    if (analysisId) {
      try {
        await fetch(`/api/side-effects/${analysisId}`, { method: 'DELETE' })
      } catch {
        // Ignore delete errors
      }
    }
    resetForm()
    fetchPreviousAnalyses()
  }

  const handleDeleteAnalysis = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('Delete this saved analysis? This cannot be undone.')) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/side-effects/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setPreviousAnalyses((prev) => prev.filter((log) => log.id !== id))
        if (expandedLogId === id) setExpandedLogId(null)
      }
    } catch {
      // Ignore
    } finally {
      setDeletingId(null)
    }
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    })
  }

  return (
    <TierGate>
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
            {/* Compounds & Dosages - integrated */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Pill className="h-5 w-5" />
                  Select Compounds & Dosages
                </CardTitle>
                <CardDescription>
                  Add compounds below. For each compound, enter amount, unit, frequency, route, and length of time used.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Add Compound</Label>
                  <SideEffectsCompoundInput
                    onAdd={addCompound}
                    existingNames={selectedCompounds}
                    disabled={isSubmitting}
                  />
                  <p className="text-xs text-muted-foreground">
                    Type to search the database or enter any compound name. Custom substances are allowed and will be flagged for extra disclaimers.
                  </p>
                </div>

                {selectedCompounds.length > 0 && (
                  <>
                    <div className="space-y-3 pt-2 border-t">
                      <Label className="text-base font-semibold">Dosages (Optional)</Label>
                      <p className="text-xs text-muted-foreground -mt-1">
                        Enter amount, unit, frequency, route, and length of time used for each compound.
                      </p>
                      {selectedCompounds.map((name) => {
                        const d = compoundDosages[name] ?? { amount: '', unit: 'mg', frequency: 'weekly', route: 'im', durationValue: '', durationUnit: 'weeks' }
                        return (
                          <div key={name} className="rounded-lg border bg-muted/30 p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-foreground">{name}</span>
                              <button
                                type="button"
                                onClick={() => removeCompound(name)}
                                className="text-muted-foreground hover:text-destructive p-1"
                                aria-label={`Remove ${name}`}
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                              <div className="space-y-1.5">
                                <Label className="text-xs">Amount</Label>
                                <Input
                                  type="text"
                                  inputMode="decimal"
                                  placeholder="e.g. 250"
                                  value={d.amount}
                                  onChange={(e) => updateCompoundDosage(name, 'amount', e.target.value)}
                                />
                              </div>
                              <div className="space-y-1.5">
                                <Label className="text-xs">Unit</Label>
                                <Select value={d.unit} onValueChange={(v) => updateCompoundDosage(name, 'unit', v)}>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {DOSAGE_UNITS.map((u) => (
                                      <SelectItem key={u} value={u}>
                                        {u}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-1.5">
                                <Label className="text-xs">Frequency</Label>
                                <Select value={d.frequency} onValueChange={(v) => updateCompoundDosage(name, 'frequency', v)}>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {DOSAGE_FREQUENCIES.map((f) => (
                                      <SelectItem key={f.value} value={f.value}>
                                        {f.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-1.5">
                                <Label className="text-xs">Route</Label>
                                <Select value={d.route} onValueChange={(v) => updateCompoundDosage(name, 'route', v)}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Route" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {DOSAGE_ROUTES.map((r) => (
                                      <SelectItem key={r.value} value={r.value}>
                                        {r.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-1.5">
                                <Label className="text-xs">Length used</Label>
                                <Input
                                  type="text"
                                  inputMode="numeric"
                                  placeholder="e.g. 12"
                                  value={d.durationValue ?? ''}
                                  onChange={(e) => updateCompoundDosage(name, 'durationValue', e.target.value)}
                                />
                              </div>
                              <div className="space-y-1.5">
                                <Label className="text-xs">Unit</Label>
                                <Select value={d.durationUnit ?? 'weeks'} onValueChange={(v) => updateCompoundDosage(name, 'durationUnit', v)}>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {DURATION_UNITS.map((u) => (
                                      <SelectItem key={u.value} value={u.value}>
                                        {u.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground">Time used without a break</p>
                          </div>
                        )
                      })}
                    </div>
                    <div className="space-y-2 pt-2">
                      <Label>Additional dosage or timing notes</Label>
                      <Textarea
                        placeholder="e.g. Split doses AM/PM, taken with food, etc."
                        value={dosageNotes}
                        onChange={(e) => setDosageNotes(e.target.value)}
                        rows={2}
                        className="resize-none"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Make sure everything is listed for the most accurate analysis. Leave amount blank if unknown.
                    </p>
                  </>
                )}
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
                    {COMMON_SIDE_EFFECTS.map((effect) => {
                      const isSelected = selectedSideEffects.includes(effect)
                      return (
                        <Button
                          key={effect}
                          type="button"
                          variant={isSelected ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => isSelected ? removeSideEffect(effect) : addSideEffect(effect)}
                          className="justify-start text-left h-auto py-2 px-3"
                        >
                          {isSelected ? (
                            <CheckCircle className="h-3 w-3 mr-2" />
                          ) : (
                            <Plus className="h-3 w-3 mr-2" />
                          )}
                          {effect}
                        </Button>
                      )
                    })}
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

            {/* Community Insights on Hormone Patterns */}
            {result.harmReductionObservations && result.harmReductionObservations.length > 0 && (
              <details className="group rounded-lg border-2 border-cyan-200 dark:border-cyan-800 bg-cyan-50/50 dark:bg-cyan-950/20 overflow-hidden">
                <summary className="flex items-center gap-3 cursor-pointer p-4 hover:bg-cyan-100/50 dark:hover:bg-cyan-900/20 transition-colors list-none">
                  <Shield className="h-5 w-5 text-cyan-600 flex-shrink-0" />
                  <span className="font-semibold text-cyan-900 dark:text-cyan-100">
                    Community Insights on Hormone Patterns
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

            {/* Monitoring Protocol - prominent for harm reduction */}
            {result.monitoringProtocol && result.monitoringProtocol.length > 0 && (
              <Card className="border-2 border-green-200 dark:border-green-800 bg-green-50/30 dark:bg-green-950/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-green-600" />
                    Monitoring Recommendations
                  </CardTitle>
                  <CardDescription>
                    Educational suggestions for tracking and safety monitoring. Communities repeatedly recommend bloodwork and physician oversight.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {result.monitoringProtocol.map((recommendation, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm font-medium">{recommendation}</span>
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

        {/* Commonly Discussed Supports - Elite tier-gated */}
        {result.commonlyDiscussedSupports && result.commonlyDiscussedSupports.length > 0 && (
          <CommonSupportsCard
            supports={result.commonlyDiscussedSupports}
            analysisType="side-effects"
            isElite={isElite}
          />
        )}

        {/* Potentially Helpful Supplements - pre-filled from analysis */}
        <PersonalizedSuppStack analysisType="side-effects" supports={result.commonlyDiscussedSupports} />

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

            {/* Footer disclaimer */}
            <Alert className="border-muted">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                These are general educational observations from community patterns and literature. Individual responses vary significantly. Always consult a qualified healthcare professional.
              </AlertDescription>
            </Alert>

            {/* Back Button */}
            <div className="flex justify-center">
              <Button onClick={handleBackClick} variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Side Effects
              </Button>
            </div>
          </div>
        )}

        {/* Save confirmation dialog */}
        <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
          <DialogContent hideCloseButton={false}>
            <DialogHeader>
              <DialogTitle>Save your analysis?</DialogTitle>
              <DialogDescription>
                Would you like to save this analysis to your history before returning? You can view saved analyses at the bottom of the Side Effects page.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={handleDontSave}>
                Don&apos;t Save
              </Button>
              <Button onClick={handleSaveAndReturn}>
                Save & Return
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Side Effects Diary - shown when on form view */}
        {!result && previousAnalyses.length > 0 && (
          <div className="mt-12 pt-8 border-t">
            <div className="mb-6">
              <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Side Effects Diary
              </h2>
              <p className="text-sm text-muted-foreground">
                Your side effect entries over time. Each log is saved when you analyze — track patterns and share with your healthcare provider.
              </p>
            </div>
            <div className="relative space-y-0">
              {/* Timeline line */}
              <div className="absolute left-4 top-2 bottom-2 w-px bg-border hidden sm:block" />
              {previousAnalyses.map((log, idx) => (
                <div key={log.id} className="relative flex gap-4 sm:gap-6 pb-6 last:pb-0">
                  {/* Date badge - timeline node */}
                  <div className="hidden sm:flex flex-col items-center shrink-0 w-20">
                    <div className="w-8 h-8 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center z-10">
                      <Calendar className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-xs text-muted-foreground mt-1 text-center">
                      {formatDate(log.created_at)}
                    </span>
                  </div>
                  <Card className="flex-1 min-w-0">
                    <CardHeader
                      className="cursor-pointer hover:bg-muted/50 transition-colors py-4 sm:py-4"
                      onClick={() => setExpandedLogId(expandedLogId === log.id ? null : log.id)}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                            <span className="sm:hidden text-xs text-muted-foreground">{formatDate(log.created_at)}</span>
                            <CardTitle className="text-base">
                              {log.compounds?.join(', ') || 'Unknown compounds'}
                            </CardTitle>
                          </div>
                          <CardDescription className="mt-1">
                            Side effects: {log.side_effects?.join(', ') || '—'}
                          </CardDescription>
                        </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={(e) => handleDeleteAnalysis(log.id, e)}
                          disabled={deletingId === log.id}
                          aria-label="Delete analysis"
                        >
                          {deletingId === log.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                        {expandedLogId === log.id ? (
                          <ChevronUp className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  {expandedLogId === log.id && log.analysis_result && (
                    <CardContent className="pt-0 space-y-4 border-t">
                      {log.analysis_result.harmReductionObservations && log.analysis_result.harmReductionObservations.length > 0 && (
                        <div className="rounded-lg border border-cyan-200 dark:border-cyan-800 bg-cyan-50/50 dark:bg-cyan-950/20 p-3">
                          <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                            <Shield className="h-4 w-4 text-cyan-600" />
                            Community Insights on Hormone Patterns
                          </h4>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            {log.analysis_result.harmReductionObservations.slice(0, 3).map((obs, i) => (
                              <li key={i}>• {obs}</li>
                            ))}
                          </ul>
                          {log.analysis_result.harmReductionPlainLanguage && (
                            <div className="mt-3 p-2 rounded bg-cyan-100/50 dark:bg-cyan-900/30 border border-cyan-200 dark:border-cyan-800">
                              <p className="text-xs font-medium text-cyan-900 dark:text-cyan-100 mb-0.5">In plain terms</p>
                              <p className="text-sm text-cyan-800 dark:text-cyan-200">{log.analysis_result.harmReductionPlainLanguage}</p>
                            </div>
                          )}
                          <div className="mt-3 flex flex-wrap gap-1">
                            <Button variant="outline" size="sm" className="text-xs h-7" asChild>
                              <a href={TELEHEALTH_PARTNERS.quest} target="_blank" rel="noopener noreferrer">Quest</a>
                            </Button>
                            <Button variant="outline" size="sm" className="text-xs h-7" asChild>
                              <a href={TELEHEALTH_PARTNERS.letsGetChecked} target="_blank" rel="noopener noreferrer">LetsGetChecked</a>
                            </Button>
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-2 italic">
                            General educational observations. Individual responses vary. Consult a healthcare professional.
                          </p>
                        </div>
                      )}
                      {log.analysis_result.compoundAnalysis?.map((analysis, idx) => (
                        <div key={idx} className="rounded-lg border p-4">
                          <h4 className="font-semibold mb-2">{analysis.compoundName}</h4>
                          <p className="text-sm text-muted-foreground mb-2">
                            Reported: {analysis.reportedEffects?.join(', ')}
                          </p>
                          {analysis.potentialMechanisms?.length > 0 && (
                            <ul className="text-sm space-y-1 mb-2">
                              {analysis.potentialMechanisms.slice(0, 2).map((m, i) => (
                                <li key={i}>• {m}</li>
                              ))}
                            </ul>
                          )}
                          {analysis.commonManagement?.length > 0 && (
                            <ul className="text-sm space-y-1 text-green-600 dark:text-green-400">
                              {analysis.commonManagement.slice(0, 2).map((m, i) => (
                                <li key={i}>• {m}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                      {log.analysis_result.educationalNotes && (
                        <p className="text-sm text-muted-foreground italic">
                          {log.analysis_result.educationalNotes}
                        </p>
                      )}
                    </CardContent>
                  )}
                </Card>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
    </TierGate>
  )
}