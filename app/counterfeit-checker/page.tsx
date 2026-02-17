'use client'

import { useState, useRef } from 'react'
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
  Search
} from 'lucide-react'

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
  }>
  educationalSummary: {
    keyFindings: string[]
    limitations: string[]
    recommendations: string[]
  }
}

export default function CounterfeitCheckerPage() {
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [productInfo, setProductInfo] = useState('')
  const [productType, setProductType] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [result, setResult] = useState<CounterfeitAnalysisResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageSelect = () => {
    fileInputRef.current?.click()
  }

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedImage(file)
      const preview = URL.createObjectURL(file)
      setImagePreview(preview)
    }
  }

  const removeImage = () => {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview)
    }
    setSelectedImage(null)
    setImagePreview(null)
  }

  const uploadImage = async (file: File): Promise<string> => {
    // In a real implementation, you would upload to Supabase Storage
    // For now, we'll return a placeholder URL
    return `uploaded-${file.name}-${Date.now()}`
  }

  const handleAnalyze = async () => {
    if (!selectedImage) {
      setError('Please select a product image to analyze')
      return
    }

    setIsAnalyzing(true)
    setError(null)

    try {
      // Upload the image (placeholder implementation)
      const imageUrl = await uploadImage(selectedImage)

      const response = await fetch('/api/analyze-counterfeit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageUrl,
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
            {/* Instructions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Product Authenticity Analysis
                </CardTitle>
                <CardDescription>
                  Upload a clear photo of your product packaging/labeling for educational authenticity assessment
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-2">What to Photograph:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Product packaging/label</li>
                      <li>• Lot numbers and expiration dates</li>
                      <li>• Holographic/security features</li>
                      <li>• Manufacturer markings</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Analysis Covers:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Packaging quality indicators</li>
                      <li>• Labeling consistency</li>
                      <li>• Common authenticity markers</li>
                      <li>• Risk assessment flags</li>
                    </ul>
                  </div>
                </div>

                <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800">
                  <Search className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Important:</strong> This provides educational insights only. For definitive counterfeit detection,
                    always use professional laboratory testing services.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

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
                <CardTitle>Product Image</CardTitle>
                <CardDescription>
                  Upload a clear photo of the product packaging/labeling
                </CardDescription>
              </CardHeader>
              <CardContent>
                {imagePreview ? (
                  <div className="space-y-4">
                    <div className="relative max-w-md mx-auto">
                      <img
                        src={imagePreview}
                        alt="Product preview"
                        className="w-full h-64 object-contain border rounded-lg"
                      />
                      <Button
                        size="sm"
                        variant="destructive"
                        className="absolute top-2 right-2"
                        onClick={removeImage}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-4">
                        Image uploaded successfully
                      </p>
                    </div>
                  </div>
                ) : (
                  <div
                    className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
                    onClick={handleImageSelect}
                  >
                    <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Upload Product Image</h3>
                    <p className="text-muted-foreground mb-4">
                      Click to select an image of your product packaging or labeling
                    </p>
                    <Button variant="outline">
                      <Upload className="h-4 w-4 mr-2" />
                      Choose Image
                    </Button>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
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
                disabled={isAnalyzing || !selectedImage}
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

                      <div>
                        <h5 className="text-sm font-medium mb-1">Professional Recommendation</h5>
                        <p className="text-sm text-muted-foreground">{method.professionalRecommendation}</p>
                      </div>
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
  )
}