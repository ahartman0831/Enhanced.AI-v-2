'use client'

import { useState, useEffect, useMemo } from 'react'
import { TierGate } from '@/components/TierGate'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import {
  History,
  Loader2,
  AlertTriangle,
  ExternalLink,
  FileText,
  BarChart3,
  Sparkles,
  ChevronDown,
  ChevronUp,
  List,
} from 'lucide-react'
import { getTrendIndicator } from '@/lib/bloodwork-trend-indicators'
import { splitByPriority } from '@/lib/bloodwork-prioritized'
import { TELEHEALTH_PARTNERS, getAffiliateDisclosure, generateAmazonAffiliateLink } from '@/lib/affiliates'
import { HistoryTimeline } from '@/components/bloodwork/HistoryTimeline'
import { MarkerTrendCard } from '@/components/bloodwork/MarkerTrendCard'
import { AnalyzeButton } from '@/components/bloodwork/AnalyzeButton'
import { TrendGraph } from '@/components/bloodwork/TrendGraph'

interface ReportSummary {
  id: string
  report_date: string
  highlights: string[]
  lab_source?: string | null
  location?: string | null
  other_metadata?: Record<string, unknown> | null
}

interface MarkerSeries {
  marker: string
  dataPoints: Array<{ date: string; value: string; numericValue?: number }>
  trend: 'up' | 'down' | 'stable'
}

interface BloodworkHistoryData {
  reports: ReportSummary[]
  series: MarkerSeries[]
  flaggedMarkers?: string[]
  disclaimer: string
}

interface MarkerInsight {
  marker: string
  trend: string
  laymanWhatItIs?: string
  laymanWhyMonitor?: string
  observationalRisk?: string
  commonlyDiscussedSupports?: string
  amazonProductHint?: string
}

interface AnalysisResult {
  trendSummary?: string
  patternNotes?: string[]
  markerInsights?: MarkerInsight[]
  disclaimer?: string
}

