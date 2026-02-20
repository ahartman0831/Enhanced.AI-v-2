'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FileText, Download, Crown, ArrowRight } from 'lucide-react'
import { useState } from 'react'
import { useSubscriptionTier } from '@/hooks/useSubscriptionTier'

interface DoctorPdfButtonProps {
  patientData: {
    name: string
    id: string
    analysis: any
  }
  analysisType: 'stack-explorer' | 'side-effects' | 'compounds' | 'bloodwork-analysis' | 'recovery-timeline' | 'progress-photos' | 'results-forecast' | 'telehealth-referral'
  onGenerate?: () => Promise<void>
  /** Custom button label (default: "Generate Doctor Report (PDF)") */
  buttonLabel?: string
}

export function DoctorPdfButton({ patientData, analysisType, onGenerate, buttonLabel }: DoctorPdfButtonProps) {
  const { isElite } = useSubscriptionTier()
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGeneratePDF = async () => {
    setIsGenerating(true)
    setError(null)

    try {
      if (onGenerate) {
        await onGenerate()
      } else {
        // Generate PDF via API
        const response = await fetch('/api/generate-pdf', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            analysisType,
            patientData
          })
        })

        if (!response.ok) {
          let errorMsg = 'Failed to generate PDF'
          try {
            const errorData = await response.json()
            errorMsg = errorData.error || errorMsg
          } catch {
            errorMsg = await response.text().catch(() => errorMsg) || errorMsg
          }
          throw new Error(errorMsg)
        }

        // Create download link for the PDF
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${patientData.name.replace(/[^a-zA-Z0-9]/g, '_')}_medical_summary.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (err: any) {
      console.error('Error generating PDF:', err)
      setError(err.message || 'Failed to generate PDF report')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="space-y-4">
      <Button
        onClick={handleGeneratePDF}
        disabled={isGenerating}
        className="flex items-center gap-2 w-full sm:w-auto"
        variant="outline"
      >
        {isGenerating ? (
          <>
            <FileText className="h-4 w-4 animate-pulse" />
            Generating Medical Report...
          </>
        ) : (
          <>
            <Download className="h-4 w-4" />
            {buttonLabel || 'Generate Doctor Report (PDF)'}
          </>
        )}
      </Button>

      {error && (
        <p className="text-sm text-destructive text-center">{error}</p>
      )}

      {/* Elite-only upsell - only show when user is not Elite */}
      {!isElite && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Crown className="h-5 w-5 text-amber-600" />
            <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
              Elite Feature
            </Badge>
          </div>
          <p className="text-sm text-amber-800 dark:text-amber-200 mb-3">
            Unlock TRT optimization protocols & specialist referral packages
          </p>
          <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white" asChild>
            <Link href="/subscription">
              Upgrade to Elite
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </div>
      )}
    </div>
  )
}