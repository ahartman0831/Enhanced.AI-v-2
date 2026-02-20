'use client'

import { useRef, useState, useMemo, useCallback } from 'react'
import {
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceArea,
  ReferenceLine,
  ReferenceDot,
  Legend,
  Brush,
  TooltipProps,
} from 'recharts'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { AlertTriangle, Download, FileImage, ExternalLink, RotateCcw } from 'lucide-react'
import html2canvas from 'html2canvas'
import { PDFDocument } from 'pdf-lib'
import { TELEHEALTH_PARTNERS } from '@/lib/affiliates'

const PHASE_COLORS: Record<string, string> = {
  acute: '#3b82f6',
  extended: '#10b981',
  'long-term': '#f59e0b',
  default: '#6366f1',
}

const COMPOUND_SLOPE_MAP: Record<string, { slope: number; weeks: number; dipFactor?: number }> = {
  trestolone: { slope: 0.6, weeks: 10, dipFactor: 1.3 },
  ment: { slope: 0.6, weeks: 10, dipFactor: 1.3 },
  trenbolone: { slope: 0.5, weeks: 12, dipFactor: 1.4 },
  tren: { slope: 0.5, weeks: 12, dipFactor: 1.4 },
  testosterone: { slope: 1, weeks: 6, dipFactor: 1 },
  test: { slope: 1, weeks: 6, dipFactor: 1 },
  hgh: { slope: 1.5, weeks: 3, dipFactor: 0.7 },
  'growth hormone': { slope: 1.5, weeks: 3, dipFactor: 0.7 },
  deca: { slope: 0.4, weeks: 14, dipFactor: 1.2 },
  nandrolone: { slope: 0.4, weeks: 14, dipFactor: 1.2 },
  anavar: { slope: 1.2, weeks: 3, dipFactor: 0.9 },
  oxandrolone: { slope: 1.2, weeks: 3, dipFactor: 0.9 },
  winstrol: { slope: 0.9, weeks: 6, dipFactor: 1 },
}

const TOOLTIP_CONTEXT: Record<string, string> = {
  recoveryProgress: 'Overall recovery %—often discussed as gradual improvement over weeks.',
  hormoneRecovery: 'Hormone recovery trend. Dip = suppression phase per forums; rise = rebound.',
  testosterone: 'Testosterone levels. Often discussed as slower to recover than other markers.',
  cortisol: 'Cortisol. Stress axis may take longer to normalize per community discussions.',
}

interface GraphPhase {
  phase: string
  startWeek: number
  endWeek: number
  color?: string
}

interface CompoundCurve {
  compound: string
  recoverySlope?: string
  suppressionWeeks?: number
  notes?: string
}

interface SideEffectOverlay {
  symptom: string
  typicalDissipationWeek?: number
  note?: string
}

interface GraphData {
  phases?: GraphPhase[]
  compoundCurves?: CompoundCurve[]
  sideEffectOverlays?: SideEffectOverlay[]
  harshRealityNote?: string
}

interface RecoveryPhase {
  phase: string
  timeframe: string
  plainEnglishExpectations?: string
  keyConsiderations?: string[]
  typicalMarkers?: string[]
  educationalNotes?: string
}

interface RecoveryTimelineGraphProps {
  recoveryTimeline: RecoveryPhase[]
  graphData?: GraphData | null
  compounds?: string[]
  sideEffects?: string[]
  bloodworkMarkers?: Record<string, { value: number | string; unit?: string }> | null
}

function parseTimeframeToWeeks(timeframe: string): number {
  const match = timeframe.match(/(\d+)-?(\d+)?\s*(week|month)/i)
  if (!match) return 4
  const num1 = parseInt(match[1])
  const num2 = match[2] ? parseInt(match[2]) : num1
  const unit = match[3].toLowerCase()
  if (unit.includes('month')) {
    return Math.round(((num1 + num2) / 2) * 4.3)
  }
  return Math.round((num1 + num2) / 2)
}

