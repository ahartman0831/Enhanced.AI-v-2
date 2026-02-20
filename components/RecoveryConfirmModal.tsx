'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { SideEffectsCompoundInput } from '@/components/SideEffectsCompoundInput'
import { AlertTriangle, Loader2, Plus, X, CheckCircle, Pill, Activity, Shield } from 'lucide-react'

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

/** Parse saved dosages string back into compoundDosages + optional additional notes */
function parseDosagesString(
  dosagesStr: string | null,
  compoundNames: string[]
): { compoundDosages: Record<string, { amount: string; unit: string; frequency: string; route: string; durationValue: string; durationUnit: string }>; additionalNotes: string } {
  const result: Record<string, { amount: string; unit: string; frequency: string; route: string; durationValue: string; durationUnit: string }> = {}
  const freqByLabel = Object.fromEntries(DOSAGE_FREQUENCIES.map((f) => [f.label.toLowerCase(), f.value]))
  const routeByLabel = Object.fromEntries(
    DOSAGE_ROUTES.map((r) => [r.label.toLowerCase().replace(/\s*\([^)]*\)\s*/g, '').trim(), r.value])
  )
  routeByLabel['im'] = 'im'
  routeByLabel['intramuscular'] = 'im'
  routeByLabel['subq'] = 'subq'
  routeByLabel['subcutaneous'] = 'subq'
  routeByLabel['sub-q'] = 'subq'
  routeByLabel['oral'] = 'oral'
  routeByLabel['transdermal'] = 'transdermal'
  routeByLabel['nasal'] = 'nasal'

  let additionalNotes = ''
  let str = (dosagesStr || '').trim()

  const additionalMatch = str.match(/Additional notes:\s*(.+)$/i)
  if (additionalMatch) {
    additionalNotes = additionalMatch[1].trim()
    str = str.replace(/\s*\.?\s*Additional notes:.*$/i, '').trim()
  }

  for (const name of compoundNames) {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const re = new RegExp(`${escaped}:\\s*(.+?)(?=\\.\\s+[A-Za-z]|$)`, 's')
    const match = str.match(re)
    const defaultD = { amount: '', unit: 'mg', frequency: 'weekly', route: 'im', durationValue: '', durationUnit: 'weeks' }
    if (!match) {
      result[name] = { ...defaultD }
      continue
    }
    const part = match[1].trim()
    if (part.startsWith('(not specified)')) {
      const routePart = part.replace('(not specified)', '').replace(/^[—–-]\s*/, '').trim()
      const routeValue = Object.entries(routeByLabel).find(([k]) =>
        routePart.toLowerCase().includes(k)
      )?.[1] ?? 'im'
      result[name] = { amount: '', unit: 'mg', frequency: 'weekly', route: routeValue, durationValue: '', durationUnit: 'weeks' }
      continue
    }
    const numMatch = part.match(/^(\d+(?:\.\d+)?)\s*/)
    const amount = numMatch ? numMatch[1] : ''
    const rest = (numMatch ? part.slice(numMatch[0].length) : part).trim()
    const unitsOrdered = [...DOSAGE_UNITS].sort((a, b) => b.length - a.length)
    const unitMatch = rest.match(new RegExp(`^(${unitsOrdered.join('|')})\\s+`, 'i'))
    const unit = unitMatch ? unitMatch[1].toLowerCase() : 'mg'
    const afterUnit = unitMatch ? rest.slice(unitMatch[0].length) : rest
    const freqFound = Object.entries(freqByLabel).find(([label]) =>
      afterUnit.toLowerCase().includes(label)
    )
    const frequency = freqFound?.[1] ?? 'weekly'
    const routeMatch = afterUnit.match(/\(([^)]+)\)\s*$/)
    const routeLabel = routeMatch ? routeMatch[1].toLowerCase() : ''
    const routeValue =
      Object.entries(routeByLabel).find(([k]) => routeLabel.includes(k) || k.includes(routeLabel))?.[1] ?? 'im'
    const durationMatch = part.match(/(\d+)\s*(day|week|month|year)s?\s*(?:used|without break)?/i)
    const durationValue = durationMatch ? durationMatch[1] : ''
    const unitMap: Record<string, string> = { day: 'days', week: 'weeks', month: 'months', year: 'years' }
    const rawUnit = durationMatch?.[2].toLowerCase().replace(/s$/, '')
    const durationUnit = durationMatch ? (unitMap[rawUnit ?? ''] ?? 'weeks') : 'weeks'
    result[name] = { amount, unit, frequency, route: routeValue, durationValue, durationUnit }
  }
  return { compoundDosages: result, additionalNotes }
}

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
  'Other',
]

