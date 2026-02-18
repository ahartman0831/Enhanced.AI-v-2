'use client'

import { Button } from '@/components/ui/button'
import { Loader2, Sparkles } from 'lucide-react'

interface AnalyzeButtonProps {
  onClick: () => void
  disabled: boolean
  isAnalyzing: boolean
  hasResults: boolean
  title?: string
}

export function AnalyzeButton({
  onClick,
  disabled,
  isAnalyzing,
  hasResults,
  title,
}: AnalyzeButtonProps) {
  return (
    <Button
      size="lg"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="bg-cyan-600 hover:bg-cyan-700 text-white font-semibold px-6 py-6 text-base shrink-0"
    >
      {isAnalyzing ? (
        <>
          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
          Analyzing...
        </>
      ) : hasResults ? (
        <>
          <Sparkles className="h-5 w-5 mr-2" />
          Re-analyze Trends with AI
        </>
      ) : (
        <>
          <Sparkles className="h-5 w-5 mr-2" />
          Analyze Trends with AI
        </>
      )}
    </Button>
  )
}
