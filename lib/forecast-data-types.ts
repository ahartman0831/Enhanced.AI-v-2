/**
 * Shared data shapes for Results Forecaster, Recovery Timeline, Symptom Checker, etc.
 * Use these types when serializing modal input for backend .replace() calls.
 */

export interface ProtocolInput {
  compounds: Array<{
    name: string
    dosage?: string
    unit?: string
    frequency?: string
    route?: string
    durationValue?: string
    durationUnit?: string
  }>
  ancillaries?: string[]
  duration?: string
  notes?: string
  /** Optional personalization (generalized only) */
  ageRange?: string
  experienceLevel?: string
  primaryGoal?: string
}

export interface BloodworkInput {
  reportDate?: string
  markers?: Record<string, string | number>
  /** Common keys: totalT, freeT, e2, shbg, lh, fsh, prolactin, lipids, liver, cbc, etc. */
  rawNotes?: string
}

export interface PhotoInput {
  count: number
  dates?: string[]
  notes?: string
}

/**
 * Serialize protocol for {protocolData} placeholder
 */
export function serializeProtocol(protocol: ProtocolInput | null): string {
  if (!protocol) return 'No data provided'
  return JSON.stringify(protocol, null, 2)
}

/**
 * Serialize bloodwork for {bloodworkData} placeholder
 */
export function serializeBloodwork(bloodwork: BloodworkInput | Record<string, unknown> | null): string {
  if (!bloodwork) return 'No data provided'
  return JSON.stringify(bloodwork, null, 2)
}

/**
 * Serialize photos for {photoData} placeholder
 * Format: "User uploaded X progress photos dated [dates]. General description: [user notes]"
 */
export function serializePhotos(photos: PhotoInput | null): string {
  if (!photos || photos.count === 0) return 'No data provided'
  const dateStr = photos.dates?.length
    ? photos.dates.join(', ')
    : 'dates not specified'
  const notesStr = photos.notes?.trim() || 'No additional notes'
  return `User uploaded ${photos.count} progress photos dated [${dateStr}]. General description: ${notesStr}`
}
