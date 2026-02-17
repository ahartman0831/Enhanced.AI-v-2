'use client'

import {
  Heart,
  Brain,
  Activity,
  Zap,
  Flame,
  Dumbbell,
  Shield,
  Eye,
  AlertTriangle,
  Droplets,
  UtensilsCrossed,
  Stethoscope,
  type LucideIcon
} from 'lucide-react'

const SYSTEM_ICON_MAP: Record<string, LucideIcon> = {
  cardiovascular: Heart,
  heart: Heart,
  endocrine: Zap,
  hormonal: Zap,
  'central nervous system': Brain,
  neurological: Brain,
  brain: Brain,
  cns: Brain,
  liver: Activity,
  hepatic: Activity,
  dermatological: Activity,
  skin: Activity,
  musculoskeletal: Dumbbell,
  muscle: Dumbbell,
  joints: Dumbbell,
  metabolic: Flame,
  gastrointestinal: UtensilsCrossed,
  gut: UtensilsCrossed,
  immune: Shield,
  ophthalmic: Eye,
  eye: Eye,
  prostate: Activity,
  hematological: Droplets,
  oncological: AlertTriangle,
  lipids: Flame,
  lipid: Flame
}

export function getMonitoringIcon(text: string): LucideIcon {
  const t = text.toLowerCase()
  if (t.includes('lipid') || t.includes('cholesterol')) return Flame
  if (t.includes('liver') || t.includes('alt') || t.includes('ast')) return Activity
  if (t.includes('heart') || t.includes('cardio') || t.includes('bp')) return Heart
  if (t.includes('hormone') || t.includes('testosterone') || t.includes('thyroid')) return Zap
  if (t.includes('blood') || t.includes('rbc') || t.includes('hemoglobin')) return Droplets
  return Stethoscope
}

export function getSystemIcon(system: string): LucideIcon {
  const key = system.toLowerCase().trim()
  if (SYSTEM_ICON_MAP[key]) return SYSTEM_ICON_MAP[key]
  for (const [k, icon] of Object.entries(SYSTEM_ICON_MAP)) {
    if (key.includes(k) || k.includes(key)) return icon
  }
  return Activity
}

export function SystemIcon({ system, className }: { system: string; className?: string }) {
  const Icon = getSystemIcon(system)
  return <Icon className={className ?? 'h-4 w-4'} />
}
