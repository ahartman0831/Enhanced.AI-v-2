'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseBrowserClient } from '@/lib/supabase-client'
import { useSubscriptionTier } from '@/hooks/useSubscriptionTier'
import { TierGate } from '@/components/TierGate'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion'
import { CompoundNutritionCard } from '@/components/CompoundNutritionCard'
import { DoctorPdfButton } from '@/components/DoctorPdfButton'
import { PersonalizedSuppStack } from '@/components/PersonalizedSuppStack'
import { CommonSupportsCard } from '@/components/CommonSupportsCard'
import { FrequentlyMentionedCompounds } from '@/components/FrequentlyMentionedCompounds'
import { WhatIfCompoundDialog } from '@/components/WhatIfCompoundDialog'
import { PersonalizedMonitoringPlan } from '@/components/PersonalizedMonitoringPlan'
import { SystemIcon, getMonitoringIcon } from '@/lib/system-icons'
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
  Lightbulb,
  Sparkles,
  Crown,
  Droplets,
  History,
  FolderOpen,
  Trash2,
  Beaker,
  ArrowRight
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'

interface CommonApproachDiscussed {
  base: string
  additions: string[]
  benefits: string
  risks: string
  affected_systems: string[]
  monitoring: string[]
  nutrition_impact: string
}

interface InputMetadata {
  goals?: string
  experience?: string
  riskTolerance?: string
  bloodwork?: string
}

interface StackAnalysisResult {
  report_name?: string
  input_metadata?: InputMetadata
  disclaimer?: string
  common_approaches_discussed?: CommonApproachDiscussed[]
  commonApproaches?: Array<{
    name: string
    description: string
    typicalCompounds: string[]
    rationale: string
    considerations: string[]
    experienceFit: string
    riskLevel: string
  }>
  nutrition_impact?: {
    summary?: string
    key_discussions?: string[]
    proteinConsiderations?: string
    calorieManagement?: string
    micronutrientFocus?: string
    timingStrategies?: string
    supplementSynergy?: string
  }
  nutritionImpact?: {
    proteinConsiderations: string
    calorieManagement: string
    micronutrientFocus: string
    timingStrategies: string
    supplementSynergy: string
  }
  monitoringRecommendations?: string[]
  commonly_discussed_supports?: Array<{
    name: string
    common_purpose: string
    affected_system: string
    amazon_affiliate_link?: string
  }>
  commonlyDiscussedSupports?: Array<{
    name: string
    common_purpose: string
    affected_system: string
    amazon_affiliate_link?: string
  }>
  commonly_discussed_combo_risks?: string[]
  bloodwork_markers_to_monitor?: Array<{ marker: string; why: string }>
  safety_notes?: string
  next_step?: string
  educationalNotes?: string
}

