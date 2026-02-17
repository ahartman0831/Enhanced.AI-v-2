'use client'

import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Zap, AlertTriangle } from 'lucide-react'

interface AnalyzeButtonProps {
  onAnalyze: () => void
  isAnalyzing: boolean
  disabled?: boolean
  photosCount: number
  requiredPhotos?: number
}

export function AnalyzeButton({
  onAnalyze,
  isAnalyzing,
  disabled = false,
  photosCount,
  requiredPhotos = 3
}: AnalyzeButtonProps) {
  const canAnalyze = photosCount >= requiredPhotos && !disabled

  return (
    <div className="space-y-4">
      {/* Analysis Requirements */}
      {!canAnalyze && photosCount < requiredPhotos && (
        <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Analysis Requirements:</strong> Please upload all {requiredPhotos} required photos
            (front, side, and back views) before analysis can begin.
          </AlertDescription>
        </Alert>
      )}

      {/* Analysis Info */}
      <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800">
        <Zap className="h-4 w-4" />
        <AlertDescription>
          <strong>AI-Powered Analysis:</strong> Our educational analysis uses advanced computer vision
          to provide insights about body composition, symmetry, and progress indicators.
          Results are for educational purposes only.
        </AlertDescription>
      </Alert>

      {/* Analyze Button */}
      <div className="flex justify-center">
        <Button
          onClick={onAnalyze}
          disabled={!canAnalyze || isAnalyzing}
          size="lg"
          className="px-8 py-6 text-lg"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="h-5 w-5 mr-3 animate-spin" />
              Analyzing Photos...
              <br />
              <span className="text-sm opacity-75">
                This may take 30-60 seconds
              </span>
            </>
          ) : (
            <>
              <Zap className="h-5 w-5 mr-3" />
              Start AI Analysis
              <br />
              <span className="text-sm opacity-75">
                Analyze body composition & progress
              </span>
            </>
          )}
        </Button>
      </div>

      {/* Processing Info */}
      {isAnalyzing && (
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <div className="animate-pulse">●</div>
            <div className="animate-pulse" style={{ animationDelay: '0.2s' }}>●</div>
            <div className="animate-pulse" style={{ animationDelay: '0.4s' }}>●</div>
          </div>
          <p className="text-sm text-muted-foreground">
            Processing images with AI vision analysis...
          </p>
        </div>
      )}

      {/* Cost Info */}
      <div className="text-center">
        <p className="text-xs text-muted-foreground">
          Analysis uses AI tokens • Results saved to your profile
        </p>
      </div>
    </div>
  )
}