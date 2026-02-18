'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  GitCompareArrows,
  Calendar,
  TrendingUp,
  AlertTriangle,
  Eye,
  EyeOff
} from 'lucide-react'

interface PhotoEntry {
  id: string
  created_at: string
  front_url?: string
  side_url?: string
  back_url?: string
  analysis?: any
}

interface ComparisonViewerProps {
  currentPhotos: {
    front?: { file: File; preview: string; type: string }
    side?: { file: File; preview: string; type: string }
    back?: { file: File; preview: string; type: string }
  }
  previousEntries?: PhotoEntry[]
}

export function ComparisonViewer({ currentPhotos, previousEntries = [] }: ComparisonViewerProps) {
  const [selectedComparison, setSelectedComparison] = useState<PhotoEntry | null>(null)
  const [comparisonMode, setComparisonMode] = useState<'split' | 'overlay'>('split')
  const [splitPosition, setSplitPosition] = useState([50])
  const [opacity, setOpacity] = useState([50])
  const [viewMode, setViewMode] = useState<'front' | 'side' | 'back'>('front')

  const availableComparisons = previousEntries.filter(entry =>
    entry.front_url || entry.side_url || entry.back_url
  )

  const getCurrentPhotoUrl = (view: 'front' | 'side' | 'back') => {
    return currentPhotos[view]?.preview
  }

  const getComparisonPhotoUrl = (view: 'front' | 'side' | 'back') => {
    if (!selectedComparison) return null

    switch (view) {
      case 'front': return selectedComparison.front_url
      case 'side': return selectedComparison.side_url
      case 'back': return selectedComparison.back_url
      default: return null
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (availableComparisons.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitCompareArrows className="h-5 w-5" />
            Progress Comparison
          </CardTitle>
          <CardDescription>
            Compare your current photos with previous entries
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <Calendar className="h-4 w-4" />
            <AlertDescription>
              <strong>No Previous Photos:</strong> This is your first photo entry.
              Future analyses will include comparison features to track your progress over time.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GitCompareArrows className="h-5 w-5" />
          Progress Comparison
        </CardTitle>
        <CardDescription>
          Compare your current photos with previous entries to track progress
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Comparison Selection */}
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Select Previous Entry to Compare:
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {availableComparisons.map((entry) => (
                <Button
                  key={entry.id}
                  variant={selectedComparison?.id === entry.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedComparison(entry)}
                  className="justify-start h-auto p-3"
                >
                  <div className="text-left">
                    <div className="font-medium">
                      {formatDate(entry.created_at)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {entry.analysis ? 'Analyzed' : 'Not analyzed'}
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </div>
        </div>

        {selectedComparison && (
          <>
            {/* View Mode Selection */}
            <div className="flex flex-wrap gap-2">
              {(['front', 'side', 'back'] as const).map((view) => {
                const currentUrl = getCurrentPhotoUrl(view)
                const comparisonUrl = getComparisonPhotoUrl(view)

                if (!currentUrl || !comparisonUrl) return null

                return (
                  <Button
                    key={view}
                    variant={viewMode === view ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode(view)}
                    className="capitalize"
                  >
                    {view} View
                  </Button>
                )
              })}
            </div>

            {/* Comparison Controls */}
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex gap-2">
                <Button
                  variant={comparisonMode === 'split' ? "default" : "outline"}
                  size="sm"
                  onClick={() => setComparisonMode('split')}
                >
                  Split View
                </Button>
                <Button
                  variant={comparisonMode === 'overlay' ? "default" : "outline"}
                  size="sm"
                  onClick={() => setComparisonMode('overlay')}
                >
                  Overlay
                </Button>
              </div>

              {comparisonMode === 'split' && (
                <div className="flex items-center gap-2 min-w-[200px]">
                  <span className="text-sm">Split:</span>
                  <Slider
                    value={splitPosition}
                    onValueChange={setSplitPosition}
                    max={100}
                    step={1}
                    className="flex-1"
                  />
                  <span className="text-sm w-12">{splitPosition[0]}%</span>
                </div>
              )}

              {comparisonMode === 'overlay' && (
                <div className="flex items-center gap-2 min-w-[200px]">
                  <span className="text-sm">Opacity:</span>
                  <Slider
                    value={opacity}
                    onValueChange={setOpacity}
                    max={100}
                    step={1}
                    className="flex-1"
                  />
                  <span className="text-sm w-12">{opacity[0]}%</span>
                </div>
              )}
            </div>

            {/* Comparison Display */}
            <div className="relative border rounded-lg overflow-hidden bg-muted/20">
              <div className="relative w-full h-96">
                {/* Current Photo (Base Layer) */}
                {getCurrentPhotoUrl(viewMode) && (
                  <img
                    src={getCurrentPhotoUrl(viewMode)}
                    alt={`Current ${viewMode} view`}
                    className="absolute inset-0 w-full h-full object-contain"
                  />
                )}

                {/* Comparison Photo */}
                {getComparisonPhotoUrl(viewMode) && (
                  <>
                    {comparisonMode === 'split' ? (
                      <img
                        src={getComparisonPhotoUrl(viewMode)!}
                        alt={`Previous ${viewMode} view`}
                        className="absolute inset-0 w-full h-full object-contain"
                        style={{
                          clipPath: `inset(0 ${100 - splitPosition[0]}% 0 0)`
                        }}
                      />
                    ) : (
                      <img
                        src={getComparisonPhotoUrl(viewMode)!}
                        alt={`Previous ${viewMode} view`}
                        className="absolute inset-0 w-full h-full object-contain"
                        style={{
                          opacity: opacity[0] / 100
                        }}
                      />
                    )}

                    {/* Split Line Indicator */}
                    {comparisonMode === 'split' && (
                      <div
                        className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg z-10"
                        style={{ left: `${splitPosition[0]}%` }}
                      >
                        <div className="absolute -top-1 -left-1 w-3 h-3 bg-white rounded-full shadow"></div>
                        <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-white rounded-full shadow"></div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Labels */}
              <div className="absolute top-2 left-2">
                <Badge variant="secondary" className="bg-black/70 text-white border-0">
                  <Eye className="h-3 w-3 mr-1" />
                  Current
                </Badge>
              </div>

              {getComparisonPhotoUrl(viewMode) && (
                <div className={`absolute top-2 ${comparisonMode === 'split' ? 'right-2' : 'left-20'}`}>
                  <Badge variant="secondary" className="bg-white/90 text-black border-0">
                    <EyeOff className="h-3 w-3 mr-1" />
                    {formatDate(selectedComparison.created_at)}
                  </Badge>
                </div>
              )}
            </div>

            {/* Comparison Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                <h4 className="font-semibold mb-2 text-green-800 dark:text-green-200">
                  Current Session
                </h4>
                <p className="text-sm text-green-700 dark:text-green-300">
                  {formatDate(new Date().toISOString())}
                </p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                  New analysis in progress
                </p>
              </div>

              <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                <h4 className="font-semibold mb-2 text-blue-800 dark:text-blue-200">
                  Comparison Session
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  {formatDate(selectedComparison.created_at)}
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  {selectedComparison.analysis ? 'Analysis available' : 'No analysis'}
                </p>
              </div>
            </div>

            {/* Educational Note */}
            <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800">
              <TrendingUp className="h-4 w-4" />
              <AlertDescription className="text-sm">
                <strong>Educational Comparison:</strong> Visual comparison can help identify progress patterns,
                but accurate body composition assessment requires professional tools like DEXA scans or caliper measurements.
                Always combine visual assessment with quantitative measurements for comprehensive progress tracking.
              </AlertDescription>
            </Alert>
          </>
        )}
      </CardContent>
    </Card>
  )
}