const GOALS_OPTIONS = [
  'Contest Prep',
  'Lean Bulk',
  'Dirty Bulk',
  'Cut',
  'TRT Optimization',
  'Strength Gains',
  'Strength Density',
  'General Health Optimization',
  'Recovery Enhancement',
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

  const [whatIfOpen, setWhatIfOpen] = useState(false)
  const [whatIfApproachIndex, setWhatIfApproachIndex] = useState(0)
  const [whatIfCompoundNames, setWhatIfCompoundNames] = useState<string[]>([])

  const { isPaid, isElite, loading: tierLoading } = useSubscriptionTier()
  const [showPaidUpsell, setShowPaidUpsell] = useState(false)

  const [savedReports, setSavedReports] = useState<Array<{ id: string; stack_json: StackAnalysisResult; created_at: string }>>([])
  const [savedReportsLoading, setSavedReportsLoading] = useState(true)
  const [currentReportId, setCurrentReportId] = useState<string | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [reportToDelete, setReportToDelete] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const totalSteps = 4

  useEffect(() => {
    const fetchSavedReports = async () => {
      try {
        const res = await fetch('/api/stack-explorer/reports')
        if (res.ok) {
          const { reports } = await res.json()
          setSavedReports(reports || [])
        }
      } catch {
        // Ignore
      } finally {
        setSavedReportsLoading(false)
      }
    }
    fetchSavedReports()
  }, [result]) // Refetch when result changes (new report saved)

  // Pre-populate from user_onboarding_profiles or profiles when form is empty
  useEffect(() => {
    if (goals || experience || riskTolerance) return // Already has data
    const fetchProfile = async () => {
      try {
        const [onboardingRes, profileRes] = await Promise.all([
          fetch('/api/onboarding'),
          fetch('/api/profile')
        ])
        const onboarding = onboardingRes.ok ? await onboardingRes.json() : null
        const profile = profileRes.ok ? await profileRes.json() : null
        if (onboarding?.primary_goal) setGoals(onboarding.primary_goal)
        else if (profile?.goals) setGoals(profile.goals)
        if (onboarding?.ped_experience_level) {
          const exp = onboarding.ped_experience_level
          setExperience(exp === 'none' ? 'beginner' : exp)
        } else if (profile?.experience_level) setExperience(profile.experience_level)
        if (onboarding?.risk_tolerance) setRiskTolerance(onboarding.risk_tolerance)
        else if (profile?.risk_tolerance) setRiskTolerance(profile.risk_tolerance)
      } catch {
        // Ignore
      }
    }
    fetchProfile()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps -- only on mount, skip when form has data

  const parseCompoundNames = (additions: string[] | undefined): string[] => {
    if (!additions?.length) return []
    return additions.flatMap((item) =>
      String(item)
        .split(/[,;]/)
        .map((s) => s.replace(/\s*—.*$/, '').replace(/\(e\.g\.,?\s*\)?/i, '').trim())
        .filter((s) => s.length >= 2)
    )
  }

  const handleWhatIfRegenerate = async (tweak: string) => {
    if (!result) return
    setIsSubmitting(true)
    setError(null)
    try {
      const finalGoals = goals === 'Other' ? customGoal : goals
      const response = await fetch('/api/stack-explorer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goals: finalGoals,
          experience,
          riskTolerance,
          bloodwork: bloodwork || undefined,
          compoundTweak: tweak,
          approachIndex: whatIfApproachIndex,
          previousResult: result
        })
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to regenerate')
      setResult(data.data)
      setCurrentReportId(data.protocolId ?? null)
    } catch (err: any) {
      setError(err.message || 'Failed to regenerate analysis')
    } finally {
      setIsSubmitting(false)
    }
  }

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
      setCurrentReportId(data.protocolId ?? null)
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
    setCurrentReportId(null)
    setError(null)
    setGoals('')
    setCustomGoal('')
    setExperience('')
    setRiskTolerance('')
    setBloodwork('')
  }

  const loadSavedReport = (report: { id: string; stack_json: StackAnalysisResult }) => {
    const meta = report.stack_json.input_metadata
    if (meta) {
      const storedGoals = meta.goals || ''
      const isKnownGoal = GOALS_OPTIONS.includes(storedGoals)
      setGoals(isKnownGoal ? storedGoals : (storedGoals ? 'Other' : ''))
      setCustomGoal(isKnownGoal ? '' : storedGoals)
      setExperience(meta.experience || '')
      setRiskTolerance(meta.riskTolerance || '')
      setBloodwork(meta.bloodwork || '')
    }
    setResult(report.stack_json)
    setCurrentReportId(report.id)
    setCurrentStep(totalSteps + 1)
    setError(null)
  }

  const getReportTitle = (stackJson: StackAnalysisResult): string => {
    if (stackJson.report_name?.trim()) {
      return stackJson.report_name.length > 60 ? stackJson.report_name.slice(0, 57) + '...' : stackJson.report_name
    }
    const approaches = stackJson.common_approaches_discussed ?? stackJson.commonApproaches
    if (approaches?.length) {
      const first = approaches[0]
      const base = typeof first === 'object' && first !== null && 'base' in first
        ? (first as { base?: string }).base
        : typeof first === 'object' && first !== null && 'name' in first
          ? (first as { name?: string }).name
          : null
      if (base) {
        return base.length > 60 ? base.slice(0, 57) + '...' : base
      }
    }
    return 'Stack Analysis'
  }

  const formatReportDate = (dateStr: string) => {
    const d = new Date(dateStr)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24))
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    return d.toLocaleDateString()
  }

  const openDeleteConfirm = (reportId: string) => {
    setReportToDelete(reportId)
    setDeleteConfirmOpen(true)
  }

  const handleDeleteReport = async () => {
    if (!reportToDelete) return
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/stack-explorer/reports/${reportToDelete}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      setSavedReports((prev) => prev.filter((r) => r.id !== reportToDelete))
      setDeleteConfirmOpen(false)
      setReportToDelete(null)
      if (currentReportId === reportToDelete) {
        resetForm()
      }
    } catch {
      setError('Failed to delete report')
    } finally {
      setIsDeleting(false)
    }
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

    const nutritionImpact = result.nutrition_impact ?? result.nutritionImpact
    const supports = result.commonly_discussed_supports ?? result.commonlyDiscussedSupports
    const approaches = result.common_approaches_discussed ?? result.commonApproaches
    const comboRisks = result.commonly_discussed_combo_risks
      ? (Array.isArray(result.commonly_discussed_combo_risks) ? result.commonly_discussed_combo_risks : [String(result.commonly_discussed_combo_risks)])
      : []

    return (
      <div className="space-y-8">
        {/* Saved Reports - compact when viewing results */}
        {savedReports.length > 0 && (
          <Card>
            <CardHeader className="py-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <History className="h-4 w-4" />
                {savedReports.length > 1 ? 'Switch to Another Report' : 'Saved Reports'}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex flex-wrap gap-2">
                {savedReports.map((report) => (
                  <div key={report.id} className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => loadSavedReport(report)}
                      className="text-xs h-auto py-1.5 px-2"
                    >
                      {getReportTitle(report.stack_json).slice(0, 30)}
                      {getReportTitle(report.stack_json).length > 30 ? '...' : ''} · {formatReportDate(report.created_at)}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0 opacity-60 hover:opacity-100 hover:text-destructive"
                      onClick={() => openDeleteConfirm(report.id)}
                      aria-label="Delete report"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Paid tier upsell for What If (free users only) */}
        {showPaidUpsell && !isPaid && (
          <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
            <Crown className="h-4 w-4" />
            <AlertDescription>
              <strong>Paid Feature:</strong> Upgrade to a paid plan to unlock the What If Simulator — tweak one compound and regenerate risks, combos, and nutrition impact.
              <Button variant="link" className="p-0 h-auto ml-2" onClick={() => setShowPaidUpsell(false)}>Dismiss</Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Disclaimer */}
        <Alert className="border-destructive/50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            {result.disclaimer ?? (
              <>
                <strong>Educational Analysis Only:</strong> This is for educational purposes and provides general information about common approaches discussed in health optimization communities. This is not medical advice, personalized recommendations, or treatment plans. Always consult qualified healthcare professionals before making any changes to your health regimen.
              </>
            )}
          </AlertDescription>
        </Alert>

        {/* Common Approaches */}
        <div>
          <h2 className="text-2xl font-bold mb-6">Common Educational Approaches</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {result.common_approaches_discussed?.map((approach, index) => {
              const compoundNames = parseCompoundNames(approach.additions)
              return (
                <Card key={index}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <CardTitle className="text-lg">Approach {index + 1}</CardTitle>
                        <CardDescription>{approach.base}</CardDescription>
                      </div>
                      {compoundNames.length > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="shrink-0"
                          onClick={() => {
                            setWhatIfCompoundNames(compoundNames)
                            setWhatIfApproachIndex(index)
                            if (isPaid) {
                              setWhatIfOpen(true)
                            } else {
                              setShowPaidUpsell(true)
                            }
                          }}
                        >
                          <Sparkles className="h-4 w-4 mr-1" />
                          What if?
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {approach.additions && approach.additions.length > 0 && (
                      <FrequentlyMentionedCompounds compoundNames={compoundNames} />
                    )}

                    <div>
                      <h4 className="font-semibold text-sm mb-2">Commonly Discussed Benefits:</h4>
                      <p className="text-sm text-muted-foreground">{approach.benefits}</p>
                    </div>

                    <div className="rounded-lg border-2 border-destructive/30 bg-destructive/5 dark:bg-destructive/10 p-4">
                      <h4 className="font-bold text-base mb-2 text-destructive flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 shrink-0" />
                        Risks & Monitoring Focus
                      </h4>
                      <p className="text-sm text-muted-foreground">{approach.risks}</p>
                    </div>

                    {approach.affected_systems && approach.affected_systems.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-sm mb-2">Affected Systems:</h4>
                        <div className="flex flex-wrap gap-2">
                          {approach.affected_systems.map((sys, idx) => (
                            <Badge key={idx} variant="secondary" className="flex items-center gap-1.5">
                              <SystemIcon system={sys} className="h-3.5 w-3.5" />
                              {sys}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {approach.monitoring && approach.monitoring.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-sm mb-2">Monitoring:</h4>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          {approach.monitoring.map((m, idx) => {
                            const Icon = getMonitoringIcon(m)
                            return (
                              <li key={idx} className="flex items-start gap-2">
                                <Icon className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                                {m}
                              </li>
                            )
                          })}
                        </ul>
                      </div>
                    )}

                    <div>
                      <h4 className="font-semibold text-sm mb-2">Nutrition Impact:</h4>
                      <p className="text-sm text-muted-foreground">{approach.nutrition_impact}</p>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
            {!result.common_approaches_discussed && result.commonApproaches?.map((approach, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-lg">{approach.name}</CardTitle>
                  <CardDescription>{approach.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {approach.typicalCompounds && approach.typicalCompounds.length > 0 && (
                    <FrequentlyMentionedCompounds compoundNames={approach.typicalCompounds} />
                  )}

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

        {/* Combination Risks */}
        {comboRisks.length > 0 && (
          <Card className="border-2 border-destructive/40 bg-destructive/5 dark:bg-destructive/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-bold text-destructive">
                <AlertTriangle className="h-5 w-5 shrink-0" />
                Combination Risks
              </CardTitle>
              <CardDescription>
                Communities often warn of these specific combo risks when multiple compounds are discussed
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {comboRisks.map((risk, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">{risk}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Bloodwork Markers to Check */}
        {result.bloodwork_markers_to_monitor && result.bloodwork_markers_to_monitor.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Droplets className="h-5 w-5" />
                Bloodwork Markers to Check
              </CardTitle>
              <CardDescription>
                Communities typically monitor these markers for this goal. Educational only — discuss with physician.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {result.bloodwork_markers_to_monitor.map((item, idx) => (
                  <AccordionItem key={idx} value={`marker-${idx}`}>
                    <AccordionTrigger className="text-left">
                      {item.marker}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      {item.why}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
              <p className="mt-4 text-xs text-muted-foreground italic">
                Educational only — discuss with physician before ordering or interpreting any bloodwork.
              </p>
              <Link
                href={`/blood-panel-order?markers=${encodeURIComponent(result.bloodwork_markers_to_monitor.map((m) => (typeof m === 'string' ? m : (m as { marker?: string }).marker ?? '')).filter(Boolean).join(','))}`}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-amber-700 transition-colors"
              >
                <Beaker className="h-4 w-4" />
                Order Blood Test
                <ArrowRight className="h-4 w-4" />
              </Link>
              <p className="mt-2 text-xs text-muted-foreground">
                Opens lab order screen with these markers pre-filled. You can add or remove markers before ordering.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Nutrition Impact */}
        {nutritionImpact && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Compound Nutrition Impact</h2>
            <CompoundNutritionCard compound={{
              name: 'Nutrition Strategy Overview',
              description: (nutritionImpact as { summary?: string }).summary || 'Educational overview of nutritional considerations',
              benefits: (nutritionImpact as { key_discussions?: string[] }).key_discussions || [],
              risks: [],
              interactions: [],
              dosage: undefined
            }} />

            <Card className="mt-4">
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {nutritionImpact.proteinConsiderations && (
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Lightbulb className="h-4 w-4" />
                        Protein Considerations
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {nutritionImpact.proteinConsiderations}
                      </p>
                    </div>
                  )}

                  {nutritionImpact.calorieManagement && (
                    <div>
                      <h4 className="font-semibold mb-2">Calorie Management</h4>
                      <p className="text-sm text-muted-foreground">
                        {nutritionImpact.calorieManagement}
                      </p>
                    </div>
                  )}

                  {nutritionImpact.micronutrientFocus && (
                    <div>
                      <h4 className="font-semibold mb-2">Micronutrient Focus</h4>
                      <p className="text-sm text-muted-foreground">
                        {nutritionImpact.micronutrientFocus}
                      </p>
                    </div>
                  )}

                  {nutritionImpact.timingStrategies && (
                    <div>
                      <h4 className="font-semibold mb-2">Timing Strategies</h4>
                      <p className="text-sm text-muted-foreground">
                        {nutritionImpact.timingStrategies}
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
                {result.monitoringRecommendations.map((recommendation, index) => {
                  const Icon = getMonitoringIcon(recommendation)
                  return (
                    <li key={index} className="flex items-start gap-2">
                      <Icon className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{recommendation}</span>
                    </li>
                  )
                })}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Safety Notes & Next Step */}
        {(result.safety_notes || result.next_step) && (
          <Alert>
            <Lightbulb className="h-4 w-4" />
            <AlertDescription>
              {result.safety_notes && <p className="mb-2">{result.safety_notes}</p>}
              {result.next_step && (
                <p className="font-semibold">{result.next_step}</p>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Educational Notes (legacy) */}
        {result.educationalNotes && !result.safety_notes && (
          <Alert>
            <Lightbulb className="h-4 w-4" />
            <AlertDescription>{result.educationalNotes}</AlertDescription>
          </Alert>
        )}

        {/* Personalized Monitoring Plan - Elite */}
        <PersonalizedMonitoringPlan
          compoundNames={(() => {
            const approaches = result.common_approaches_discussed ?? result.commonApproaches ?? []
            const names = new Set<string>()
            approaches.forEach((a: { additions?: string[]; typicalCompounds?: string[] }) => {
              const list = a.additions ?? a.typicalCompounds ?? []
              list.forEach((item: string) => {
                String(item).split(/[,;]/).forEach((s) => {
                  const t = s.replace(/\s*—.*$/, '').trim()
                  if (t.length >= 2) names.add(t)
                })
              })
            })
            return Array.from(names)
          })()}
          bloodwork={bloodwork || undefined}
          isElite={isElite}
        />

        {/* Commonly Discussed Supports - Elite tier-gated */}
        {supports && supports.length > 0 && (
          <CommonSupportsCard
            supports={supports}
            analysisType="stack-explorer"
            isElite={isElite}
          />
        )}

        {/* Potentially Helpful Supplements - pre-filled from analysis */}
        <PersonalizedSuppStack analysisType="stack-explorer" supports={supports ?? undefined} />

            {/* PDF & Save note */}
            <div className="flex flex-col items-center gap-2">
              <p className="text-xs text-muted-foreground">Report saved automatically</p>
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

        {/* What If Dialog */}
        <WhatIfCompoundDialog
          open={whatIfOpen}
          onOpenChange={setWhatIfOpen}
          compoundNames={whatIfCompoundNames}
          approachIndex={whatIfApproachIndex}
          onRegenerate={handleWhatIfRegenerate}
        />
      </div>
    )
  }

  return (
    <TierGate>
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

        {/* Saved Reports - under Next button for user continuity */}
        {currentStep <= totalSteps && !savedReportsLoading && savedReports.length > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <History className="h-5 w-5" />
                Saved Reports
              </CardTitle>
              <CardDescription>
                Your previous stack analyses are saved automatically. Click to view.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {savedReports.map((report) => (
                  <div
                    key={report.id}
                    className="flex items-center gap-2 p-3 rounded-lg border bg-muted/50 hover:bg-muted transition-colors group"
                  >
                    <button
                      type="button"
                      onClick={() => loadSavedReport(report)}
                      className="flex-1 flex items-center gap-3 min-w-0 text-left"
                    >
                      <FolderOpen className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm truncate">
                          {getReportTitle(report.stack_json)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatReportDate(report.created_at)}
                        </p>
                      </div>
                    </button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0 opacity-60 hover:opacity-100 hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation()
                        openDeleteConfirm(report.id)
                      }}
                      aria-label="Delete report"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Delete Report Confirmation */}
        <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Report</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this report? This cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)} disabled={isDeleting}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDeleteReport} disabled={isDeleting}>
                {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Delete'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
    </TierGate>
  )
}