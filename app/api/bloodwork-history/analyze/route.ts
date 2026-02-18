import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { callGrok } from '@/lib/grok'
import {
  extractMarkersFromReport,
  aggregateMarkerSeries,
} from '@/lib/bloodwork-history'

export const dynamic = 'force-dynamic'

/** User-initiated AI analysis. No auto-call on page load. */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { data: reports, error: fetchError } = await supabase
      .from('bloodwork_reports')
      .select('id, report_date, raw_json')
      .eq('user_id', user.id)
      .order('report_date', { ascending: true })

    if (fetchError) {
      console.error('[BloodworkHistoryAnalyze] Fetch error:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch bloodwork history' }, { status: 500 })
    }

    if (!reports || reports.length === 0) {
      return NextResponse.json({
        error: 'No bloodwork history to analyze',
      }, { status: 400 })
    }

    const reportMarkers = reports.map((r) =>
      extractMarkersFromReport(
        r.raw_json,
        r.id,
        typeof r.report_date === 'string' ? r.report_date.split('T')[0] : String(r.report_date)
      )
    )

    const series = aggregateMarkerSeries(reportMarkers)

    if (series.length === 0) {
      return NextResponse.json({
        error: 'No marker series to analyze',
      }, { status: 400 })
    }

    const seriesForPrompt = series.map((s) => ({
      marker: s.marker,
      trend: s.trend,
      points: s.dataPoints.length,
      latest: s.dataPoints[s.dataPoints.length - 1]?.value,
      history: s.dataPoints.map((p) => ({ date: p.date, value: p.value })),
    }))

    const prompt = `The user has bloodwork history with the following marker trends. Analyze and provide educational insights.

${JSON.stringify(seriesForPrompt, null, 2)}

Provide a JSON object with trendSummary, patternNotes (array), and markerInsights (array of objects with marker, trend, laymanWhatItIs, laymanWhyMonitor, observationalRisk, commonlyDiscussedSupports, amazonProductHint). Use ONLY community/literature framing. NEVER personalize. Include Quest/LetsGetChecked in patternNotes. Return ONLY valid JSON.`

    const grokResult = await callGrok({
      prompt,
      userId: user.id,
      feature: 'bloodwork-history-analyze',
    })

    if (!grokResult.success) {
      return NextResponse.json(
        { error: grokResult.error || 'AI analysis failed' },
        { status: 500 }
      )
    }

    const data = grokResult.data
    const patternNotes = Array.isArray(data?.patternNotes) ? data.patternNotes : []
    const trendSummary = typeof data?.trendSummary === 'string' ? data.trendSummary : ''
    const markerInsights = Array.isArray(data?.markerInsights) ? data.markerInsights : []

    return NextResponse.json({
      trendSummary,
      patternNotes,
      markerInsights,
      disclaimer:
        'Educational only—not medical advice. Individual variability high. Consult a physician.',
    })
  } catch (error) {
    console.error('[BloodworkHistoryAnalyze] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
