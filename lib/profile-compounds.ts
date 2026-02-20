/**
 * Shared types and helpers for profile current compounds.
 * Used by profile page and confirm modals (DataInputModal, RecoveryConfirmModal, UpdateInfoModal).
 */

export interface CompoundDosage {
  amount: string
  unit: string
  frequency: string
  route: string
  durationValue: string
  durationUnit: string
}

export interface CurrentCompoundsData {
  compounds: string[]
  compoundDosages: Record<string, CompoundDosage>
  dosageNotes?: string
}

/** Compare two protocol snapshots - returns true if they differ */
export function compoundsDataDiffers(
  a: CurrentCompoundsData | null,
  b: { compounds: string[]; compoundDosages: Record<string, CompoundDosage>; dosageNotes?: string }
): boolean {
  if (!a) return b.compounds.length > 0 || (b.dosageNotes ?? '').trim().length > 0
  if (a.compounds.length !== b.compounds.length) return true
  const aSorted = [...a.compounds].sort()
  const bSorted = [...b.compounds].sort()
  if (aSorted.some((c, i) => c !== bSorted[i])) return true
  if ((a.dosageNotes ?? '').trim() !== (b.dosageNotes ?? '').trim()) return true
  for (const name of b.compounds) {
    const da = a.compoundDosages[name]
    const db = b.compoundDosages[name]
    if (!da || !db) return true
    if (
      da.amount !== db.amount ||
      da.unit !== db.unit ||
      da.frequency !== db.frequency ||
      da.route !== db.route ||
      (da.durationValue ?? '') !== (db.durationValue ?? '') ||
      (da.durationUnit ?? 'weeks') !== (db.durationUnit ?? 'weeks')
    ) {
      return true
    }
  }
  return false
}
