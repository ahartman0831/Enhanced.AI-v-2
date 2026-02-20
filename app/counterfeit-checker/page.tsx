'use client'

import { useState, useRef } from 'react'
import { TierGate } from '@/components/TierGate'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import {
  Shield,
  Upload,
  AlertTriangle,
  CheckCircle,
  X,
  Loader2,
  Image as ImageIcon,
  ExternalLink
} from 'lucide-react'
import { getLabTestingLink, getAffiliateDisclosure } from '@/lib/affiliates'

interface CounterfeitAnalysisResult {
  productAnalysis: {
    productType: string
    packagingAssessment: string
    labelingAssessment: string
    overallVisualQuality: string
  }
  authenticityIndicators: Array<{
    indicator: string
    status: 'concerning' | 'neutral' | 'positive'
    description: string
    educationalContext: string
    confidence: 'low' | 'medium' | 'high'
  }>
  riskFlags: Array<{
    severity: 'low' | 'medium' | 'high'
    category: string
    description: string
    commonCounterfeitIssues: string[]
    recommendations: string[]
  }>
  verificationMethods: Array<{
    method: string
    description: string
    effectiveness: string
    accessibility: string
    professionalRecommendation: string
    affiliateCta?: string
  }>
  educationalSummary: {
    keyFindings: string[]
    limitations: string[]
    recommendations: string[]
    revenueDisclosure?: string
  }
}

const MAX_IMAGES = 8
const ACCEPTED_TYPES = 'image/jpeg,image/png,image/webp'

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

const MAX_IMAGE_DIM = 1536
const MAX_IMAGE_KB = 800

async function compressImageForApi(file: File): Promise<string> {
  const dataUrl = await fileToDataUrl(file)
  const sizeKb = Math.round((dataUrl.length * 3) / 4 / 1024)
  if (sizeKb <= MAX_IMAGE_KB) return dataUrl

  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      let { width, height } = img
      if (width > MAX_IMAGE_DIM || height > MAX_IMAGE_DIM) {
        const r = Math.min(MAX_IMAGE_DIM / width, MAX_IMAGE_DIM / height)
        width = Math.round(width * r)
        height = Math.round(height * r)
      }
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) return resolve(dataUrl)
      ctx.drawImage(img, 0, 0, width, height)
      let quality = 0.85
      const tryExport = () => {
        const jpeg = canvas.toDataURL('image/jpeg', quality)
        if (Math.round((jpeg.length * 3) / 4 / 1024) <= MAX_IMAGE_KB || quality <= 0.5) {
          resolve(jpeg)
        } else {
          quality -= 0.1
          tryExport()
        }
      }
      tryExport()
    }
    img.onerror = () => resolve(dataUrl)
    img.src = dataUrl
  })
}

const PHOTO_TIPS = [
  { id: 'barcode', label: 'Barcode / QR code', tip: 'Clear, well-lit shot. Ensure numbers are readable.' },
  { id: 'hologram', label: 'Hologram / security features', tip: 'Capture from different angles to show reflection.' },
  { id: 'name', label: 'Product name & branding', tip: 'Full label visible. Sharp focus on text.' },
  { id: 'color', label: 'Color & consistency', tip: 'Natural lighting. Show true product color.' },
  { id: 'batch', label: 'Batch / lot number & expiry', tip: 'Close-up so text is legible.' },
  { id: 'packaging', label: 'Full packaging', tip: 'All sides if possible. Show tamper seals.' },
  { id: 'product', label: 'Product itself (capsules/tablets)', tip: 'Size, shape, color uniformity.' },
  { id: 'serial', label: 'Serial number (if applicable)', tip: 'Clear, unobstructed view.' }
]