export default function BloodworkHistoryPage() {
  const [data, setData] = useState<BloodworkHistoryData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedReportIds, setSelectedReportIds] = useState<Set<string>>(new Set())
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisError, setAnalysisError] = useState<string | null>(null)
  const [showAnalysisSection, setShowAnalysisSection] = useState(true)

  const selectedDates = useMemo(() => {
    if (!data?.reports) return new Set<string>()
    return new Set(
      data.reports
        .filter((r) => selectedReportIds.has(r.id))
        .map((r) => (typeof r.report_date === 'string' ? r.report_date.split('T')[0] : String(r.report_date)))
    )
  }, [data?.reports, selectedReportIds])

  const filteredSeries = useMemo(() => {
    if (!data?.series || selectedDates.size === 0) return []
    return data.series.map((s) => {
      const pts = s.dataPoints.filter((p) => selectedDates.has(p.date))
      if (pts.length === 0) return null
      const sorted = [...pts].sort((a, b) => a.date.localeCompare(b.date))
      const first = sorted[0].numericValue
      const last = sorted[sorted.length - 1].numericValue
      let trend: 'up' | 'down' | 'stable' = 'stable'
      if (sorted.length >= 2 && first != null && last != null) {
        const diff = last - first
        if (Math.abs(diff) > 0.01) trend = diff > 0 ? 'up' : 'down'
      }
      return { ...s, dataPoints: sorted, trend }
    }).filter(Boolean) as MarkerSeries[]
  }, [data?.series, selectedDates])

  const { prioritized, other } = useMemo(() => {
    if (!filteredSeries.length) return { prioritized: [], other: [] }
    return splitByPriority(filteredSeries, data?.flaggedMarkers || [])
  }, [filteredSeries, data?.flaggedMarkers])

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch('/api/bloodwork-history', { cache: 'no-store' })
        const json = await res.json()
        if (!res.ok) throw new Error(json.error || 'Failed to fetch')
        setData(json)
        if (json.reports?.length > 0) {
          setSelectedReportIds(new Set(json.reports.slice(-5).map((r: ReportSummary) => r.id)))
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load bloodwork history')
      } finally {
        setLoading(false)
      }
    }
    fetchHistory()
  }, [])

  const toggleReport = (id: string) => {
    setSelectedReportIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else if (next.size < 5) next.add(id)
      return next
    })
  }

  const handleAnalyzeClick = async () => {
    setIsAnalyzing(true)
    setAnalysisError(null)
    try {
      const res = await fetch('/api/bloodwork-history/analyze', { method: 'POST' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Analysis failed')
      setAnalysisResult(json)
      setShowAnalysisSection(true)
    } catch (err) {
      setAnalysisError(err instanceof Error ? err.message : 'Analysis failed')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const flaggedSet = useMemo(
    () => new Set((data?.flaggedMarkers || []).map((m) => m.toLowerCase().trim())),
    [data?.flaggedMarkers]
  )

  if (loading) {
    return (
      <TierGate>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-10 w-10 animate-spin text-cyan-500" />
          </div>
        </div>
      </div>
      </TierGate>
    )
  }

  if (error) {
    return (
      <TierGate>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      </div>
      </TierGate>
    )
  }

  if (!data || (data.reports.length === 0 && data.series.length === 0)) {
    return (
      <TierGate>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <History className="h-8 w-8 text-cyan-500" />
            Bloodwork History
          </h1>
          <p className="text-muted-foreground mb-8">
            Track your blood markers over time. Educational visualization only—not medical advice.
          </p>
          <Card className="border-cyan-500/20">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <BarChart3 className="h-16 w-16 text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">No bloodwork history yet</h2>
              <p className="text-muted-foreground mb-6 max-w-md">
                Upload your first bloodwork to start tracking trends. Analyze results in the Bloodwork Parser to build your history.
              </p>
              <Button asChild>
                <Link href="/bloodwork-parser">
                  <FileText className="h-4 w-4 mr-2" />
                  Go to Bloodwork Parser
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
      </TierGate>
    )
  }

  return (
    <TierGate>
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <History className="h-8 w-8 text-cyan-500" />
            Bloodwork History
          </h1>
          <p className="text-muted-foreground">
            Track your blood markers over time. Educational visualization only—not medical advice.
          </p>
        </div>

        <Alert className="border-cyan-500/30 bg-cyan-500/5 dark:bg-cyan-950/20">
          <AlertTriangle className="h-4 w-4 text-cyan-600" />
          <AlertDescription>
            <strong>Educational visualization only. Not medical advice. Consult physician.</strong> Green ↑: Often associated with positive patterns in forums. Red ↓: May correlate with risk patterns in literature—variability high.
          </AlertDescription>
        </Alert>

        {/* Analyze Trends with AI – user-initiated only */}
        <Card className="border-cyan-500/30 bg-cyan-500/5 dark:bg-cyan-950/20">
          <CardContent className="flex flex-col sm:flex-row items-center justify-between gap-4 py-6">
            <div>
              <h3 className="font-semibold text-foreground">Get AI Insights on Patterns, Risks & Mitigations</h3>
              <p className="text-sm text-muted-foreground mt-1">
                User-initiated analysis. No automatic AI calls on page load.
              </p>
            </div>
            <AnalyzeButton
              onClick={handleAnalyzeClick}
              disabled={isAnalyzing || data.series.length === 0}
              isAnalyzing={isAnalyzing}
              hasResults={!!analysisResult}
              title={data.series.length === 0 ? 'Add bloodwork with markers to analyze trends' : undefined}
            />
          </CardContent>
        </Card>

        {analysisError && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{analysisError}</AlertDescription>
          </Alert>
        )}

        {/* AI Analysis Results */}
        {analysisResult && showAnalysisSection && (
          <Card className="border-cyan-500/30 bg-cyan-500/5 dark:bg-cyan-950/20">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-cyan-700 dark:text-cyan-300">
                  <Sparkles className="h-5 w-5" />
                  AI Trend Analysis
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAnalysisSection((v) => !v)}
                  className="text-muted-foreground"
                >
                  {showAnalysisSection ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </div>
              <CardDescription>
                Educational insights from your bloodwork trends. Not medical advice.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className="border-amber-500/50 bg-amber-500/10 dark:bg-amber-950/30">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Educational only—not medical advice.</strong> Consult a physician for interpretation.
                </AlertDescription>
              </Alert>

              {analysisResult.trendSummary && (
                <div>
                  <h4 className="font-medium mb-2">Trend Summary</h4>
                  <p className="text-sm text-muted-foreground">{analysisResult.trendSummary}</p>
                </div>
              )}

              {analysisResult.patternNotes?.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Observational Pattern Notes</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {analysisResult.patternNotes.map((note, i) => (
                      <li key={i}>• {note}</li>
                    ))}
                  </ul>
                </div>
              )}

              {analysisResult.markerInsights?.length > 0 && (
                <div>
                  <h4 className="font-medium mb-3">Marker Insights & Commonly Discussed Supports</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {analysisResult.markerInsights.map((insight, i) => (
                      <Card key={i} className="border-cyan-500/10">
                        <CardContent className="pt-4 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{insight.marker}</span>
                            <span className={`text-xs px-2 py-0.5 rounded ${
                              insight.trend === 'up' ? 'bg-amber-500/20' : insight.trend === 'down' ? 'bg-cyan-500/20' : 'bg-muted'
                            }`}>
                              {insight.trend === 'up' ? '↑' : insight.trend === 'down' ? '↓' : '→'}
                            </span>
                          </div>
                          {insight.laymanWhatItIs && (
                            <p className="text-xs"><strong>What it is:</strong> {insight.laymanWhatItIs}</p>
                          )}
                          {insight.laymanWhyMonitor && (
                            <p className="text-xs"><strong>Why monitor:</strong> {insight.laymanWhyMonitor}</p>
                          )}
                          {insight.observationalRisk && (
                            <p className="text-xs text-amber-700 dark:text-amber-400 italic">{insight.observationalRisk}</p>
                          )}
                          {insight.commonlyDiscussedSupports && (
                            <p className="text-xs text-muted-foreground">{insight.commonlyDiscussedSupports}</p>
                          )}
                          {insight.amazonProductHint && (
                            <Button variant="outline" size="sm" className="mt-2" asChild>
                              <a href={generateAmazonAffiliateLink(insight.amazonProductHint)} target="_blank" rel="noopener noreferrer">
                                Explore {insight.amazonProductHint} <ExternalLink className="h-3 w-3 ml-1" />
                              </a>
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-2 pt-2">
                <Button variant="outline" size="sm" asChild>
                  <a href={TELEHEALTH_PARTNERS.quest} target="_blank" rel="noopener noreferrer">
                    Quest Diagnostics <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <a href={TELEHEALTH_PARTNERS.letsGetChecked} target="_blank" rel="noopener noreferrer">
                    LetsGetChecked <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                </Button>
              </div>
              <p className="text-xs text-muted-foreground italic">{analysisResult.disclaimer}</p>
              <p className="text-xs text-muted-foreground">{getAffiliateDisclosure()}</p>
            </CardContent>
          </Card>
        )}

        {/* Timeline */}
        {data.reports.length > 0 && (
          <Card className="border-cyan-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">Test Timeline</CardTitle>
              <CardDescription>
                Select 2–5 tests to compare. Click to toggle.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <HistoryTimeline
                reports={data.reports}
                selectedReportIds={selectedReportIds}
                onToggleReport={toggleReport}
              />
              <p className="text-xs text-muted-foreground mt-3 italic">
                Extracted metadata for organizational purposes only—verify with professionals.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Major + Flagged Markers – sparklines + trend arrows only */}
        {prioritized.length > 0 && (
          <Card className="border-cyan-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">Major & Flagged Markers</CardTitle>
              <CardDescription>
                Key markers with trend indicators. Educational only—not medical advice.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {prioritized.map((s) => {
                  const latest = s.dataPoints[s.dataPoints.length - 1]
                  const isFlagged = flaggedSet.has(s.marker.toLowerCase().trim())
                  return (
                    <MarkerTrendCard
                      key={s.marker}
                      marker={s.marker}
                      latestValue={latest?.value ?? '—'}
                      trend={s.trend}
                      dataPoints={s.dataPoints}
                      isFlagged={isFlagged}
                    />
                  )
                })}
              </div>
              <p className="text-xs text-muted-foreground italic mt-4">{data.disclaimer}</p>
            </CardContent>
          </Card>
        )}

        {/* Full interactive graph in AI section – show when analysis run */}
        {analysisResult && prioritized.length > 0 && (
          <Card className="border-cyan-500/20">
            <CardHeader>
              <CardTitle>Trend Graphs (Full)</CardTitle>
              <CardDescription>
                Interactive charts for major markers. One chart per marker.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TrendGraph
                series={prioritized}
                selectedMarkers={prioritized.map((s) => s.marker)}
                height={220}
              />
            </CardContent>
          </Card>
        )}

        {/* View All Markers – raw table, no graphs */}
        {other.length > 0 && (
          <Card className="border-cyan-500/20">
            <Accordion type="single" collapsible>
              <AccordionItem value="all-markers" className="border-none">
                <AccordionTrigger className="py-4 hover:no-underline">
                  <span className="flex items-center gap-2">
                    <List className="h-4 w-4 text-cyan-500" />
                    View All Markers ({other.length} additional)
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <p className="text-xs text-muted-foreground mb-4">
                    Raw list only—no graphs. Educational visualization only—not medical advice.
                  </p>
                  <div className="overflow-x-auto rounded-lg border">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="text-left px-4 py-2 font-medium">Marker</th>
                          <th className="text-left px-4 py-2 font-medium">Latest</th>
                          <th className="text-left px-4 py-2 font-medium">Trend</th>
                        </tr>
                      </thead>
                      <tbody>
                        {other.map((s) => {
                          const latest = s.dataPoints[s.dataPoints.length - 1]
                          const ind = getTrendIndicator(s.marker, s.trend)
                          return (
                            <tr key={s.marker} className="border-b last:border-0">
                              <td className="px-4 py-2">{s.marker}</td>
                              <td className="px-4 py-2 text-muted-foreground">{latest?.value ?? '—'}</td>
                              <td className="px-4 py-2">
                                <span className={`text-xs ${ind.type === 'positive' ? 'text-green-600' : ind.type === 'risk' ? 'text-red-600' : 'text-muted-foreground'}`}>
                                  {s.trend === 'up' ? '↑' : s.trend === 'down' ? '↓' : '→'}
                                </span>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </Card>
        )}

        {/* Affiliate CTAs */}
        <Card className="border-cyan-500/20 bg-cyan-500/5 dark:bg-cyan-950/20">
          <CardHeader>
            <CardTitle>Order Your Next Panel</CardTitle>
            <CardDescription>
              Track changes over time. Affiliate links support development.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button variant="outline" asChild>
              <a href={TELEHEALTH_PARTNERS.quest} target="_blank" rel="noopener noreferrer">
                Quest Diagnostics <ExternalLink className="h-4 w-4 ml-2" />
              </a>
            </Button>
            <Button variant="outline" asChild>
              <a href={TELEHEALTH_PARTNERS.letsGetChecked} target="_blank" rel="noopener noreferrer">
                LetsGetChecked <ExternalLink className="h-4 w-4 ml-2" />
              </a>
            </Button>
          </CardContent>
          <p className="text-xs text-muted-foreground px-6 pb-4">{getAffiliateDisclosure()}</p>
        </Card>

        <div className="flex justify-center">
          <Button variant="outline" asChild>
            <Link href="/bloodwork-parser">
              <FileText className="h-4 w-4 mr-2" />
              Analyze New Bloodwork
            </Link>
          </Button>
        </div>
      </div>
    </div>
    </TierGate>
  )
}
