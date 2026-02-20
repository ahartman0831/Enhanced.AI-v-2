// STACK_EDUCATION_FEATURE START
'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { TierGate } from '@/components/TierGate'
import { CompoundCard } from '@/components/CompoundCard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  AlertTriangle,
  Loader2,
  Beaker,
  Search,
  Pill,
  X
} from 'lucide-react'

interface Compound {
  id: string
  name: string
  category: string
  common_uses: string | null
  risk_score: number
}

interface CompoundBreakdown {
  name?: string
  commonly_discussed_uses?: string
  scientific_evidence_patterns?: string
  side_effect_patterns?: string
  metabolic_nutrient_effects?: string
}

interface MonitoringMarker {
  marker?: string
  rationale?: string
  resource_hint?: string
}

interface ComboPatterns {
  synergies?: string
  risks?: string
  high_risk_patterns?: string
  nutrition_impact?: string
  monitoring_markers?: (string | MonitoringMarker)[]
}

interface CompoundSummary {
  id?: string
  name?: string
  category?: string
  common_uses?: string | null
  risk_score?: number
  affected_systems?: string[]
  key_monitoring_markers?: string[]
  nutrition_impact_summary?: string | null
  what_it_is?: string | null
  side_effects?: string | null
  sources?: string[] | null
  aromatization_score?: number | null
  aromatization_notes?: string | null
  aa_ratio?: Record<string, unknown> | null
  created_at?: string | null
  updated_at?: string | null
  breakdown_updated_at?: string | null
  notes?: string
}

interface StackEducationResult {
  disclaimer?: string
  compound_summaries?: CompoundSummary[]
  compound_breakdowns?: CompoundBreakdown[]
  combo_patterns?: ComboPatterns
  safety_notes?: string
  next_step?: string
  user_responsibility?: string
}