export default function CounterfeitCheckerPage() {
  const [selectedImages, setSelectedImages] = useState<Array<{ file: File; id: string; preview: string }>>([])
  const [productInfo, setProductInfo] = useState('')
  const [productType, setProductType] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [result, setResult] = useState<CounterfeitAnalysisResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageSelect = () => {
    fileInputRef.current?.click()
  }

  const addFiles = (files: FileList | null) => {
    if (!files) return
    const newEntries: Array<{ file: File; id: string; preview: string }> = []
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      if (!file.type.startsWith('image/')) continue
      if (selectedImages.length + newEntries.length >= MAX_IMAGES) break
      newEntries.push({
        file,
        id: `${file.name}-${Date.now()}-${i}`,
        preview: URL.createObjectURL(file)
      })
    }
    setSelectedImages((prev) => [...prev, ...newEntries].slice(0, MAX_IMAGES))
  }

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    addFiles(event.target.files)
    event.target.value = ''
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    addFiles(e.dataTransfer.files)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const removeImage = (id: string) => {
    setSelectedImages((prev) => {
      const next = prev.filter((f) => f.id !== id)
      const removed = prev.find((f) => f.id === id)
      if (removed) URL.revokeObjectURL(removed.preview)
      return next
    })
  }

  const handleAnalyze = async () => {
    if (selectedImages.length === 0) {
      setError('Please add at least one product image to analyze')
      return
    }

    setIsAnalyzing(true)
    setError(null)

    try {
      const imageDataUrls = await Promise.all(selectedImages.map(({ file }) => compressImageForApi(file)))

      const response = await fetch('/api/analyze-counterfeit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageDataUrls,
          productInfo: productInfo || undefined,
          productType: productType || undefined
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze product')
      }

      setResult(data.data)
    } catch (err: any) {
      setError(err.message || 'An error occurred while analyzing the product')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const resetAnalysis = () => {
    selectedImages.forEach(({ preview }) => URL.revokeObjectURL(preview))
    setSelectedImages([])
    setResult(null)
    setError(null)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'positive': return 'bg-green-100 text-green-800'
      case 'neutral': return 'bg-blue-100 text-blue-800'
      case 'concerning': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <TierGate>
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Counterfeit Checker</h1>
          <p className="text-muted-foreground">
            Educational analysis of product authenticity using visual inspection.
          </p>
        </div>

        {/* Disclaimer Banner */}
        <Alert className="mb-8 border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            <strong>Educational tool only. Not definitive testing. Professional lab analysis required.</strong> Visual inspection cannot definitively identify counterfeit products. Laboratory testing (HPLC, mass spectrometry) is the only reliable method for counterfeit detection.
          </AlertDescription>
        </Alert>

        {!result ? (
          /* Input Form */
          <div className="space-y-8">
            {/* Photo Quality Tips */}
            <Card className="border-cyan-500/20 bg-cyan-500/5 dark:bg-cyan-950/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-cyan-700 dark:text-cyan-300">
                  <ImageIcon className="h-5 w-5" />
                  Photo Quality Tips for Best Results
                </CardTitle>
                <CardDescription>
                  Upload 1–{MAX_IMAGES} clear photos. Include different angles and features for a more thorough analysis.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {PHOTO_TIPS.map(({ id, label, tip }) => (
                    <div
                      key={id}
                      className="rounded-lg border border-cyan-500/20 bg-background p-3 text-sm"
                    >
                      <p className="font-medium text-foreground mb-1">{label}</p>
                      <p className="text-muted-foreground text-xs">{tip}</p>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-4">
                  <strong>General tips:</strong> Use good lighting, avoid glare, hold the camera steady, and ensure text is in focus.
                </p>
              </CardContent>
            </Card>

            <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800">
              <Shield className="h-4 w-4" />
              <AlertDescription>
                <strong>Important:</strong> This provides educational insights only. For definitive counterfeit detection,
                always use professional laboratory testing services.
              </AlertDescription>
            </Alert>

            {/* Product Information */}
            <Card>
              <CardHeader>
                <CardTitle>Product Information (Optional)</CardTitle>
                <CardDescription>
                  Provide additional context for more accurate analysis
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Product Type</Label>
                    <Select value={productType} onValueChange={setProductType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select product type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="capsules">Capsules/Tablets</SelectItem>
                        <SelectItem value="injectable">Injectable</SelectItem>
                        <SelectItem value="topical">Topical Cream/Gel</SelectItem>
                        <SelectItem value="powder">Powder</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Additional Information</Label>
                  <Textarea
                    placeholder="Purchase source, expected compounds, any specific concerns..."
                    value={productInfo}
                    onChange={(e) => setProductInfo(e.target.value)}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Image Upload */}
            <Card>
              <CardHeader>
                <CardTitle>Product Images</CardTitle>
                <CardDescription>
                  Upload 1–{MAX_IMAGES} photos. Add barcode, hologram, label, batch number, and product shots for best analysis.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center cursor-pointer hover:border-cyan-500/50 transition-colors"
                  onClick={handleImageSelect}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                >
                  <ImageIcon className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm font-medium mb-1">Add photos</p>
                  <p className="text-xs text-muted-foreground mb-3">
                    {selectedImages.length} of {MAX_IMAGES} images • Click or drag to add more
                  </p>
                  <Button variant="outline" size="sm" type="button">
                    <Upload className="h-4 w-4 mr-2" />
                    Choose Images
                  </Button>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPTED_TYPES}
                  multiple
                  onChange={handleImageChange}
                  className="hidden"
                />

                {selectedImages.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium mb-2">Selected images ({selectedImages.length})</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {selectedImages.map(({ id, preview, file }) => (
                        <div key={id} className="relative group aspect-square rounded-lg border overflow-hidden bg-muted">
                          <img
                            src={preview}
                            alt={file.name}
                            className="w-full h-full object-cover"
                          />
                          <Button
                            size="icon"
                            variant="destructive"
                            className="absolute top-1 right-1 h-7 w-7 opacity-90 hover:opacity-100"
                            onClick={(e) => {
                              e.stopPropagation()
                              removeImage(id)
                            }}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                          <p className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] px-1 py-0.5 truncate">
                            {file.name}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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
                disabled={isAnalyzing || selectedImages.length === 0}
                size="lg"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Analyzing Product...
                  </>
                ) : (
                  'Analyze Product Authenticity'
                )}
              </Button>
            </div>
          </div>
        ) : (
          /* Results Display */
          <div className="space-y-8">
            {/* Product Analysis Summary */}
            {result.productAnalysis && (
              <Card>
                <CardHeader>
                  <CardTitle>Product Analysis Summary</CardTitle>
                  <CardDescription>
                    Educational assessment of visual product characteristics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-2">Product Type</h4>
                      <p className="text-muted-foreground">{result.productAnalysis.productType}</p>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Overall Visual Quality</h4>
                      <p className="text-muted-foreground">{result.productAnalysis.overallVisualQuality}</p>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Packaging Assessment</h4>
                      <p className="text-muted-foreground">{result.productAnalysis.packagingAssessment}</p>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Labeling Assessment</h4>
                      <p className="text-muted-foreground">{result.productAnalysis.labelingAssessment}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Authenticity Indicators */}
            {result.authenticityIndicators && result.authenticityIndicators.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Authenticity Indicators</CardTitle>
                  <CardDescription>
                    Educational analysis of visual authenticity markers
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {result.authenticityIndicators.map((indicator, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold">{indicator.indicator}</h4>
                        <div className="flex gap-2">
                          <Badge className={getStatusColor(indicator.status)}>
                            {indicator.status}
                          </Badge>
                          <Badge variant="outline">
                            {indicator.confidence} confidence
                          </Badge>
                        </div>
                      </div>

                      <p className="text-sm text-muted-foreground mb-2">
                        {indicator.description}
                      </p>

                      <p className="text-sm text-muted-foreground">
                        <strong>Context:</strong> {indicator.educationalContext}
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Risk Flags */}
            {result.riskFlags && result.riskFlags.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Educational Risk Flags</CardTitle>
                  <CardDescription>
                    Areas that may warrant additional verification
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {result.riskFlags.map((flag, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold">{flag.description}</h4>
                        <Badge className={getSeverityColor(flag.severity)}>
                          {flag.severity} risk
                        </Badge>
                      </div>

                      {flag.commonCounterfeitIssues && flag.commonCounterfeitIssues.length > 0 && (
                        <div className="mb-3">
                          <h5 className="text-sm font-medium mb-1">Common Issues:</h5>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            {flag.commonCounterfeitIssues.map((issue, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <AlertTriangle className="h-3 w-3 text-amber-500 mt-0.5 flex-shrink-0" />
                                {issue}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {flag.recommendations && flag.recommendations.length > 0 && (
                        <div>
                          <h5 className="text-sm font-medium mb-1">Recommendations:</h5>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            {flag.recommendations.map((rec, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                                {rec}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Verification Methods */}
            {result.verificationMethods && result.verificationMethods.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Verification Methods</CardTitle>
                  <CardDescription>
                    Educational overview of counterfeit detection approaches
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {result.verificationMethods.map((method, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <h4 className="font-semibold mb-2">{method.method}</h4>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                        <div>
                          <h5 className="text-sm font-medium mb-1">Description</h5>
                          <p className="text-sm text-muted-foreground">{method.description}</p>
                        </div>

                        <div>
                          <h5 className="text-sm font-medium mb-1">Effectiveness</h5>
                          <p className="text-sm text-muted-foreground">{method.effectiveness}</p>
                        </div>
                      </div>

                      <div className="mb-3">
                        <h5 className="text-sm font-medium mb-1">Accessibility</h5>
                        <p className="text-sm text-muted-foreground">{method.accessibility}</p>
                      </div>

                      <div className="mb-3">
                        <h5 className="text-sm font-medium mb-1">Professional Recommendation</h5>
                        <p className="text-sm text-muted-foreground">{method.professionalRecommendation}</p>
                      </div>

                      {(method.affiliateCta === 'AnabolicLab' || method.affiliateCta === 'LabTesting') && (
                        <Button variant="outline" size="sm" className="mt-2" asChild>
                          <a
                            href={getLabTestingLink('anabolicLab')}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300"
                          >
                            Explore educational testing resources
                            <ExternalLink className="h-3 w-3 ml-1.5" />
                          </a>
                        </Button>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Educational Summary */}
            {result.educationalSummary && (
              <Card>
                <CardHeader>
                  <CardTitle>Educational Summary</CardTitle>
                  <CardDescription>
                    Key educational takeaways from this authenticity analysis
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {result.educationalSummary.keyFindings && result.educationalSummary.keyFindings.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">Key Findings</h4>
                      <ul className="space-y-1">
                        {result.educationalSummary.keyFindings.map((finding, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm">
                            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                            {finding}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {result.educationalSummary.limitations && result.educationalSummary.limitations.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">Analysis Limitations</h4>
                      <ul className="space-y-1">
                        {result.educationalSummary.limitations.map((limitation, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm">
                            <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                            {limitation}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {result.educationalSummary.recommendations && result.educationalSummary.recommendations.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">Educational Recommendations</h4>
                      <ul className="space-y-1">
                        {result.educationalSummary.recommendations.map((rec, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm">
                            <Shield className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <p className="text-xs text-muted-foreground mt-4 pt-4 border-t">
                    {result.educationalSummary.revenueDisclosure || getAffiliateDisclosure()}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Important Notice */}
            <Alert className="border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                <strong>Critical Notice:</strong> This analysis is for educational purposes only and cannot definitively identify counterfeit products.
                Visual inspection has significant limitations and laboratory testing (HPLC, mass spectrometry) is the only reliable method for counterfeit detection.
                Always consult professional testing services for definitive product verification.
              </AlertDescription>
            </Alert>

            {/* Analyze Another Product Button */}
            <div className="flex justify-center">
              <Button onClick={resetAnalysis} variant="outline">
                Analyze Another Product
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
    </TierGate>
  )
}