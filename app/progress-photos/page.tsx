'use client'

import { useState, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { DoctorPdfButton } from '@/components/DoctorPdfButton'
import {
  Camera,
  Upload,
  X,
  AlertTriangle,
  Loader2,
  CheckCircle,
  Image as ImageIcon
} from 'lucide-react'

interface PhotoAnalysisResult {
  bodyComposition: {
    generalObservations: string[]
    symmetryAssessment: string
    improvementAreas: string[]
  }
  monitoringRecommendations: string[]
  educationalNotes: string
}

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
  const [metadata, setMetadata] = useState('')
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

  const handleFileChange = (type: 'front' | 'side' | 'back', event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const preview = URL.createObjectURL(file)
      setPhotos(prev => ({
        ...prev,
        [type]: { file, preview, type }
      }))
    }
  }

  const removePhoto = (type: 'front' | 'side' | 'back') => {
    if (photos[type]) {
      URL.revokeObjectURL(photos[type]!.preview)
      setPhotos(prev => {
        const newPhotos = { ...prev }
        delete newPhotos[type]
        return newPhotos
      })
    }
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
          metadata: metadata || undefined
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
            {/* Photo Upload Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="h-5 w-5" />
                  Upload Progress Photos
                </CardTitle>
                <CardDescription>
                  Upload three photos: front, side, and back views for comprehensive analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {photoTypes.map(({ key, label, description }) => (
                    <div key={key} className="space-y-4">
                      <div className="text-center">
                        <h3 className="font-semibold mb-1">{label}</h3>
                        <p className="text-sm text-muted-foreground">{description}</p>
                      </div>

                      {photos[key] ? (
                        <div className="relative">
                          <img
                            src={photos[key]!.preview}
                            alt={`${label} view`}
                            className="w-full h-48 object-cover rounded-lg border"
                          />
                          <Button
                            size="sm"
                            variant="destructive"
                            className="absolute top-2 right-2"
                            onClick={() => removePhoto(key)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                          <div className="absolute bottom-2 left-2 bg-green-500 text-white px-2 py-1 rounded text-xs">
                            <CheckCircle className="h-3 w-3 inline mr-1" />
                            Uploaded
                          </div>
                        </div>
                      ) : (
                        <div
                          className="w-full h-48 border-2 border-dashed border-muted-foreground/25 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors"
                          onClick={() => handleFileSelect(key)}
                        >
                          <ImageIcon className="h-8 w-8 text-muted-foreground mb-2" />
                          <p className="text-sm text-muted-foreground text-center">
                            Click to upload<br />
                            {label.toLowerCase()}
                          </p>
                        </div>
                      )}

                      <input
                        ref={fileInputs[key]}
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileChange(key, e)}
                        className="hidden"
                      />

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleFileSelect(key)}
                        className="w-full"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        {photos[key] ? 'Replace' : 'Upload'} {label}
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Metadata Section */}
            <Card>
              <CardHeader>
                <CardTitle>Optional Metadata</CardTitle>
                <CardDescription>
                  Provide context for more personalized analysis (optional)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="metadata">Additional Information</Label>
                  <Textarea
                    id="metadata"
                    placeholder="Example: Current weight, training experience, goals, etc."
                    value={metadata}
                    onChange={(e) => setMetadata(e.target.value)}
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Error Display */}
            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Analyze Button */}
            <div className="flex justify-center">
              <Button
                onClick={handleAnalyze}
                disabled={isAnalyzing || !photos.front || !photos.side || !photos.back}
                size="lg"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Analyzing Photos...
                  </>
                ) : (
                  'Analyze Progress Photos'
                )}
              </Button>
            </div>
          </div>
        ) : (
          /* Results Display */
          <div className="space-y-8">
            {/* Analysis Results */}
            <Card>
              <CardHeader>
                <CardTitle>Educational Photo Analysis Results</CardTitle>
                <CardDescription>
                  General observations and educational insights from your progress photos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Body Composition */}
                {result.bodyComposition && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Body Composition Analysis</h3>

                    {result.bodyComposition.generalObservations && result.bodyComposition.generalObservations.length > 0 && (
                      <div className="mb-4">
                        <h4 className="font-medium mb-2">General Observations</h4>
                        <ul className="space-y-1">
                          {result.bodyComposition.generalObservations.map((obs, index) => (
                            <li key={index} className="flex items-start gap-2 text-sm">
                              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                              {obs}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {result.bodyComposition.symmetryAssessment && (
                      <div className="mb-4">
                        <h4 className="font-medium mb-2">Symmetry Assessment</h4>
                        <p className="text-sm text-muted-foreground">{result.bodyComposition.symmetryAssessment}</p>
                      </div>
                    )}

                    {result.bodyComposition.improvementAreas && result.bodyComposition.improvementAreas.length > 0 && (
                      <div className="mb-4">
                        <h4 className="font-medium mb-2">Areas for Educational Focus</h4>
                        <ul className="space-y-1">
                          {result.bodyComposition.improvementAreas.map((area, index) => (
                            <li key={index} className="flex items-start gap-2 text-sm">
                              <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                              {area}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Monitoring Recommendations */}
                {result.monitoringRecommendations && result.monitoringRecommendations.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Educational Monitoring Recommendations</h3>
                    <ul className="space-y-2">
                      {result.monitoringRecommendations.map((rec, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Educational Notes */}
                {result.educationalNotes && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{result.educationalNotes}</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

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