interface SideEffectLog {
  id: string
  compounds: string[]
  dosages: string | null
  side_effects: string[]
  created_at: string
}

export interface RecoveryCycleContext {
  compounds: string[]
  dosages: string
  sideEffects: string[]
  additionalSupplements?: string
}

interface RecoveryConfirmModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaveAndAnalyze: (context: RecoveryCycleContext) => Promise<void>
  onSkipAndUseLastKnown: () => Promise<void>
  isAnalyzing?: boolean
}

export function RecoveryConfirmModal({
  open,
  onOpenChange,
  onSaveAndAnalyze,
  onSkipAndUseLastKnown,
  isAnalyzing = false,
}: RecoveryConfirmModalProps) {
  const [selectedCompounds, setSelectedCompounds] = useState<string[]>([])
  const [selectedSideEffects, setSelectedSideEffects] = useState<string[]>([])
  const [customSideEffect, setCustomSideEffect] = useState('')
  const [compoundDosages, setCompoundDosages] = useState<Record<string, { amount: string; unit: string; frequency: string; route: string; durationValue: string; durationUnit: string }>>({})
  const [dosageNotes, setDosageNotes] = useState('')
  const [isLoadingPrefill, setIsLoadingPrefill] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [showSkipConfirm, setShowSkipConfirm] = useState(false)

  const buildDosagesString = useCallback((): string => {
    const parts: string[] = []
    selectedCompounds.forEach((name) => {
      const d = compoundDosages[name]
      if (!d) return
      const amount = d.amount.trim()
      const unit = d.unit && d.unit !== 'other' ? d.unit : ''
      const freqLabel = DOSAGE_FREQUENCIES.find((f) => f.value === d.frequency)?.label ?? d.frequency
      const routeLabel = DOSAGE_ROUTES.find((r) => r.value === d.route)?.label ?? d.route
      const durationValue = (d.durationValue ?? '').trim()
      const durationUnit = d.durationUnit ?? 'weeks'
      let base = ''
      if (amount) {
        const unitStr = unit ? ` ${unit}` : ''
        base = `${name}: ${amount}${unitStr} ${freqLabel} (${routeLabel})`.replace(/\s+/g, ' ').trim()
      } else {
        base = `${name}: (not specified)${routeLabel ? ` — ${routeLabel}` : ''}`
      }
      if (durationValue && /^\d+$/.test(durationValue)) {
        const unitLabel = DURATION_UNITS.find((u) => u.value === durationUnit)?.label ?? durationUnit
        base += `, ${durationValue} ${unitLabel} used (no break)`
      }
      parts.push(base)
    })
    if (dosageNotes.trim()) {
      parts.push(`Additional notes: ${dosageNotes.trim()}`)
    }
    return parts.join('. ')
  }, [selectedCompounds, compoundDosages, dosageNotes])

  const fetchPrefillData = useCallback(async () => {
    setIsLoadingPrefill(true)
    try {
      const res = await fetch('/api/side-effects')
      if (res.ok) {
        const { data } = await res.json()
        const logs = (data ?? []) as SideEffectLog[]
        const latest = logs[0]
        if (latest) {
          const compounds = latest.compounds ?? []
          setSelectedCompounds(compounds)
          setSelectedSideEffects(latest.side_effects ?? [])
          const { compoundDosages: parsed, additionalNotes } = parseDosagesString(latest.dosages, compounds)
          // Prefer explicit additional_supplements column over parsed from dosages
          setDosageNotes((latest.additional_supplements ?? additionalNotes) || '')
          setCompoundDosages(parsed)
        }
      }
    } catch {
      // Ignore
    } finally {
      setIsLoadingPrefill(false)
    }
  }, [])

  useEffect(() => {
    if (open) {
      setSaveError(null)
      setShowSkipConfirm(false)
      fetchPrefillData()
    }
  }, [open, fetchPrefillData])

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

  const updateCompoundDosage = (name: string, field: 'amount' | 'unit' | 'frequency' | 'route' | 'durationValue' | 'durationUnit', value: string) => {
    setCompoundDosages((prev) => ({
      ...prev,
      [name]: { ...prev[name], [field]: value },
    }))
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
    setSelectedSideEffects(selectedSideEffects.filter((e) => e !== effect))
  }

  const allCompoundsHaveDosage = selectedCompounds.length === 0 || selectedCompounds.every((name) => {
    const d = compoundDosages[name]
    return d && d.amount.trim() !== ''
  })

  const handleSaveAndAnalyze = async () => {
    if (selectedSideEffects.length === 0) {
      setSaveError('Please add at least one side effect.')
      return
    }
    if (selectedCompounds.length > 0 && !allCompoundsHaveDosage) {
      setSaveError('Please enter amount, unit, frequency, route, and length of time used for each compound listed.')
      return
    }
    setSaveError(null)
    try {
      await onSaveAndAnalyze({
        compounds: selectedCompounds,
        dosages: buildDosagesString(),
        sideEffects: selectedSideEffects,
      })
      onOpenChange(false)
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save and analyze')
    }
  }

  const handleSkipAndUseLastKnown = async () => {
    setSaveError(null)
    setShowSkipConfirm(false)
    try {
      await onSkipAndUseLastKnown()
      onOpenChange(false)
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : 'Failed to analyze')
    }
  }

  const handleCancel = () => {
    if (showSkipConfirm) {
      setShowSkipConfirm(false)
      onOpenChange(false)
    } else {
      setShowSkipConfirm(true)
    }
  }

  const handleDialogOpenChange = (o: boolean) => {
    if (!o) setShowSkipConfirm(false)
    onOpenChange(o)
  }

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col gap-0 p-0 border-cyan-500/20">
        <DialogHeader className="px-6 pt-6 pb-4 shrink-0 border-b">
          <DialogTitle>Confirm Current Cycle & Side Effects</DialogTitle>
          <DialogDescription>
            Please update for accurate educational timeline analysis.
          </DialogDescription>
        </DialogHeader>

        <Alert className="mx-6 mt-4 border-cyan-500/20 bg-cyan-500/5 dark:bg-cyan-950/20 dark:border-cyan-800/50 shrink-0">
          <Shield className="h-4 w-4" />
          <AlertDescription className="text-sm">
            Self-reported data only – educational summary for physician review. Educational only – not medical advice. Physician must verify all data.
          </AlertDescription>
        </Alert>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {isLoadingPrefill ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {/* Compounds */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Pill className="h-4 w-4" />
                  Compounds
                </Label>
                <SideEffectsCompoundInput
                  onAdd={addCompound}
                  existingNames={selectedCompounds}
                  disabled={isAnalyzing}
                />
                {selectedCompounds.length > 0 && (
                  <>
                    <p className="text-xs text-muted-foreground pt-2">
                      Amount, unit, frequency, route, and length of time used are required for each compound.
                    </p>
                    <div className="pt-2 border-t overflow-x-auto">
                      <table className="w-full min-w-[640px] text-sm">
                        <thead>
                          <tr className="border-b text-left text-muted-foreground">
                            <th className="py-2 pr-2 font-medium">Compound</th>
                            <th className="py-2 pr-2 font-medium">Amount <span className="text-destructive">*</span></th>
                            <th className="py-2 pr-2 font-medium">Unit <span className="text-destructive">*</span></th>
                            <th className="py-2 pr-2 font-medium">Frequency <span className="text-destructive">*</span></th>
                            <th className="py-2 pr-2 font-medium">Route</th>
                            <th className="py-2 pr-2 font-medium">Length of time <span className="text-destructive">*</span></th>
                            <th className="py-2 w-8"></th>
                          </tr>
                        </thead>
                        <tbody>
                        {selectedCompounds.map((name) => {
                          const d = compoundDosages[name] ?? { amount: '', unit: 'mg', frequency: 'weekly', route: 'im', durationValue: '', durationUnit: 'weeks' }
                          return (
                            <tr key={name} className="border-b last:border-0">
                              <td className="py-2 pr-2 font-medium align-top">{name}</td>
                              <td className="py-2 pr-2 align-top">
                                <Input
                                  type="text"
                                  inputMode="decimal"
                                  placeholder="e.g. 250"
                                  value={d.amount}
                                  onChange={(e) => updateCompoundDosage(name, 'amount', e.target.value)}
                                  className="h-8 w-20"
                                />
                              </td>
                              <td className="py-2 pr-2 align-top">
                                <Select value={d.unit} onValueChange={(v) => updateCompoundDosage(name, 'unit', v)}>
                                  <SelectTrigger className="h-8 w-16">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {DOSAGE_UNITS.map((u) => (
                                      <SelectItem key={u} value={u}>{u}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </td>
                              <td className="py-2 pr-2 align-top">
                                <Select value={d.frequency} onValueChange={(v) => updateCompoundDosage(name, 'frequency', v)}>
                                  <SelectTrigger className="h-8 w-28">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {DOSAGE_FREQUENCIES.map((f) => (
                                      <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </td>
                              <td className="py-2 pr-2 align-top">
                                <Select value={d.route} onValueChange={(v) => updateCompoundDosage(name, 'route', v)}>
                                  <SelectTrigger className="h-8 w-20">
                                    <SelectValue placeholder="Route" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {DOSAGE_ROUTES.map((r) => (
                                      <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </td>
                              <td className="py-2 pr-2 align-top">
                                <div className="flex gap-1 items-center">
                                  <Input
                                    type="text"
                                    inputMode="numeric"
                                    placeholder="e.g. 12"
                                    value={d.durationValue ?? ''}
                                    onChange={(e) => updateCompoundDosage(name, 'durationValue', e.target.value)}
                                    className="h-8 w-14"
                                  />
                                  <Select value={d.durationUnit ?? 'weeks'} onValueChange={(v) => updateCompoundDosage(name, 'durationUnit', v)}>
                                    <SelectTrigger className="h-8 w-20">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {DURATION_UNITS.map((u) => (
                                        <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <p className="text-xs text-muted-foreground mt-0.5">Time used without break</p>
                              </td>
                              <td className="py-2 align-top">
                                <button
                                  type="button"
                                  onClick={() => removeCompound(name)}
                                  className="text-muted-foreground hover:text-destructive p-1"
                                  aria-label={`Remove ${name}`}
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </td>
                            </tr>
                          )
                        })}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}

                <div className="space-y-1 pt-2">
                  <Label className="text-xs">Additional supplements or information (optional)</Label>
                  <Textarea
                    placeholder="e.g. Fish oil, multivitamin, or any other supplements or relevant info to list"
                    value={dosageNotes}
                    onChange={(e) => setDosageNotes(e.target.value)}
                    rows={2}
                    className="resize-none text-sm"
                  />
                </div>
              </div>

              {/* Side Effects */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Side Effects
                </Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-40 overflow-y-auto">
                  {COMMON_SIDE_EFFECTS.map((effect) => {
                    const isSelected = selectedSideEffects.includes(effect)
                    return (
                      <Button
                        key={effect}
                        type="button"
                        variant={isSelected ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => (isSelected ? removeSideEffect(effect) : addSideEffect(effect))}
                        className="justify-start text-left h-auto py-1.5 px-2 text-xs"
                      >
                        {isSelected ? <CheckCircle className="h-3 w-3 mr-1.5 shrink-0" /> : <Plus className="h-3 w-3 mr-1.5 shrink-0" />}
                        {effect}
                      </Button>
                    )
                  })}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Custom side effect..."
                    value={customSideEffect}
                    onChange={(e) => setCustomSideEffect(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomSideEffect())}
                    className="flex-1"
                  />
                  <Button type="button" onClick={addCustomSideEffect} size="sm" variant="outline">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {selectedSideEffects.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {selectedSideEffects.map((effect) => (
                      <Badge key={effect} variant="secondary" className="flex items-center gap-1">
                        {effect}
                        <button type="button" onClick={() => removeSideEffect(effect)} className="ml-0.5 hover:text-destructive">
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {saveError && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{saveError}</AlertDescription>
            </Alert>
          )}

          {showSkipConfirm && (
            <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Use last known data?</strong> The analysis will use your most recent saved compounds and side effects. Based on prior data – may not reflect current. Verify with physician.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="px-6 py-4 border-t shrink-0 flex-col sm:flex-row gap-2">
          {showSkipConfirm ? (
            <>
              <Button
                variant="secondary"
                onClick={handleSkipAndUseLastKnown}
                disabled={isAnalyzing}
                className="bg-cyan-600/20 hover:bg-cyan-600/30 border-cyan-500/30"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  'Yes, Use Last Known'
                )}
              </Button>
              <Button variant="ghost" onClick={() => { setShowSkipConfirm(false); onOpenChange(false); }} disabled={isAnalyzing}>
                No, Close
              </Button>
            </>
          ) : (
            <>
              <Button
                onClick={handleSaveAndAnalyze}
                disabled={isAnalyzing || isLoadingPrefill || selectedSideEffects.length === 0 || (selectedCompounds.length > 0 && !allCompoundsHaveDosage)}
                className="bg-cyan-600 hover:bg-cyan-700 text-white"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving & Analyzing...
                  </>
                ) : (
                  'Save & Analyze'
                )}
              </Button>
              <Button
                variant="outline"
                onClick={handleSkipAndUseLastKnown}
                disabled={isAnalyzing || isLoadingPrefill}
              >
                Skip & Use Last Known
              </Button>
              <Button variant="ghost" onClick={handleCancel} disabled={isAnalyzing}>
                Cancel
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
