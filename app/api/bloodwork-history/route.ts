import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { getSubscriptionTier, requireTier } from '@/lib/subscription-gate'
import {
  extractMarkersFromReport,
  aggregateMarkerSeries,
  type MarkerSeries,
} from '@/lib/bloodwork-history'

export const dynamic = 'force-dynamic'

/** Lightweight fetch: no AI call. Returns reports + series only. */
export async function GET() {
  try {
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const tier = await getSubscriptionTier(supabase, user.id)
    const gate = requireTier(tier, 'elite')
    if (!gate.allowed) {
      return gate.response
    }

    const { data: reports, error: fetchError } = await supabase
      .from('bloodwork_reports')
      .select('id, report_date, raw_json, lab_source, location, other_metadata')
      .eq('user_id', user.id)
      .order('report_date', { ascending: true })

    if (fetchError) {
      console.error('[BloodworkHistory] Fetch error:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch bloodwork history' }, { status: 500 })
    }

    if (!reports || reports.length === 0) {
      return NextResponse.json({
        reports: [],
        series: [],
        disclaimer:
          'Educational only—not medical advice. Individual variability high. Consult a physician.',
      })
    }

    const reportsList = reports.map((r) => {
      const raw = r.raw_json as Record<string, unknown> | null
      const highlights: string[] = []
      if (raw?.analysisSummary && typeof raw.analysisSummary === 'object') {
        const summary = raw.analysisSummary as { keyObservations?: string[] }
        if (Array.isArray(summary.keyObservations)) {
          highlights.push(...summary.keyObservations.slice(0, 3))
        }
      }
      if (raw?.flags && Array.isArray(raw.flags)) {
        const flags = raw.flags as Array<{ description?: string }>
        highlights.push(...flags.slice(0, 2).map((f) => f.description || '').filter(Boolean))
      }
      const reportDate = typeof r.report_date === 'string' ? r.report_date.split('T')[0] : String(r.report_date)
      return {
        id: r.id,
        report_date: reportDate,
        highlights: highlights.slice(0, 3),
        lab_source: (r as { lab_source?: string | null }).lab_source ?? null,
        location: (r as { location?: string | null }).location ?? null,
        other_metadata: (r as { other_metadata?: Record<string, unknown> | null }).other_metadata ?? null,
      }
    })

    const reportMarkers = reports.map((r) =>
      extractMarkersFromReport(
        r.raw_json,
        r.id,
        typeof r.report_date === 'string' ? r.report_date.split('T')[0] : String(r.report_date)
      )
    )

    const series = aggregateMarkerSeries(reportMarkers)

    // Flagged markers from latest report (above_range / below_range)
    const latestRaw = (reports[reports.length - 1]?.raw_json as Record<string, unknown>) || {}
    const markerAnalysis = Array.isArray(latestRaw.markerAnalysis)
      ? latestRaw.markerAnalysis
      : Array.isArray(latestRaw.marker_analysis)
        ? latestRaw.marker_analysis
        : []
    const flaggedMarkers: string[] = []
    for (const m of markerAnalysis) {
      if (m && typeof m === 'object' && 'status' in m && 'marker' in m) {
        const status = (m as { status?: string }).status
        if (status === 'above_range' || status === 'below_range') {
          flaggedMarkers.push(String((m as { marker: string }).marker).trim())
        }
      }
    }

    return NextResponse.json({
      reports: reportsList,
      series: series as MarkerSeries[],
      flaggedMarkers,
      disclaimer:
        'Educational only—not medical advice. Green ↑: Often associated with positive patterns in forums. Red ↓: May correlate with risk patterns in literature—variability high. Individual responses vary. Consult a physician.',
    })
  } catch (error) {
    console.error('[BloodworkHistory] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
