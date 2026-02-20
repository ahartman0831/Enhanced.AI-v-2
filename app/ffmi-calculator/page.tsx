'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  Calculator,
  AlertTriangle,
  Loader2,
  Sparkles,
  Ruler,
  Scale,
  Percent,
  Info,
  BarChart3,
} from 'lucide-react'
import {
  calculateFFMI,
  validateFFMIInputs,
  type FFMIInputs,
  type FFMIResult,
  type UnitSystem,
  INPUT_RANGES,
} from '@/lib/ffmi-utils'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from 'recharts'

const FFMI_STORAGE_KEY = 'ffmi_calculator_inputs'

/** Load saved inputs from localStorage */
function loadStoredInputs(): Partial<FFMIInputs> | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(FFMI_STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as Partial<FFMIInputs>
  } catch {
    return null
  }
}

/** Save inputs to localStorage */
function saveInputs(inputs: FFMIInputs) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(FFMI_STORAGE_KEY, JSON.stringify(inputs))
  } catch {
    // ignore
  }
}

/** FFMI interpretation tables (gender-specific) */
const MALE_INTERPRETATION = [
  { range: '17-18', bodyFat: '10-18%', desc: 'Skinny', enhanced: false },
  { range: '18-20', bodyFat: '20-27%', desc: 'Average', enhanced: false },
  { range: '19-21', bodyFat: '25-40%', desc: 'Fat', enhanced: false },
  { range: '20-21', bodyFat: '10-18%', desc: 'Athlete / Intermediate', enhanced: false },
  { range: '22-23', bodyFat: '6-12%', desc: 'Advanced gym user', enhanced: false },
  { range: '24-25', bodyFat: '8-20%', desc: 'Bodybuilder / Powerlifter', enhanced: false },
  { range: '26+', bodyFat: '—', desc: 'Elite / Pro (common on gear)', enhanced: true },
]

const FEMALE_INTERPRETATION = [
  { range: '14-15', bodyFat: '20-25%', desc: 'Skinny', enhanced: false },
  { range: '14-17', bodyFat: '22-35%', desc: 'Average', enhanced: false },
  { range: '15-18', bodyFat: '30-45%', desc: 'Fat', enhanced: false },
  { range: '16-17', bodyFat: '18-25%', desc: 'Athlete / Intermediate', enhanced: false },
  { range: '18-20', bodyFat: '15-22%', desc: 'Advanced gym user', enhanced: false },
  { range: '19-21', bodyFat: '15-30%', desc: 'Bodybuilder / Powerlifter', enhanced: false },
  { range: '21+', bodyFat: '—', desc: 'Elite (common in enhanced athletes)', enhanced: true },
]

/** Chart data: user FFMI vs benchmarks */
function getBenchmarkChartData(
  userHeightM: number,
  userFfmi: number,
  unitSystem: UnitSystem
): Array<{ label: string; value: number; type: string }> {
  const heightLabel =
    unitSystem === 'imperial'
      ? `${Math.floor(userHeightM / 0.3048)}'${Math.round(((userHeightM / 0.3048) % 1) * 12)}"`
      : `${Math.round(userHeightM * 100)} cm`
  return [
    { label: 'Natural limit (~25)', value: 25, type: 'benchmark' },
    { label: 'Enhanced (~27)', value: 27, type: 'benchmark' },
    { label: `Your FFMI (${heightLabel})`, value: userFfmi, type: 'user' },
  ]
}

