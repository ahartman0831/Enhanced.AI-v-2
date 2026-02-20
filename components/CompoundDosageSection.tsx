'use client'

/**
 * Shared compound + dosage input section.
 * Used in profile page and confirm protocol dialogs (DataInputModal, RecoveryConfirmModal, UpdateInfoModal).
 */

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { SideEffectsCompoundInput } from '@/components/SideEffectsCompoundInput'
import { Pill, X } from 'lucide-react'

export const DOSAGE_UNITS = ['mg', 'mcg', 'iu', 'g', 'ml', 'units', 'other'] as const
export const DOSAGE_FREQUENCIES = [
  { value: 'daily', label: 'Daily' },
  { value: 'twice_daily', label: 'Twice daily' },
  { value: 'eod', label: 'EOD (every other day)' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'twice_weekly', label: 'Twice weekly' },
  { value: 'every_3_days', label: 'Every 3 days' },
  { value: 'other', label: 'Other' },
] as const
export const DOSAGE_ROUTES = [
  { value: 'im', label: 'Intramuscular (IM)' },
  { value: 'subq', label: 'Subcutaneous (Sub-Q)' },
  { value: 'oral', label: 'Oral' },
  { value: 'transdermal', label: 'Transdermal' },
  { value: 'nasal', label: 'Nasal' },
  { value: 'other', label: 'Other' },
] as const
export const DURATION_UNITS = [
  { value: 'days', label: 'Days' },
  { value: 'weeks', label: 'Weeks' },
  { value: 'months', label: 'Months' },
  { value: 'years', label: 'Years' },
] as const

export const DEFAULT_DOSAGE = { amount: '', unit: 'mg', frequency: 'weekly', route: 'im', durationValue: '', durationUnit: 'weeks' }

export interface CompoundDosageSectionProps {
  selectedCompounds: string[]
  compoundDosages: Record<string, { amount: string; unit: string; frequency: string; route: string; durationValue: string; durationUnit: string }>
  dosageNotes: string
  onAddCompound: (name: string) => void
  onRemoveCompound: (name: string) => void
  onUpdateDosage: (name: string, field: 'amount' | 'unit' | 'frequency' | 'route' | 'durationValue' | 'durationUnit', value: string) => void
  onDosageNotesChange: (value: string) => void
  disabled?: boolean
  /** 'planning' = "planning to use" (Results Forecaster), 'used' = "used" (Recovery Timeline) */
  durationContext?: 'planning' | 'used'
  /** Show required asterisks on table headers */
  showRequired?: boolean
  /** Section title - default "Compounds" */
  title?: string
  /** Optional helper text below title */
  helperText?: string
}

export function CompoundDosageSection({
  selectedCompounds,
  compoundDosages,
  dosageNotes,
  onAddCompound,
  onRemoveCompound,
  onUpdateDosage,
  onDosageNotesChange,
  disabled = false,
  durationContext = 'planning',
  showRequired = true,
  title = 'Compounds',
  helperText,
}: CompoundDosageSectionProps) {
  const durationLabel = durationContext === 'planning' ? 'Length of time planning to use' : 'Length of time used'
  const durationHint = durationContext === 'planning' ? 'Time used without break' : 'Time used without break'

  return (
    <div className="space-y-3">
      <Label className="flex items-center gap-2">
        <Pill className="h-4 w-4" />
        {title}
      </Label>
      {helperText && <p className="text-xs text-muted-foreground">{helperText}</p>}
      <SideEffectsCompoundInput
        onAdd={onAddCompound}
        existingNames={selectedCompounds}
        disabled={disabled}
      />
      {selectedCompounds.length > 0 && (
        <>
          <div className="flex flex-wrap gap-1.5">
            {selectedCompounds.map((name) => (
              <Badge key={name} variant="secondary" className="flex items-center gap-1 pr-1">
                {name}
                <button
                  type="button"
                  onClick={() => onRemoveCompound(name)}
                  className="ml-0.5 rounded-full p-0.5 hover:bg-destructive/20 hover:text-destructive"
                  aria-label={`Remove ${name}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
          <p className="text-xs text-muted-foreground pt-2">
            Amount, unit, frequency, route, and {durationLabel.toLowerCase()} are required for each compound.
          </p>
          <div className="pt-2 border-t overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="py-2 pr-2 font-medium">Compound</th>
                  <th className="py-2 pr-2 font-medium">Amount {showRequired && <span className="text-destructive">*</span>}</th>
                  <th className="py-2 pr-2 font-medium">Unit {showRequired && <span className="text-destructive">*</span>}</th>
                  <th className="py-2 pr-2 font-medium">Frequency {showRequired && <span className="text-destructive">*</span>}</th>
                  <th className="py-2 pr-2 font-medium">Route</th>
                  <th className="py-2 pr-2 font-medium">{durationLabel} {showRequired && <span className="text-destructive">*</span>}</th>
                  <th className="py-2 w-8"></th>
                </tr>
              </thead>
              <tbody>
                {selectedCompounds.map((name) => {
                  const d = compoundDosages[name] ?? DEFAULT_DOSAGE
                  return (
                    <tr key={name} className="border-b last:border-0">
                      <td className="py-2 pr-2 font-medium align-top">{name}</td>
                      <td className="py-2 pr-2 align-top">
                        <Input
                          type="text"
                          inputMode="decimal"
                          placeholder="e.g. 250"
                          value={d.amount}
                          onChange={(e) => onUpdateDosage(name, 'amount', e.target.value)}
                          className="h-8 w-20"
                          disabled={disabled}
                        />
                      </td>
                      <td className="py-2 pr-2 align-top">
                        <Select value={d.unit} onValueChange={(v) => onUpdateDosage(name, 'unit', v)} disabled={disabled}>
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
                        <Select value={d.frequency} onValueChange={(v) => onUpdateDosage(name, 'frequency', v)} disabled={disabled}>
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
                        <Select value={d.route} onValueChange={(v) => onUpdateDosage(name, 'route', v)} disabled={disabled}>
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
                            onChange={(e) => onUpdateDosage(name, 'durationValue', e.target.value)}
                            className="h-8 w-14"
                            disabled={disabled}
                          />
                          <Select value={d.durationUnit ?? 'weeks'} onValueChange={(v) => onUpdateDosage(name, 'durationUnit', v)} disabled={disabled}>
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
                        <p className="text-xs text-muted-foreground mt-0.5">{durationHint}</p>
                      </td>
                      <td className="py-2 align-top">
                        <button
                          type="button"
                          onClick={() => onRemoveCompound(name)}
                          className="text-muted-foreground hover:text-destructive p-1"
                          aria-label={`Remove ${name}`}
                          disabled={disabled}
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
          <div className="space-y-1 pt-2">
            <Label className="text-xs">Additional supplements or information (optional)</Label>
            <Textarea
              placeholder="e.g. Fish oil, multivitamin, or any other supplements or relevant info to list"
              value={dosageNotes}
              onChange={(e) => onDosageNotesChange(e.target.value)}
              rows={2}
              className="resize-none text-sm"
              disabled={disabled}
            />
          </div>
        </>
      )}
    </div>
  )
}
