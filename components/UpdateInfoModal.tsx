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
import { CompoundDosageSection, DOSAGE_UNITS, DOSAGE_FREQUENCIES, DOSAGE_ROUTES, DURATION_UNITS } from '@/components/CompoundDosageSection'
import { AlertTriangle, Loader2, Plus, X, CheckCircle, Activity, Shield } from 'lucide-react'
import { compoundsDataDiffers, type CurrentCompoundsData } from '@/lib/profile-compounds'

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
    const defaultD = { amount: '', unit: 'mg', frequency: 'weekly', route: 'im' }
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
      result[name] = { amount: '', unit: 'mg', frequency: 'weekly', route: routeValue }
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
  additional_supplements?: string | null
  created_at: string
}

interface UpdateInfoModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaveAndGenerate: (compounds: string[], dosages: string, sideEffects: string[], additionalSupplements?: string) => Promise<void>
  onGenerateWithLastKnown: () => Promise<void>
  isGenerating?: boolean
}

export function UpdateInfoModal({
  open,
  onOpenChange,
  onSaveAndGenerate,
  onGenerateWithLastKnown,
  isGenerating = false,
}: UpdateInfoModalProps) {
  const [selectedCompounds, setSelectedCompounds] = useState<string[]>([])
  const [selectedSideEffects, setSelectedSideEffects] = useState<string[]>([])
  const [customSideEffect, setCustomSideEffect] = useState('')
  const [compoundDosages, setCompoundDosages] = useState<Record<string, { amount: string; unit: string; frequency: string; route: string; durationValue: string; durationUnit: string }>>({})
  const [dosageNotes, setDosageNotes] = useState('')
  const [isLoadingPrefill, setIsLoadingPrefill] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [profileCompounds, setProfileCompounds] = useState<CurrentCompoundsData | null>(null)
  const [showSaveToProfileConfirm, setShowSaveToProfileConfirm] = useState(false)

  const buildDosagesString = useCallback((): string => {
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
  }, [selectedCompounds, compoundDosages, dosageNotes])

  const fetchPrefillData = useCallback(async () => {
    setIsLoadingPrefill(true)
    try {
      const profileRes = await fetch('/api/profile')
      if (profileRes.ok) {
        const profileData = await profileRes.json()
        const cc = profileData.current_compounds_json as CurrentCompoundsData | null
        if (cc?.compounds?.length) {
          setProfileCompounds(cc)
          setSelectedCompounds(cc.compounds)
          setCompoundDosages(cc.compoundDosages ?? {})
          setDosageNotes(cc.dosageNotes ?? '')
          const sideRes = await fetch('/api/side-effects')
          if (sideRes.ok) {
            const { data } = await sideRes.json()
            const logs = (data ?? []) as SideEffectLog[]
            const latest = logs[0]
            if (latest) setSelectedSideEffects(latest.side_effects ?? [])
          }
          setIsLoadingPrefill(false)
          return
        }
        setProfileCompounds(null)
      }

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
      setShowCancelConfirm(false)
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

  const allCompoundsHaveDosage = selectedCompounds.every((name) => {
    const d = compoundDosages[name]
    return d && d.amount.trim() !== ''
  })

  const doSaveAndGenerate = async () => {
    await onSaveAndGenerate(selectedCompounds, buildDosagesString(), selectedSideEffects, dosageNotes.trim() || undefined)
    onOpenChange(false)
  }

  const handleSaveAndGenerate = async () => {
    if (selectedSideEffects.length === 0) {
      setSaveError('Please add at least one side effect.')
      return
    }
    if (selectedCompounds.length > 0 && !allCompoundsHaveDosage) {
      setSaveError('Please enter amount, unit, frequency, route, and length of time used for each compound listed.')
      return
    }
    setSaveError(null)

    const currentData = { compounds: selectedCompounds, compoundDosages, dosageNotes }
    if (compoundsDataDiffers(profileCompounds, currentData)) {
      setShowSaveToProfileConfirm(true)
      return
    }

    try {
      await doSaveAndGenerate()
    } catch (err: any) {
      setSaveError(err.message || 'Failed to save and generate')
    }
  }

  const handleSaveToProfileChoice = async (saveToProfile: boolean) => {
    setShowSaveToProfileConfirm(false)
    try {
      if (saveToProfile) {
        const res = await fetch('/api/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            current_compounds_json: {
              compounds: selectedCompounds,
              compoundDosages,
              dosageNotes: dosageNotes.trim() || undefined,
            },
          }),
        })
        if (!res.ok) throw new Error('Failed to save to profile')
      }
      await doSaveAndGenerate()
    } catch (err: any) {
      setSaveError(err.message || 'Failed to save and generate')
    }
  }

  const handleGenerateWithLastKnown = async () => {
    setSaveError(null)
    setShowCancelConfirm(false)
    try {
      await onGenerateWithLastKnown()
      onOpenChange(false)
    } catch (err: any) {
      setSaveError(err.message || 'Failed to generate')
    }
  }

  const handleCancel = () => {
    if (showCancelConfirm) {
      setShowCancelConfirm(false)
      onOpenChange(false)
    } else {
      setShowCancelConfirm(true)
    }
  }

  const handleDialogOpenChange = (o: boolean) => {
    if (!o) setShowCancelConfirm(false)
    onOpenChange(o)
  }

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col gap-0 p-0">
        <DialogHeader className="px-6 pt-6 pb-4 shrink-0 border-b">
          <DialogTitle>Confirm Current Compounds & Side Effects</DialogTitle>
          <DialogDescription>
            Please review/update before we create your educational referral summary.
          </DialogDescription>
        </DialogHeader>

        <Alert className="mx-6 mt-4 border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 shrink-0">
          <Shield className="h-4 w-4" />
          <AlertDescription className="text-sm">
            Updating ensures the report reflects your current state for physician review. All data self-reported – verify with doctor.
          </AlertDescription>
        </Alert>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {isLoadingPrefill ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {/* Compounds - same component as profile */}
              <CompoundDosageSection
                selectedCompounds={selectedCompounds}
                compoundDosages={compoundDosages}
                dosageNotes={dosageNotes}
                onAddCompound={addCompound}
                onRemoveCompound={removeCompound}
                onUpdateDosage={updateCompoundDosage}
                onDosageNotesChange={setDosageNotes}
                disabled={isGenerating}
                durationContext="used"
                showRequired={true}
                title="Compounds"
              />

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

          {showSaveToProfileConfirm && (
            <Alert className="border-cyan-200 bg-cyan-50 dark:bg-cyan-950/20 dark:border-cyan-800">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Save this strategy to your profile?</strong> Your compounds differ from what&apos;s saved. Saving will prefill future confirm dialogs.
              </AlertDescription>
            </Alert>
          )}

          {showCancelConfirm && (
            <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Generate with last known data?</strong> The report will use your most recent saved compounds and side effects. Data may be outdated – physician must verify.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="px-6 py-4 border-t shrink-0 flex-col sm:flex-row gap-2">
          {showSaveToProfileConfirm ? (
            <>
              <Button
                onClick={() => handleSaveToProfileChoice(true)}
                disabled={isGenerating}
                className="bg-cyan-600 hover:bg-cyan-700 text-white"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Yes, Save to Profile & Generate'
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => handleSaveToProfileChoice(false)}
                disabled={isGenerating}
              >
                No, Just Generate
              </Button>
              <Button variant="ghost" onClick={() => setShowSaveToProfileConfirm(false)} disabled={isGenerating}>
                Cancel
              </Button>
            </>
          ) : showCancelConfirm ? (
            <>
              <Button
                variant="secondary"
                onClick={handleGenerateWithLastKnown}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  'Yes, Generate with Last Known'
                )}
              </Button>
              <Button variant="ghost" onClick={() => { setShowCancelConfirm(false); onOpenChange(false); }} disabled={isGenerating}>
                No, Close
              </Button>
            </>
          ) : (
            <>
              <Button
                onClick={handleSaveAndGenerate}
                disabled={isGenerating || isLoadingPrefill || selectedSideEffects.length === 0 || (selectedCompounds.length > 0 && !allCompoundsHaveDosage)}
                className="bg-cyan-600 hover:bg-cyan-700 text-white"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving & Generating...
                  </>
                ) : (
                  'Save & Generate Report'
                )}
              </Button>
              <Button
                variant="outline"
                onClick={handleGenerateWithLastKnown}
                disabled={isGenerating || isLoadingPrefill}
              >
                Generate with Last Known Data
              </Button>
              <Button variant="ghost" onClick={handleCancel} disabled={isGenerating}>
                Cancel
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