export default function StackEducationPage() {
  const [compounds, setCompounds] = useState<Compound[]>([])
  const [compoundsLoading, setCompoundsLoading] = useState(true)
  const [selectedNames, setSelectedNames] = useState<Set<string>>(new Set())
  const [compoundSearch, setCompoundSearch] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<StackEducationResult | null>(null)
  const [acknowledgedDisclaimer, setAcknowledgedDisclaimer] = useState(false)

  useEffect(() => {
    fetch('/api/compounds')
      .then((res) => res.json())
      .then((data) => setCompounds(Array.isArray(data) ? data : []))
      .catch(() => setCompounds([]))
      .finally(() => setCompoundsLoading(false))
  }, [])

  const filteredCompounds = useMemo(() => {
    if (!compoundSearch.trim()) return compounds
    const q = compoundSearch.toLowerCase()
    return compounds.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.category || '').toLowerCase().includes(q) ||
        (c.common_uses || '').toLowerCase().includes(q)
    )
  }, [compounds, compoundSearch])

  const toggleCompound = (name: string) => {
    setSelectedNames((prev) => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
    if (!selectedNames.has(name)) setCompoundSearch('')
  }

  const removeCompound = (name: string) => {
    setSelectedNames((prev) => {
      const next = new Set(prev)
      next.delete(name)
      return next
    })
  }

  const removeAll = () => setSelectedNames(new Set())

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setError(null)
    setResult(null)
    try {
      if (selectedNames.size === 0) {
        throw new Error('Select at least one compound')
      }
      if (!acknowledgedDisclaimer) {
        throw new Error('Please acknowledge the disclaimer before submitting')
      }
      const res = await fetch('/api/stack-education', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goals: 'Not provided',
          experience: 'Not provided',
          riskTolerance: 'Not provided',
          selectedCompounds: Array.from(selectedNames)
        })
      })
      const data = await res.json()
      if (!res.ok) {
        const msg = data.error || 'Failed to analyze'
        const flags = data.flags as string[] | undefined
        throw new Error(flags?.length ? `${msg} Flagged: ${flags.join(', ')}` : msg)
      }
      setResult(data.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <TierGate>
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 z-10 bg-amber-100 dark:bg-amber-950/50 border-b border-amber-200 dark:border-amber-800 px-4 py-2 text-center text-sm text-amber-900 dark:text-amber-100">
          Educational patterns only. Not medical advice. Consult a physician before any health decisions.
        </div>
        <div className="container mx-auto px-4 py-8 max-w-5xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Stack Education</h1>
            <p className="text-muted-foreground">
              Select any compounds from the database and receive educational, observational analysis of commonly discussed patterns, risks, effects, and monitoring considerations — no suggestions, no recommendations, only information based on your selections.
            </p>
          </div>

          <Alert className="mb-8 border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <strong>Educational only. Not medical advice.</strong> This tool provides neutral, factual education on combinations YOU select. It does not recommend, suggest, or comment on goal alignment. Consult your physician.
            </AlertDescription>
          </Alert>

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!result ? (
            <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-4xl">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Pill className="h-5 w-5" />
                    Select Compounds to Analyze
                  </CardTitle>
                  <CardDescription>
                    Choose any compounds from the full database. AI will provide neutral, factual education on each compound and combo-level patterns.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search compounds..."
                      value={compoundSearch}
                      onChange={(e) => setCompoundSearch(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <div className="border rounded-lg max-h-64 overflow-y-auto p-2 space-y-1">
                    {compoundsLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : filteredCompounds.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-4 text-center">No compounds match your search</p>
                    ) : (
                      filteredCompounds.map((c) => (
                        <label
                          key={c.id}
                          className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 cursor-pointer"
                        >
                          <Checkbox
                            checked={selectedNames.has(c.name)}
                            onCheckedChange={() => toggleCompound(c.name)}
                          />
                          <span className="font-medium">{c.name}</span>
                          <Badge variant="outline" className="text-xs">{c.category}</Badge>
                          <span className="text-xs text-muted-foreground">Risk {c.risk_score}/10</span>
                        </label>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div>
                    <CardTitle className="text-base">Selected</CardTitle>
                    <CardDescription>
                      {selectedNames.size} compound{selectedNames.size !== 1 ? 's' : ''} selected
                    </CardDescription>
                  </div>
                  {selectedNames.size > 0 && (
                    <Button variant="ghost" size="sm" onClick={removeAll} className="text-muted-foreground hover:text-destructive">
                      Remove all
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                  {selectedNames.size === 0 ? (
                    <p className="text-sm text-muted-foreground py-4">No compounds selected yet</p>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {Array.from(selectedNames).map((name) => (
                        <div
                          key={name}
                          className="flex items-center justify-between gap-2 py-2 px-3 rounded-md bg-muted/50"
                        >
                          <span className="font-medium text-sm">{name}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                            onClick={() => removeCompound(name)}
                            aria-label={`Remove ${name}`}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="mt-6 max-w-4xl space-y-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <Checkbox
                  checked={acknowledgedDisclaimer}
                  onCheckedChange={(c) => setAcknowledgedDisclaimer(!!c)}
                />
                <span className="text-sm text-muted-foreground">
                  I understand this is educational information based on my selections and I am solely responsible for any actions taken.
                </span>
              </label>
              <Button
                className="w-full"
                onClick={handleSubmit}
                disabled={isSubmitting || selectedNames.size === 0 || !acknowledgedDisclaimer}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Beaker className="h-4 w-4 mr-2" />
                    Analyze Selected Stack
                  </>
                )}
              </Button>
            </div>
            </>
          ) : (
            <div className="space-y-6">
              {result.disclaimer && (
                <Alert className="border-amber-200 dark:border-amber-800">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-xs">{result.disclaimer}</AlertDescription>
                </Alert>
              )}

              {result.compound_summaries && result.compound_summaries.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Educational Compound Summaries</h3>
                  <p className="text-sm text-muted-foreground">
                    Neutral reference data from the database. Individual risks/responses vary dramatically — not medical advice. Click any card for full scientific breakdown.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {result.compound_summaries
                      .filter((cs): cs is CompoundSummary & { id: string } => !!cs.id)
                      .map((cs) => (
                        <CompoundCard
                          key={cs.id}
                          compound={{
                            id: cs.id,
                            name: cs.name || 'Unknown',
                            category: cs.category || '',
                            common_uses: cs.common_uses ?? null,
                            risk_score: cs.risk_score ?? 0,
                            affected_systems: cs.affected_systems ?? null,
                            key_monitoring_markers: cs.key_monitoring_markers ?? null,
                            nutrition_impact_summary: cs.nutrition_impact_summary ?? null,
                            what_it_is: cs.what_it_is ?? null,
                            side_effects: cs.side_effects ?? null,
                            sources: cs.sources ?? null,
                            aromatization_score: cs.aromatization_score ?? null,
                            aromatization_notes: cs.aromatization_notes ?? null,
                            aa_ratio: cs.aa_ratio ?? null,
                            created_at: cs.created_at ?? null,
                            updated_at: cs.updated_at ?? null,
                            breakdown_updated_at: cs.breakdown_updated_at ?? null,
                          }}
                        />
                      ))}
                  </div>
                </div>
              )}

              {result.compound_breakdowns && result.compound_breakdowns.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Individual Compound Breakdowns</h3>
                  {result.compound_breakdowns.map((cb, idx) => (
                    <Card key={idx}>
                      <CardHeader>
                        <CardTitle className="text-base">{cb.name || `Compound ${idx + 1}`}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {cb.commonly_discussed_uses && (
                          <div>
                            <h4 className="font-semibold text-sm mb-1">Commonly Discussed Uses</h4>
                            <p className="text-sm text-muted-foreground">{cb.commonly_discussed_uses}</p>
                          </div>
                        )}
                        {cb.scientific_evidence_patterns && (
                          <div>
                            <h4 className="font-semibold text-sm mb-1">Scientific Evidence Patterns</h4>
                            <p className="text-sm text-muted-foreground">{cb.scientific_evidence_patterns}</p>
                          </div>
                        )}
                        {cb.side_effect_patterns && (
                          <div className="rounded-lg border-2 border-amber-300/60 dark:border-amber-700/60 bg-amber-50/40 dark:bg-amber-950/20 p-4">
                            <h4 className="font-bold text-base mb-2 text-amber-700 dark:text-amber-400 flex items-center gap-2">
                              <AlertTriangle className="h-5 w-5 shrink-0" />
                              Side Effect Patterns
                            </h4>
                            <p className="text-sm text-muted-foreground">{cb.side_effect_patterns}</p>
                          </div>
                        )}
                        {cb.metabolic_nutrient_effects && (
                          <div>
                            <h4 className="font-semibold text-sm mb-1">Metabolic & Nutrient Effects</h4>
                            <p className="text-sm text-muted-foreground">{cb.metabolic_nutrient_effects}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {result.combo_patterns && (
                <Card>
                  <CardHeader>
                    <CardTitle>Combination Patterns</CardTitle>
                    <CardDescription>Observational insights on interactions, risks, and nutrition</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {result.combo_patterns.synergies && (
                      <div>
                        <h4 className="font-semibold text-sm mb-1">Synergies</h4>
                        <p className="text-sm text-muted-foreground">{result.combo_patterns.synergies}</p>
                      </div>
                    )}
                    {result.combo_patterns.risks && (
                      <div className="rounded-lg border-2 border-amber-300/60 dark:border-amber-700/60 bg-amber-50/40 dark:bg-amber-950/20 p-4">
                        <h4 className="font-bold text-base mb-2 text-amber-700 dark:text-amber-400 flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5 shrink-0" />
                          Risks
                        </h4>
                        <p className="text-sm text-muted-foreground">{result.combo_patterns.risks}</p>
                      </div>
                    )}
                    {result.combo_patterns.high_risk_patterns && (
                      <div className="rounded-lg border-2 border-destructive/40 bg-destructive/10 dark:bg-destructive/15 p-4">
                        <h4 className="font-bold text-base mb-2 text-destructive flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5 shrink-0" />
                          High-Risk Patterns (commonly discussed)
                        </h4>
                        <p className="text-sm text-muted-foreground">{result.combo_patterns.high_risk_patterns}</p>
                      </div>
                    )}
                    {result.combo_patterns.nutrition_impact && (
                      <div>
                        <h4 className="font-semibold text-sm mb-1">Nutrition Impact</h4>
                        <p className="text-sm text-muted-foreground">{result.combo_patterns.nutrition_impact}</p>
                      </div>
                    )}
                    {result.combo_patterns.monitoring_markers && result.combo_patterns.monitoring_markers.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-sm mb-2">Monitoring Markers</h4>
                        <div className="space-y-3">
                          {result.combo_patterns.monitoring_markers.map((m, i) => {
                            const obj = typeof m === 'object' && m !== null ? m as MonitoringMarker : null
                            const marker = obj?.marker ?? (typeof m === 'string' ? m : String(m))
                            return (
                              <div key={i} className="rounded-md border p-3 space-y-1">
                                <span className="font-medium text-sm">{marker}</span>
                                {obj?.rationale && (
                                  <p className="text-sm text-muted-foreground">{obj.rationale}</p>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {result.safety_notes && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{result.safety_notes}</AlertDescription>
                </Alert>
              )}

              {result.user_responsibility && (
                <Alert className="border-amber-200 dark:border-amber-800">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-xs">{result.user_responsibility}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Button asChild className="w-full">
                  <Link href="/blood-panel-order">
                    <Beaker className="h-4 w-4 mr-2" />
                    Order Blood Panels
                  </Link>
                </Button>
                <p className="text-center">
                  <button
                    type="button"
                    onClick={() => { setResult(null); setError(null); setAcknowledgedDisclaimer(false) }}
                    className="text-sm text-muted-foreground hover:text-foreground underline"
                  >
                    Analyze different stack
                  </button>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </TierGate>
  )
}
// STACK_EDUCATION_FEATURE END
