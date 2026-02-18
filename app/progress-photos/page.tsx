'use client'

import React, { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { PhotoUploader } from '@/components/PhotoUploader'
import { PhotoMetaForm } from '@/components/PhotoMetaForm'
import { AnalyzeButton } from '@/components/AnalyzeButton'
import { VisionReportCard } from '@/components/VisionReportCard'
import { ComparisonViewer } from '@/components/ComparisonViewer'
import { TimelineTagger } from '@/components/TimelineTagger'
import { DoctorPdfButton } from '@/components/DoctorPdfButton'
import { AlertTriangle } from 'lucide-react'

interface PhotoMetadata {
  currentWeight?: string
  weightUnit?: 'lbs'
  height?: string
  heightUnit?: 'ft' | 'cm'
  lighting?: string
  pumpStatus?: string
  trainingPhase?: string
  supplementationPhase?: string
  notes?: string
  isFast?: boolean
  recentWorkout?: boolean
  wellHydrated?: boolean
}

// API returns simple format; VisionReportCard expects detailed format
// We use a flexible type and let VisionReportCard handle both via optional chaining
type PhotoAnalysisResult = Record<string, unknown>

interface PhotoFile {
  file: File
  preview: string
  type: 'front' | 'side' | 'back'
}

export default function ProgressPhotosPage() {
  const [photos, setPhotos] = useState<{
    front?: PhotoFile
    side?: PhotoFile
    back?: PhotoFile
  }>({})
  const [metadata, setMetadata] = useState<PhotoMetadata>({})
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [result, setResult] = useState<PhotoAnalysisResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fileInputs = {
    front: useRef<HTMLInputElement>(null),
    side: useRef<HTMLInputElement>(null),
    back: useRef<HTMLInputElement>(null)
  }

  const handleFileSelect = (type: 'front' | 'side' | 'back') => {
    fileInputs[type].current?.click()
  }

  const handlePhotoChange = (type: 'front' | 'side' | 'back', photo: PhotoFile | undefined) => {
    if (photo) {
      setPhotos(prev => ({ ...prev, [type]: photo }))
    } else {
      if (photos[type]) {
        URL.revokeObjectURL(photos[type]!.preview)
      }
      setPhotos(prev => {
        const newPhotos = { ...prev }
        delete newPhotos[type]
        return newPhotos
      })
    }
  }

  const handleFileChange = (type: 'front' | 'side' | 'back', event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const preview = URL.createObjectURL(file)
      handlePhotoChange(type, { file, preview, type })
    }
  }

  const removePhoto = (type: 'front' | 'side' | 'back') => {
    handlePhotoChange(type, undefined)
  }

  const handleSaveTimelineEntry = (_entry: { date: string; category: string; title: string; description: string; tags: string[]; metrics?: object }) => {
    // TODO: Save to API in real implementation
  }

  const uploadPhotoToStorage = async (photo: PhotoFile): Promise<string> => {
    // In a real implementation, you would upload to Supabase Storage
    // For now, we'll return a placeholder URL
    return `uploaded-${photo.type}-${Date.now()}.jpg`
  }

  const handleAnalyze = async () => {
    if (!photos.front || !photos.side || !photos.back) {
      setError('Please upload all three required photos: front, side, and back views.')
      return
    }

    setIsAnalyzing(true)
    setError(null)

    try {
      // Upload photos (placeholder implementation)
      const [frontUrl, sideUrl, backUrl] = await Promise.all([
        uploadPhotoToStorage(photos.front),
        uploadPhotoToStorage(photos.side),
        uploadPhotoToStorage(photos.back)
      ])

      // Call analysis API
      const response = await fetch('/api/analyzePhotoProgress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          frontUrl,
          sideUrl,
          backUrl,
          metadata: Object.keys(metadata).length > 0 ? JSON.stringify(metadata) : undefined
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze photos')
      }

      setResult(data.data)

    } catch (err: any) {
      setError(err.message || 'An error occurred while analyzing photos')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const resetAnalysis = () => {
    setResult(null)
    setError(null)
  }

  const photoCount = [photos.front, photos.side, photos.back].filter(Boolean).length

  const photoTypes = [
    { key: 'front', label: 'Front View', description: 'Full body facing camera' },
    { key: 'side', label: 'Side View', description: 'Full body from the side' },
    { key: 'back', label: 'Back View', description: 'Full body from behind' }
  ] as const

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Progress Photos</h1>
          <p className="text-muted-foreground">
            Upload progress photos for educational body composition analysis.
          </p>
        </div>

        {/* Disclaimer Banner */}
        <Alert className="mb-8 border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            <strong>Educational tool only. Not medical advice. Consult your physician.</strong> Photo analysis is for educational purposes only and should not be used as a substitute for professional medical advice, diagnosis, or treatment.
          </AlertDescription>
        </Alert>

        {!result ? (
          /* Photo Upload Form */
          <div className="space-y-8">
            {/* Photo Uploader Component */}
            <PhotoUploader
              photos={photos}
              onPhotoChange={handlePhotoChange}
            />

            {/* Metadata Form Component */}
            <PhotoMetaForm
              metadata={metadata}
              onMetadataChange={setMetadata}
            />

            {/* Comparison Viewer (if previous photos exist) */}
            <ComparisonViewer
              currentPhotos={photos}
              previousEntries={[]} // Would be fetched from API in real implementation
            />

            {/* Error Display */}
            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Analyze Button Component */}
            <AnalyzeButton
              onAnalyze={handleAnalyze}
              isAnalyzing={isAnalyzing}
              photosCount={photoCount}
              requiredPhotos={3}
            />
          </div>
        ) : (
          /* Results Display */
          <div className="space-y-8">
            {/* Vision Report Card Component */}
            <VisionReportCard result={result as unknown as React.ComponentProps<typeof VisionReportCard>['result']} />

            {/* Timeline Tagger Component */}
            <TimelineTagger
              onSaveEntry={handleSaveTimelineEntry}
              existingEntries={[]} // Would be fetched from API in real implementation
            />

            {/* PDF Button */}
            <div className="flex justify-center">
              <DoctorPdfButton
                patientData={{
                  name: 'Progress Photo Analysis Report',
                  id: 'photo-analysis',
                  analysis: result
                }}
                analysisType="progress-photos"
              />
            </div>

            {/* Analyze New Photos Button */}
            <div className="flex justify-center">
              <Button onClick={resetAnalysis} variant="outline">
                Analyze New Photos
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}