export default function FFMICalculatorPage() {
  const [unitSystem, setUnitSystem] = useState<UnitSystem>('imperial')
  const [heightFt, setHeightFt] = useState<number>(5)
  const [heightIn, setHeightIn] = useState<number>(10)
  const [heightCm, setHeightCm] = useState<number>(178)
  const [weight, setWeight] = useState<number>(180)
  const [bodyFatPct, setBodyFatPct] = useState<number>(15)
  const [gender, setGender] = useState<'male' | 'female'>('male')
  const [result, setResult] = useState<FFMIResult | null>(null)
  const [warnings, setWarnings] = useState<Array<{ field: string; message: string }>>([])
  const [analysis, setAnalysis] = useState<string | null>(null)
  const [analysisLoading, setAnalysisLoading] = useState(false)
  const [analysisError, setAnalysisError] = useState<string | null>(null)

  // Pre-fill from profile and localStorage
  useEffect(() => {
    const stored = loadStoredInputs()
    const fetchProfile = async () => {
      try {
        const res = await fetch('/api/profile')
        if (res.ok) {
          const data = await res.json()
          if (data.weight_lbs != null) setWeight(data.weight_lbs)
          if (data.sex === 'female') setGender('female')
        }
      } catch {
        // ignore
      }
    }
    fetchProfile()

    if (stored) {
      if (stored.unitSystem) setUnitSystem(stored.unitSystem)
      if (stored.heightFt != null) setHeightFt(stored.heightFt)
      if (stored.heightIn != null) setHeightIn(stored.heightIn)
      if (stored.heightCm != null) setHeightCm(stored.heightCm)
      if (stored.weight != null) setWeight(stored.weight)
      if (stored.bodyFatPct != null) setBodyFatPct(stored.bodyFatPct)
    }
  }, [])

  const getInputs = useCallback((): FFMIInputs => {
    return {
      unitSystem,
      heightFt: unitSystem === 'imperial' ? heightFt : undefined,
      heightIn: unitSystem === 'imperial' ? heightIn : undefined,
      heightCm: unitSystem === 'metric' ? heightCm : undefined,
      weight,
      bodyFatPct,
    }
  }, [unitSystem, heightFt, heightIn, heightCm, weight, bodyFatPct])

  const handleCalculate = useCallback(() => {
    const inputs = getInputs()
    saveInputs(inputs)
    const res = calculateFFMI(inputs)
    setResult(res ?? null)
    setWarnings(validateFFMIInputs(inputs))
    setAnalysis(null)
    setAnalysisError(null)
  }, [getInputs])

  const handleGetAnalysis = useCallback(async () => {
    if (!result) return
    setAnalysisLoading(true)
    setAnalysisError(null)
    try {
      const inputs = getInputs()
      const heightDisplay =
        unitSystem === 'imperial'
          ? `${heightFt}'${heightIn}"`
          : `${heightCm} cm`
      const weightDisplay =
        unitSystem === 'imperial' ? `${weight} lbs` : `${weight} kg`
      const leanDisplay =
        unitSystem === 'imperial'
          ? `${result.leanWeight.toFixed(1)} lbs`
          : `${(result.leanWeightKg).toFixed(1)} kg`

      const res = await fetch('/api/ffmi-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gender,
          heightDisplay,
          weightDisplay,
          bodyFatPct,
          leanWeightDisplay: leanDisplay,
          ffmi: result.ffmi,
          normalizedFfmi: result.normalizedFfmi,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setAnalysisError(data.error || 'Analysis failed')
        return
      }
      setAnalysis(data.analysis)
    } catch (err: unknown) {
      setAnalysisError(err instanceof Error ? err.message : 'Request failed')
    } finally {
      setAnalysisLoading(false)
    }
  }, [result, getInputs, unitSystem, heightFt, heightIn, heightCm, weight, gender])

  const chartData =
    result && result.heightM > 0
      ? getBenchmarkChartData(result.heightM, result.normalizedFfmi, unitSystem)
      : []

  const chartMax = result
    ? Math.max(30, Math.ceil(result.normalizedFfmi) + 2)
    : 30

  const interpretationTable = gender === 'male' ? MALE_INTERPRETATION : FEMALE_INTERPRETATION

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
            <Calculator className="h-8 w-8 text-red-500" />
            FFMI Calculator
          </h1>
          <p className="text-zinc-400">
            Calculate your Fat-Free Mass Index and compare to natural and enhanced benchmarks.
          </p>
        </div>

        {/* Unit Toggle */}
        <div className="flex gap-2 mb-6" role="group" aria-label="Unit system">
          <Button
            variant={unitSystem === 'imperial' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setUnitSystem('imperial')}
            className={
              unitSystem === 'imperial'
                ? 'bg-red-600 hover:bg-red-700 border-red-600'
                : 'border-zinc-600 text-zinc-400 hover:bg-zinc-800'
            }
          >
            Imperial
          </Button>
          <Button
            variant={unitSystem === 'metric' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setUnitSystem('metric')}
            className={
              unitSystem === 'metric'
                ? 'bg-red-600 hover:bg-red-700 border-red-600'
                : 'border-zinc-600 text-zinc-400 hover:bg-zinc-800'
            }
          >
            Metric
          </Button>
        </div>

        {/* Inputs Card */}
        <Card className="mb-6 border-zinc-800 bg-zinc-900/50">
          <CardHeader>
            <CardTitle className="text-white">Your Measurements</CardTitle>
            <CardDescription className="text-zinc-400">
              Enter height, weight, and body fat percentage
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Height */}
            <div className="space-y-2">
              <Label htmlFor="height" className="flex items-center gap-2 text-zinc-300">
                <Ruler className="h-4 w-4" />
                Height
              </Label>
              {unitSystem === 'imperial' ? (
                <div className="flex gap-2 items-center">
                  <Input
                    id="height-ft"
                    type="number"
                    min={INPUT_RANGES.imperial.heightFt.min}
                    max={INPUT_RANGES.imperial.heightFt.max}
                    value={heightFt}
                    onChange={(e) => setHeightFt(Number(e.target.value) || 0)}
                    className="bg-zinc-800 border-zinc-700 text-white"
                    aria-label="Height feet"
                  />
                  <span className="text-zinc-500">ft</span>
                  <Input
                    id="height-in"
                    type="number"
                    min={INPUT_RANGES.imperial.heightIn.min}
                    max={INPUT_RANGES.imperial.heightIn.max}
                    value={heightIn}
                    onChange={(e) => setHeightIn(Number(e.target.value) || 0)}
                    className="bg-zinc-800 border-zinc-700 text-white"
                    aria-label="Height inches"
                  />
                  <span className="text-zinc-500">in</span>
                </div>
              ) : (
                <div className="flex gap-2 items-center">
                  <Input
                    id="height-cm"
                    type="number"
                    min={INPUT_RANGES.metric.heightCm.min}
                    max={INPUT_RANGES.metric.heightCm.max}
                    value={heightCm}
                    onChange={(e) => setHeightCm(Number(e.target.value) || 0)}
                    className="bg-zinc-800 border-zinc-700 text-white"
                    aria-label="Height centimeters"
                  />
                  <span className="text-zinc-500">cm</span>
                </div>
              )}
            </div>

            {/* Weight */}
            <div className="space-y-2">
              <Label htmlFor="weight" className="flex items-center gap-2 text-zinc-300">
                <Scale className="h-4 w-4" />
                Weight ({unitSystem === 'imperial' ? 'lbs' : 'kg'})
              </Label>
              <Input
                id="weight"
                type="number"
                step="0.1"
                min={unitSystem === 'imperial' ? INPUT_RANGES.imperial.weightLbs.min : INPUT_RANGES.metric.weightKg.min}
                max={unitSystem === 'imperial' ? INPUT_RANGES.imperial.weightLbs.max : INPUT_RANGES.metric.weightKg.max}
                value={weight}
                onChange={(e) => setWeight(Number(e.target.value) || 0)}
                className="bg-zinc-800 border-zinc-700 text-white"
                aria-label={`Weight in ${unitSystem === 'imperial' ? 'pounds' : 'kilograms'}`}
              />
            </div>

            {/* Body Fat */}
            <div className="space-y-2">
              <Label htmlFor="bodyfat" className="flex items-center gap-2 text-zinc-300">
                <Percent className="h-4 w-4" />
                Body Fat %
              </Label>
              <div className="flex gap-4 items-center">
                <Slider
                  id="bodyfat"
                  min={INPUT_RANGES.bodyFatPct.min}
                  max={INPUT_RANGES.bodyFatPct.max}
                  step={0.5}
                  value={[bodyFatPct]}
                  onValueChange={([v]) => setBodyFatPct(v)}
                  className="flex-1"
                  aria-label="Body fat percentage"
                />
                <Input
                  type="number"
                  min={0}
                  max={100}
                  step={0.1}
                  value={bodyFatPct}
                  onChange={(e) => setBodyFatPct(Number(e.target.value) || 0)}
                  className="w-20 bg-zinc-800 border-zinc-700 text-white"
                  aria-label="Body fat percentage number"
                />
              </div>
            </div>

            {/* Gender */}
            <div className="space-y-2">
              <Label htmlFor="gender" className="text-zinc-300">
                Gender (for interpretation)
              </Label>
              <div className="flex gap-2" role="group" aria-label="Gender">
                <Button
                  variant={gender === 'male' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setGender('male')}
                  className={
                    gender === 'male'
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'border-zinc-600 text-zinc-400'
                  }
                >
                  Male
                </Button>
                <Button
                  variant={gender === 'female' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setGender('female')}
                  className={
                    gender === 'female'
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'border-zinc-600 text-zinc-400'
                  }
                >
                  Female
                </Button>
              </div>
            </div>

            <Button
              onClick={handleCalculate}
              className="w-full bg-red-600 hover:bg-red-700 text-white"
              size="lg"
            >
              <Calculator className="h-4 w-4 mr-2" />
              Calculate
            </Button>
          </CardContent>
        </Card>

        {/* Warnings */}
        {warnings.length > 0 && (
          <Alert className="mb-6 border-amber-600/50 bg-amber-950/20">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <AlertDescription>
              {warnings.map((w) => (
                <p key={w.field} className="text-amber-200">
                  {w.message}
                </p>
              ))}
            </AlertDescription>
          </Alert>
        )}

        {/* Results */}
        {result && (
          <>
            <Card className="mb-6 border-zinc-800 bg-zinc-900/50">
              <CardHeader>
                <CardTitle className="text-white">Results</CardTitle>
                <CardDescription className="text-zinc-400">
                  Fat-Free Mass, FFMI, and Normalized FFMI
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="rounded-lg bg-zinc-800/80 p-4">
                    <p className="text-xs text-zinc-500 uppercase tracking-wider">Fat-Free Mass</p>
                    <p className="text-xl font-bold text-white">
                      {unitSystem === 'imperial'
                        ? `${result.leanWeight.toFixed(1)} lbs`
                        : `${result.leanWeightKg.toFixed(1)} kg`}
                    </p>
                  </div>
                  <div className="rounded-lg bg-zinc-800/80 p-4">
                    <p className="text-xs text-zinc-500 uppercase tracking-wider">Body Fat %</p>
                    <p className="text-xl font-bold text-white">{result.bodyFatPct.toFixed(1)}%</p>
                  </div>
                  <div className="rounded-lg bg-zinc-800/80 p-4">
                    <p className="text-xs text-zinc-500 uppercase tracking-wider">FFMI</p>
                    <p className="text-xl font-bold text-red-400">{result.ffmi.toFixed(2)}</p>
                  </div>
                  <div className="rounded-lg bg-zinc-800/80 p-4">
                    <p className="text-xs text-zinc-500 uppercase tracking-wider">Normalized FFMI</p>
                    <p className="text-xl font-bold text-red-400">{result.normalizedFfmi.toFixed(2)}</p>
                  </div>
                </div>

                <Button
                  onClick={handleGetAnalysis}
                  disabled={analysisLoading}
                  className="mt-4 w-full bg-red-600 hover:bg-red-700 text-white"
                >
                  {analysisLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Get AI Analysis
                    </>
                  )}
                </Button>

                {analysisError && (
                  <Alert className="mt-4 border-red-600/50 bg-red-950/20">
                    <AlertTriangle className="h-4 w-4 text-red-400" />
                    <AlertDescription className="text-red-200">{analysisError}</AlertDescription>
                  </Alert>
                )}

                {analysis && (
                  <div className="mt-4 p-4 rounded-lg bg-zinc-800/80 border border-zinc-700">
                    <p className="text-sm text-zinc-300 whitespace-pre-wrap">{analysis}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Chart */}
            <Card className="mb-6 border-zinc-800 bg-zinc-900/50">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-red-500" />
                  FFMI vs Height Benchmark
                </CardTitle>
                <CardDescription className="text-zinc-400">
                  Your normalized FFMI compared to natural (~25) and enhanced (~27) benchmarks by height
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={chartData}
                      layout="vertical"
                      margin={{ top: 10, right: 30, left: 100, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
                      <XAxis type="number" domain={[0, chartMax]} stroke="#71717a" fontSize={12} />
                      <YAxis type="category" dataKey="label" stroke="#71717a" fontSize={12} width={95} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#27272a', border: '1px solid #52525b' }}
                        labelStyle={{ color: '#a1a1aa' }}
                        formatter={(value: number) => [value.toFixed(2), 'FFMI']}
                      />
                      <ReferenceLine x={25} stroke="#22c55e" strokeDasharray="4 4" />
                      <ReferenceLine x={27} stroke="#f59e0b" strokeDasharray="4 4" />
                      <Bar dataKey="value" fill="#52525b" radius={[0, 2, 2, 0]}>
                        {chartData.map((entry, i) => (
                          <Cell
                            key={i}
                            fill={entry.type === 'user' ? '#ef4444' : entry.type === 'benchmark' ? '#71717a' : '#52525b'}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Interpretation Table */}
        <Card className="mb-6 border-zinc-800 bg-zinc-900/50">
          <CardHeader>
            <CardTitle className="text-white">
              FFMI Interpretation ({gender === 'male' ? 'Men' : 'Women'})
            </CardTitle>
            <CardDescription className="text-zinc-400">
              Reference ranges from ffmicalculator.org. FFMI 26+ common in pros on gear.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm" role="table" aria-label="FFMI interpretation">
                <thead>
                  <tr className="border-b border-zinc-700">
                    <th className="text-left py-2 text-zinc-400 font-medium">FFMI</th>
                    <th className="text-left py-2 text-zinc-400 font-medium">Body Fat</th>
                    <th className="text-left py-2 text-zinc-400 font-medium">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {interpretationTable.map((row, i) => (
                    <tr key={i} className="border-b border-zinc-800">
                      <td className="py-2 text-white">{row.range}</td>
                      <td className="py-2 text-zinc-300">{row.bodyFat}</td>
                      <td className="py-2 text-zinc-300">
                        {row.desc}
                        {row.enhanced && (
                          <span className="ml-1 text-amber-400 text-xs">(enhanced)</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Educational Accordion */}
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Info className="h-5 w-5 text-red-500" />
              Learn More
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="what" className="border-zinc-800">
                <AccordionTrigger className="text-zinc-300 hover:text-white">
                  What is FFMI?
                </AccordionTrigger>
                <AccordionContent className="text-zinc-400">
                  FFMI (Fat-Free Mass Index) measures muscle mass relative to height. It&apos;s used by
                  bodybuilders to compare themselves to others and is an alternative to BMI that
                  accounts for body composition. Unlike BMI, FFMI distinguishes between lean mass and
                  fat.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="formula" className="border-zinc-800">
                <AccordionTrigger className="text-zinc-300 hover:text-white">
                  Formulas
                </AccordionTrigger>
                <AccordionContent className="text-zinc-400 space-y-2">
                  <p>Total Body Fat = Weight × (body fat % / 100)</p>
                  <p>Lean Weight = Weight − Total Body Fat</p>
                  <p>FFMI = (Lean Weight in kg) / (Height in meters)²</p>
                  <p>
                    Normalized FFMI = FFMI + 6.3 × (1.8 − Height in meters) — adjusts for height
                    (reference 1.8m).
                  </p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="usage" className="border-zinc-800">
                <AccordionTrigger className="text-zinc-300 hover:text-white">
                  Usage Tips
                </AccordionTrigger>
                <AccordionContent className="text-zinc-400 space-y-2">
                  <ul className="list-disc list-inside space-y-1">
                    <li>Body fat % is best measured via DEXA, calipers, or a reliable scale.</li>
                    <li>Natural limit is ~25 for men, ~21 for women; 26+ often indicates enhancement.</li>
                    <li>Track trends over time rather than single readings.</li>
                    <li>Pair with bloodwork and progress photos for a fuller picture.</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
