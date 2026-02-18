'use client'

interface ReportSummary {
  id: string
  report_date: string
  highlights: string[]
  lab_source?: string | null
  location?: string | null
  other_metadata?: Record<string, unknown> | null
}

interface HistoryTimelineProps {
  reports: ReportSummary[]
  selectedReportIds: Set<string>
  onToggleReport: (id: string) => void
}

export function HistoryTimeline({
  reports,
  selectedReportIds,
  onToggleReport,
}: HistoryTimelineProps) {
  if (reports.length === 0) return null

  return (
    <div className="flex flex-wrap gap-3">
      {[...reports].reverse().map((r) => {
        const isSelected = selectedReportIds.has(r.id)
        const hasMeta = r.lab_source || r.location
        return (
          <button
            key={r.id}
            type="button"
            onClick={() => onToggleReport(r.id)}
            className={`flex flex-col items-start rounded-lg border px-4 py-3 text-left transition-colors min-w-[160px] ${
              isSelected
                ? 'border-cyan-500 bg-cyan-500/10 dark:bg-cyan-500/20'
                : 'border-muted hover:bg-muted/50'
            }`}
          >
            <span className="font-medium text-foreground">{r.report_date}</span>
            {hasMeta && (
              <span className="text-xs text-cyan-600 dark:text-cyan-400 mt-1">
                {[r.lab_source, r.location].filter(Boolean).join(' • ')}
              </span>
            )}
            {r.highlights?.[0] && (
              <span className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {r.highlights[0]}
              </span>
            )}
            <span className="text-xs mt-2 text-cyan-600 dark:text-cyan-400">
              {isSelected ? '✓ Selected' : 'Click to select'}
            </span>
          </button>
        )
      })}
    </div>
  )
}
