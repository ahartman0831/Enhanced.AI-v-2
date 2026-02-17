'use client'

import { useRef, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Camera, Upload, X, AlertTriangle, Image as ImageIcon } from 'lucide-react'

interface PhotoFile {
  file: File
  preview: string
  type: 'front' | 'side' | 'back'
}

interface PhotoUploaderProps {
  photos: {
    front?: PhotoFile
    side?: PhotoFile
    back?: PhotoFile
  }
  onPhotoChange: (type: 'front' | 'side' | 'back', photo: PhotoFile | undefined) => void
}

export function PhotoUploader({ photos, onPhotoChange }: PhotoUploaderProps) {
  const fileInputs = {
    front: useRef<HTMLInputElement>(null),
    side: useRef<HTMLInputElement>(null),
    back: useRef<HTMLInputElement>(null)
  }

  const [dragOver, setDragOver] = useState<'front' | 'side' | 'back' | null>(null)

  const handleFileSelect = (type: 'front' | 'side' | 'back') => {
    fileInputs[type].current?.click()
  }

  const handleFileChange = (type: 'front' | 'side' | 'back', event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && validateImageFile(file)) {
      const preview = URL.createObjectURL(file)
      onPhotoChange(type, { file, preview, type })
    }
  }

  const handleDrop = (type: 'front' | 'side' | 'back', event: React.DragEvent) => {
    event.preventDefault()
    setDragOver(null)

    const file = event.dataTransfer.files?.[0]
    if (file && validateImageFile(file)) {
      const preview = URL.createObjectURL(file)
      onPhotoChange(type, { file, preview, type })
    }
  }

  const handleDragOver = (type: 'front' | 'side' | 'back', event: React.DragEvent) => {
    event.preventDefault()
    setDragOver(type)
  }

  const handleDragLeave = () => {
    setDragOver(null)
  }

  const validateImageFile = (file: File): boolean => {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    const maxSize = 10 * 1024 * 1024 // 10MB

    if (!validTypes.includes(file.type)) {
      alert('Please select a valid image file (JPEG, PNG, or WebP)')
      return false
    }

    if (file.size > maxSize) {
      alert('File size must be less than 10MB')
      return false
    }

    return true
  }

  const removePhoto = (type: 'front' | 'side' | 'back') => {
    if (photos[type]) {
      URL.revokeObjectURL(photos[type]!.preview)
      onPhotoChange(type, undefined)
    }
  }

  const photoTypes = [
    { key: 'front' as const, label: 'Front View', description: 'Full body facing camera' },
    { key: 'side' as const, label: 'Side View', description: 'Full body from the side' },
    { key: 'back' as const, label: 'Back View', description: 'Full body from behind' }
  ]

  return (
    <div className="space-y-6">
      {/* Instructions */}
      <Alert>
        <Camera className="h-4 w-4" />
        <AlertDescription>
          <strong>Photography Tips:</strong> Use consistent lighting, wear minimal clothing, maintain the same pose and distance from camera.
          Take photos at the same time of day with similar conditions for accurate comparison.
        </AlertDescription>
      </Alert>

      {/* Photo Upload Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {photoTypes.map(({ key, label, description }) => (
          <Card key={key} className="overflow-hidden">
            <div className="p-4 border-b">
              <h3 className="font-semibold text-center">{label}</h3>
              <p className="text-sm text-muted-foreground text-center">{description}</p>
            </div>

            <CardContent className="p-4">
              {photos[key] ? (
                <div className="space-y-4">
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
                  </div>

                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-2">
                      {photos[key]!.file.name}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleFileSelect(key)}
                      className="w-full"
                    >
                      Replace Photo
                    </Button>
                  </div>
                </div>
              ) : (
                <div
                  className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                    dragOver === key
                      ? 'border-primary bg-primary/5'
                      : 'border-muted-foreground/25 hover:border-primary'
                  }`}
                  onClick={() => handleFileSelect(key)}
                  onDrop={(e) => handleDrop(key, e)}
                  onDragOver={(e) => handleDragOver(key, e)}
                  onDragLeave={handleDragLeave}
                >
                  <ImageIcon className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm font-medium mb-1">Upload {label}</p>
                  <p className="text-xs text-muted-foreground mb-3">
                    Drag & drop or click to select
                  </p>
                  <Button variant="outline" size="sm">
                    <Upload className="h-4 w-4 mr-2" />
                    Choose File
                  </Button>
                </div>
              )}

              <input
                ref={fileInputs[key]}
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange(key, e)}
                className="hidden"
              />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Upload Requirements */}
      <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription className="text-sm">
          <strong>Requirements:</strong> All three views required for analysis. Use high-quality images with good lighting.
          File size limit: 10MB. Supported formats: JPEG, PNG, WebP.
        </AlertDescription>
      </Alert>
    </div>
  )
}