/** Convert ng/dL to 0–100 scale (rough: 300–1000 = typical range) */
function testToPercent(val: number | string): number {
  const n = typeof val === 'string' ? parseFloat(val.replace(/[^0-9.-]/g, '')) : val
  if (isNaN(n)) return 50
  return Math.min(100, Math.max(0, ((n - 200) / 800) * 100))
}

export function RecoveryTimelineGraph({
  recoveryTimeline,
  graphData,
  compounds = [],
  sideEffects = [],
  bloodworkMarkers = null,
}: RecoveryTimelineGraphProps) {
  const chartRef = useRef<HTMLDivElement>(null)
  const [exporting, setExporting] = useState<'png' | 'pdf' | null>(null)
  const [visibleLines, setVisibleLines] = useState<Record<string, boolean>>({
    recoveryProgress: true,
    hormoneRecovery: true,
    testosterone: true,
    cortisol: true,
  })
  const [pctSimulation, setPctSimulation] = useState(0) // 0–100: "What If PCT" boost

  const toggleLine = useCallback((dataKey: string) => {
    setVisibleLines((prev) => {
      const next = { ...prev }
      const isSolo = Object.values(prev).filter(Boolean).length === 1 && prev[dataKey]
      if (isSolo) {
        Object.keys(next).forEach((k) => { next[k] = true })
      } else {
        next[dataKey] = !prev[dataKey]
        if (!next[dataKey] && Object.values(next).every((v) => !v)) {
          next[dataKey] = true
        }
      }
      return next
    })
  }, [])

  const soloLine = useCallback((dataKey: string) => {
    setVisibleLines((prev) => {
      const next = { ...prev }
      const isAlreadySolo = prev[dataKey] && Object.entries(prev).filter(([k, v]) => v && k !== dataKey).length === 0
      if (isAlreadySolo) {
        Object.keys(next).forEach((k) => { next[k] = true })
      } else {
        Object.keys(next).forEach((k) => { next[k] = k === dataKey })
      }
      return next
    })
  }, [])

  const { chartData, phases, symptomWeeks, userBloodworkPoint } = useMemo(() => {
    if (!recoveryTimeline?.length) return { chartData: [], phases: [], symptomWeeks: [], userBloodworkPoint: null }

    let weekCounter = 0
    const phases: Array<{ phase: string; startWeek: number; endWeek: number; color: string }> = []
    const dataByWeek: Record<number, Record<string, number>> = {}
    const symptomWeeks: Array<{ week: number; label: string }> = []

    const compoundConfig = compounds.length > 0
      ? compounds.reduce(
          (acc, c) => {
            const key = c.toLowerCase().replace(/\s/g, '')
            const match = Object.entries(COMPOUND_SLOPE_MAP).find(([k]) => key.includes(k) || k.includes(key))
            if (match) {
              acc.slope = Math.min(acc.slope, match[1].slope)
              acc.dipFactor = Math.max(acc.dipFactor, match[1].dipFactor ?? 1)
            }
            return acc
          },
          { slope: 1, dipFactor: 1 }
        )
      : { slope: 1, dipFactor: 1 }

    const seen = new Set<string>()
    graphData?.sideEffectOverlays?.forEach((s) => {
      if (s.typicalDissipationWeek != null && !seen.has(`${s.typicalDissipationWeek}-${s.symptom}`)) {
        seen.add(`${s.typicalDissipationWeek}-${s.symptom}`)
        symptomWeeks.push({ week: s.typicalDissipationWeek, label: s.symptom })
      }
    })
    sideEffects.forEach((s) => {
      const week = graphData?.sideEffectOverlays?.find((o) => o.symptom.toLowerCase().includes(s.toLowerCase()))?.typicalDissipationWeek ?? 6
      if (!seen.has(`${week}-${s}`)) {
        seen.add(`${week}-${s}`)
        symptomWeeks.push({ week, label: s })
      }
    })

    recoveryTimeline.forEach((phase) => {
      const weeks = parseTimeframeToWeeks(phase.timeframe)
      const phaseKey = phase.phase.toLowerCase()
      const color = PHASE_COLORS[phaseKey] || PHASE_COLORS.default

      phases.push({ phase: phase.phase, startWeek: weekCounter, endWeek: weekCounter + weeks - 1, color })

      const dipFactor = phaseKey.includes('acute') ? compoundConfig.dipFactor : 1

      for (let i = 0; i < weeks; i++) {
        const w = weekCounter + i
        const progress = Math.min(100, (w / 16) * 100 * compoundConfig.slope)
        let hormoneRecovery = phaseKey.includes('acute') ? 95 : phaseKey.includes('extended') ? 85 : 75
        hormoneRecovery = Math.max(30, hormoneRecovery - i * (2 * dipFactor))
        if (!dataByWeek[w]) dataByWeek[w] = { week: w, phase: phase.phase }
        dataByWeek[w].recoveryProgress = Math.round(progress)
        dataByWeek[w].hormoneRecovery = Math.round(hormoneRecovery)
        dataByWeek[w].testosterone = phaseKey.includes('acute') ? 85 : phaseKey.includes('extended') ? 75 : 65
        dataByWeek[w].cortisol = phaseKey.includes('acute') ? 65 : phaseKey.includes('extended') ? 55 : 45
      }
      weekCounter += weeks
    })

    const chartData = Object.values(dataByWeek).sort((a, b) => a.week - b.week)

    let userBloodworkPoint: { week: number; y: number; label: string } | null = null
    if (bloodworkMarkers && chartData.length > 0) {
      const testKey = Object.keys(bloodworkMarkers).find((k) => /test|total t/i.test(k))
      if (testKey) {
        const v = bloodworkMarkers[testKey].value
        const pct = testToPercent(v)
        const week = Math.min(2, chartData.length - 1)
        userBloodworkPoint = {
          week: chartData[week].week,
          y: pct,
          label: `Your latest: ${v}${bloodworkMarkers[testKey].unit ? ` ${bloodworkMarkers[testKey].unit}` : ''} – ${pct > 70 ? 'above' : pct < 40 ? 'below' : 'within'} typical patterns`,
        }
      }
    }

    return { chartData, phases, symptomWeeks, userBloodworkPoint }
  }, [recoveryTimeline, graphData, compounds, sideEffects, bloodworkMarkers])

  const chartDataWithPct = useMemo(() => {
    if (pctSimulation === 0) return chartData
    const boost = (pctSimulation / 100) * 15
    return chartData.map((d) => ({
      ...d,
      hormoneRecovery: Math.min(100, (d.hormoneRecovery ?? 0) + boost),
      testosterone: Math.min(100, (d.testosterone ?? 0) + boost),
    }))
  }, [chartData, pctSimulation])

  const CustomTooltip = useCallback(({ active, payload, label }: TooltipProps<number, string>) => {
    if (!active || !payload?.length) return null
    return (
      <div className="rounded-lg border bg-background p-3 shadow-lg text-sm space-y-2 min-w-[200px]">
        <p className="font-semibold">Week {label}</p>
        {payload.map((entry) => (
          <div key={entry.dataKey} className="flex justify-between gap-4">
            <span>{entry.name}:</span>
            <span className="font-medium">{entry.value}%</span>
          </div>
        ))}
        {payload.some((e) => TOOLTIP_CONTEXT[e.dataKey as string]) && (
          <p className="text-xs text-muted-foreground border-t pt-2 mt-2">
            {TOOLTIP_CONTEXT[payload[0].dataKey as string] ?? 'Per community discussions.'}
          </p>
        )}
      </div>
    )
  }, [])

  const renderLegend = useCallback((props: unknown) => {
    const payload = (props as { payload?: Array<{ value: string; dataKey: string }> }).payload
    if (!payload?.length) return null
    return (
      <div className="flex flex-wrap gap-2 justify-center mt-2">
        {payload.map((entry) => {
          const key = entry.dataKey as string
          const visible = visibleLines[key] ?? true
          return (
            <button
              key={key}
              type="button"
              onClick={() => soloLine(key)}
              onDoubleClick={(e) => { e.preventDefault(); toggleLine(key) }}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                visible ? 'bg-muted' : 'opacity-40 bg-muted/50'
              }`}
              title="Click to solo, double-click to toggle"
            >
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{
                  backgroundColor:
                    key === 'recoveryProgress' ? '#3b82f6' :
                    key === 'hormoneRecovery' ? '#10b981' :
                    key === 'testosterone' ? '#f59e0b' : '#ef4444',
                }}
              />
              {entry.value}
            </button>
          )
        })}
      </div>
    )
  }, [visibleLines, toggleLine, soloLine])

  const handleExportPng = async () => {
    if (!chartRef.current) return
    setExporting('png')
    try {
      const canvas = await html2canvas(chartRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
      })
      const link = document.createElement('a')
      link.download = 'recovery-timeline.png'
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (err) {
      console.error('PNG export failed:', err)
    } finally {
      setExporting(null)
    }
  }

  const handleExportPdf = async () => {
    if (!chartRef.current) return
    setExporting('pdf')
    try {
      const canvas = await html2canvas(chartRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
      })
      const imgData = canvas.toDataURL('image/png')
      const base64 = imgData.replace(/^data:image\/png;base64,/, '')
      const binaryString = atob(base64)
      const bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i)

      const pdfDoc = await PDFDocument.create()
      const pngImage = await pdfDoc.embedPng(bytes)
      const page = pdfDoc.addPage([pngImage.width, pngImage.height])
      page.drawImage(pngImage, { x: 0, y: 0, width: pngImage.width, height: pngImage.height })
      const pdfBytes = await pdfDoc.save()
      const blob = new Blob([pdfBytes], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'recovery-timeline.pdf'
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('PDF export failed:', err)
    } finally {
      setExporting(null)
    }
  }

  if (chartData.length === 0) return null

  return (
    <div className="space-y-4">
      <div ref={chartRef} className="bg-background p-4 rounded-lg border">
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartDataWithPct}>
              <defs>
                <linearGradient id="recoveryGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="week"
                label={{ value: 'Weeks Post-Protocol', position: 'insideBottom', offset: -10 }}
              />
              <YAxis label={{ value: 'Recovery %', angle: -90, position: 'insideLeft' }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend content={renderLegend} />
              {phases.map((p, i) => (
                <ReferenceArea
                  key={`phase-${i}`}
                  x1={p.startWeek}
                  x2={p.endWeek}
                  fill={p.color}
                  fillOpacity={0.1}
                  label={{ value: p.phase, position: 'insideTopLeft' }}
                />
              ))}
              {symptomWeeks.slice(0, 5).map((s, i) => (
                <ReferenceLine
                  key={`symptom-${i}`}
                  x={s.week}
                  stroke="#94a3b8"
                  strokeDasharray="4 4"
                  label={{ value: `≈ ${s.label}`, position: 'top', fontSize: 10 }}
                />
              ))}
              {userBloodworkPoint && (
                <ReferenceDot
                  x={userBloodworkPoint.week}
                  y={userBloodworkPoint.y}
                  r={8}
                  fill="#8b5cf6"
                  stroke="#fff"
                  strokeWidth={2}
                  label={{ value: 'Your latest', position: 'top' }}
                />
              )}
              {visibleLines.recoveryProgress && (
                <Area
                  type="monotone"
                  dataKey="recoveryProgress"
                  stroke="#3b82f6"
                  fill="url(#recoveryGradient)"
                  strokeWidth={2}
                  name="Overall Recovery"
                />
              )}
              {visibleLines.hormoneRecovery && (
                <Area
                  type="monotone"
                  dataKey="hormoneRecovery"
                  stroke="#10b981"
                  fill="#10b981"
                  fillOpacity={0.2}
                  strokeWidth={2}
                  name="Hormone Recovery"
                />
              )}
              {visibleLines.testosterone && (
                <Line
                  type="monotone"
                  dataKey="testosterone"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={{ fill: '#f59e0b', strokeWidth: 2, r: 4 }}
                  name="Testosterone"
                />
              )}
              {visibleLines.cortisol && (
                <Line
                  type="monotone"
                  dataKey="cortisol"
                  stroke="#ef4444"
                  strokeWidth={2}
                  dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
                  name="Cortisol"
                />
              )}
              <Brush dataKey="week" height={24} stroke="#94a3b8" travellerWidth={8} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <p className="text-xs text-muted-foreground mt-2 text-center">
          Click legend to solo a line; double-click to toggle. Scroll to zoom.
        </p>
      </div>

      {/* What If PCT Slider */}
      <div className="rounded-lg border p-4 space-y-2">
        <Label className="text-sm font-medium">What If PCT Simulation (Educational)</Label>
        <p className="text-xs text-muted-foreground">
          Simulate how hormone recovery might shift with PCT support—often discussed in forums. Not medical advice.
        </p>
        <div className="flex items-center gap-4">
          <Slider
            value={[pctSimulation]}
            onValueChange={([v]) => setPctSimulation(v ?? 0)}
            max={100}
            step={1}
            className="flex-1"
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPctSimulation(0)}
            disabled={pctSimulation === 0}
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          {pctSimulation === 0 ? 'Baseline (no simulation)' : `+${Math.round((pctSimulation / 100) * 15)}% hormone recovery boost (educational)`}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={handleExportPng} disabled={!!exporting}>
          {exporting === 'png' ? 'Exporting...' : <><FileImage className="h-4 w-4 mr-2" />Export PNG</>}
        </Button>
        <Button variant="outline" size="sm" onClick={handleExportPdf} disabled={!!exporting}>
          {exporting === 'pdf' ? 'Exporting...' : <><Download className="h-4 w-4 mr-2" />Export PDF</>}
        </Button>
      </div>

      {graphData?.harshRealityNote && (
        <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-sm">{graphData.harshRealityNote}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-lg border p-4 space-y-2">
          <h4 className="font-semibold text-sm">Order Bloodwork</h4>
          <p className="text-sm text-muted-foreground">
            Monitor recovery with lab panels. Educational resource for tracking markers.
          </p>
          <Button variant="outline" size="sm" asChild>
            <a href={TELEHEALTH_PARTNERS.quest} target="_blank" rel="noopener noreferrer">
              Order bloodwork (Quest)
              <ExternalLink className="h-3 w-3 ml-1" />
            </a>
          </Button>
        </div>
        <div className="rounded-lg border p-4 space-y-2">
          <h4 className="font-semibold text-sm">Telehealth Consult</h4>
          <p className="text-sm text-muted-foreground">
            Discuss recovery with a healthcare professional. Not medical advice.
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <a href={TELEHEALTH_PARTNERS.hims} target="_blank" rel="noopener noreferrer">
                Telehealth (Hims)
                <ExternalLink className="h-3 w-3 ml-1" />
              </a>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href={TELEHEALTH_PARTNERS.letsGetChecked} target="_blank" rel="noopener noreferrer">
                LetsGetChecked
                <ExternalLink className="h-3 w-3 ml-1" />
              </a>
            </Button>
          </div>
        </div>
      </div>

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription className="text-sm">
          <strong>Educational Visualization Only:</strong> This timeline represents generalized recovery patterns commonly discussed in health optimization communities. Individual recovery timelines vary dramatically. Timelines may vary by ester (short-acting often faster vs long-acting). Physician verify.
        </AlertDescription>
      </Alert>
    </div>
  )
}
