/**
 * FFMI (Fat-Free Mass Index) calculation utilities.
 * Formulas based on ffmicalculator.org
 */

export type UnitSystem = 'imperial' | 'metric'

export interface FFMIInputs {
  /** Imperial: feet. Metric: not used (use heightCm) */
  heightFt?: number
  /** Imperial: inches. Metric: not used */
  heightIn?: number
  /** Metric: height in cm. Imperial: not used */
  heightCm?: number
  /** Imperial: lbs. Metric: kg */
  weight: number
  /** Body fat percentage (0-100) */
  bodyFatPct: number
  unitSystem: UnitSystem
}

export interface FFMIResult {
  /** Total body fat in same unit as input weight */
  totalBodyFat: number
  /** Lean mass (fat-free mass) in same unit as input weight */
  leanWeight: number
  /** Lean weight in kg (for FFMI formula) */
  leanWeightKg: number
  /** Body fat percentage */
  bodyFatPct: number
  /** Raw FFMI = leanWeightKg / heightM^2 */
  ffmi: number
  /** Height-adjusted FFMI (normalized to 1.8m reference) */
  normalizedFfmi: number
  /** Height in meters */
  heightM: number
}

const LBS_TO_KG = 1 / 2.20462
const INCH_TO_M = 0.0254
const REFERENCE_HEIGHT_M = 1.8
const NORMALIZATION_COEFFICIENT = 6.3

/**
 * Convert height to meters based on unit system
 */
function heightToMeters(inputs: FFMIInputs): number {
  if (inputs.unitSystem === 'metric') {
    const cm = inputs.heightCm ?? 0
    return cm / 100
  }
  const ft = inputs.heightFt ?? 0
  const inch = inputs.heightIn ?? 0
  const totalInches = ft * 12 + inch
  return totalInches * INCH_TO_M
}

/**
 * Convert weight to kg
 */
function weightToKg(weight: number, unitSystem: UnitSystem): number {
  if (unitSystem === 'metric') return weight
  return weight * LBS_TO_KG
}

/**
 * Calculate FFMI from user inputs
 */
export function calculateFFMI(inputs: FFMIInputs): FFMIResult | null {
  const heightM = heightToMeters(inputs)
  if (heightM <= 0) return null

  const weightKg = weightToKg(inputs.weight, inputs.unitSystem)
  const bodyFatDecimal = Math.max(0, Math.min(100, inputs.bodyFatPct)) / 100

  const totalBodyFat = inputs.weight * bodyFatDecimal
  const leanWeight = inputs.weight - totalBodyFat
  const leanWeightKg = weightToKg(leanWeight, inputs.unitSystem)

  const ffmi = leanWeightKg / (heightM * heightM)
  const normalizedFfmi = ffmi + NORMALIZATION_COEFFICIENT * (REFERENCE_HEIGHT_M - heightM)

  return {
    totalBodyFat,
    leanWeight,
    leanWeightKg,
    bodyFatPct: inputs.bodyFatPct,
    ffmi,
    normalizedFfmi,
    heightM,
  }
}

/**
 * Input validation ranges
 */
export const INPUT_RANGES = {
  imperial: {
    heightFt: { min: 3, max: 8 },
    heightIn: { min: 0, max: 11 },
    weightLbs: { min: 65, max: 350 },
  },
  metric: {
    heightCm: { min: 120, max: 220 },
    weightKg: { min: 30, max: 160 },
  },
  bodyFatPct: { min: 0, max: 100 },
} as const

export interface ValidationWarning {
  field: string
  message: string
}

/**
 * Validate inputs and return warnings for extreme values
 */
export function validateFFMIInputs(inputs: FFMIInputs): ValidationWarning[] {
  const warnings: ValidationWarning[] = []

  if (inputs.bodyFatPct < 3) {
    warnings.push({ field: 'bodyFatPct', message: 'Body fat below 3% is extremely rare and potentially dangerous.' })
  }
  if (inputs.bodyFatPct > 50) {
    warnings.push({ field: 'bodyFatPct', message: 'Body fat above 50% may affect FFMI accuracy.' })
  }

  if (inputs.unitSystem === 'imperial') {
    const ft = inputs.heightFt ?? 0
    const inVal = inputs.heightIn ?? 0
    if (ft < 4 || (ft === 4 && inVal === 0)) {
      warnings.push({ field: 'height', message: 'Height seems unusually short. Please verify.' })
    }
    if (ft >= 7) {
      warnings.push({ field: 'height', message: 'Height seems unusually tall. Please verify.' })
    }
    if (inputs.weight < 80) {
      warnings.push({ field: 'weight', message: 'Weight seems low for an adult. Please verify.' })
    }
    if (inputs.weight > 300) {
      warnings.push({ field: 'weight', message: 'Weight seems high. Please verify.' })
    }
  } else {
    const cm = inputs.heightCm ?? 0
    if (cm < 140) {
      warnings.push({ field: 'height', message: 'Height seems unusually short. Please verify.' })
    }
    if (cm > 210) {
      warnings.push({ field: 'height', message: 'Height seems unusually tall. Please verify.' })
    }
    if (inputs.weight < 40) {
      warnings.push({ field: 'weight', message: 'Weight seems low for an adult. Please verify.' })
    }
    if (inputs.weight > 140) {
      warnings.push({ field: 'weight', message: 'Weight seems high. Please verify.' })
    }
  }

  return warnings
}
