'use client'

import { useState, useCallback } from 'react'
import { TierGate } from '@/components/TierGate'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { SupplementScanner } from '@/components/SupplementScanner'
import { Input } from '@/components/ui/input'
import { Sparkles, AlertTriangle, Camera, FileText, ScanBarcode, Loader2, CheckCircle, Link2 } from 'lucide-react'

type TabId = 'scan' | 'upload' | 'paste' | 'url'

const MAX_IMAGE_DIM = 1536
const MAX_IMAGE_KB = 800

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

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

interface AnalysisResult {
  productName?: string
  ingredientBreakdown?: Array<{
    ingredient: string
    purpose: string
    commonlyDiscussedDose: string
    considerations: string
  }>
  stackInteractions?: string
  bloodworkConsiderations?: string
  generalNotes?: string
}

export default function SupplementAnalyzerPage() {
  const [activeTab, setActiveTab] = useState<TabId>('scan')
  const [scannerOpen, setScannerOpen] = useState(false)
  const [pastedText, setPastedText] = useState('')
  const [productUrl, setProductUrl] = useState('')
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [scannedCode, setScannedCode] = useState<string | null>(null)

  const runAnalysis = useCallback(async (supplementInput: string, options?: { barcode?: string }) => {
    setAnalyzing(true)
    setError(null)
    setResult(null)
    try {
      const body: Record<string, string> = { supplementInput }
      if (options?.barcode) body.barcode = options.barcode
      const res = await fetch('/api/supplement-analyzer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) {
        const msg = data.error || 'Analysis failed'
        const flags = data.flags as string[] | undefined
        throw new Error(flags?.length ? `${msg} Flagged: ${flags.join(', ')}` : msg)
      }
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed')
    } finally {
      setAnalyzing(false)
    }
  }, [])

  const handleScanSuccess = useCallback(
    (barcode: string) => {
      setScannedCode(barcode)
      const input = `UPC/Barcode: ${barcode}. Analyze as supplement label - provide ingredient breakdown, potential interactions with user's stack, and educational context.`
      runAnalysis(input, { barcode })
    },
    [runAnalysis]
  )

  const handlePasteAnalyze = () => {
    const text = pastedText.trim()
    if (!text) {
      setError('Please paste supplement label or ingredient list')
      return
    }
    runAnalysis(text)
  }

  const handleUrlAnalyze = async () => {
    const url = productUrl.trim()
    if (!url) {
      setError('Please paste a product URL')
      return
    }
    setAnalyzing(true)
    setError(null)
    setResult(null)
    try {
      const res = await fetch('/api/supplement-analyzer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productUrl: url }),
      })
      const data = await res.json()
      if (!res.ok) {
        const msg = data.error || 'Analysis failed'
        const flags = data.flags as string[] | undefined
        throw new Error(flags?.length ? `${msg} Flagged: ${flags.join(', ')}` : msg)
      }
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'URL analysis failed')
    } finally {
      setAnalyzing(false)
    }
  }

  const handleFileAnalyze = async () => {
    if (!uploadedFile) {
      setError('Please upload an image first')
      return
    }
    setAnalyzing(true)
    setError(null)
    setResult(null)
    try {
      const imageDataUrl = await compressImageForApi(uploadedFile)
      const res = await fetch('/api/supplement-analyzer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageDataUrl }),
      })
      const data = await res.json()
      if (!res.ok) {
        const msg = data.error || 'Analysis failed'
        const flags = data.flags as string[] | undefined
        throw new Error(flags?.length ? `${msg} Flagged: ${flags.join(', ')}` : msg)
      }
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Image analysis failed')
    } finally {
      setAnalyzing(false)
    }
  }

  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: 'scan', label: 'Scan Barcode', icon: <ScanBarcode className="h-4 w-4" /> },
    { id: 'upload', label: 'Upload Image', icon: <Camera className="h-4 w-4" /> },
    { id: 'url', label: 'Paste URL', icon: <Link2 className="h-4 w-4" /> },
    { id: 'paste', label: 'Paste Text', icon: <FileText className="h-4 w-4" /> },
  ]

  return (
    <TierGate>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-2">
              <Sparkles className="h-8 w-8 text-cyan-500" />
              Supplement Analyzer
            </h1>
            <p className="text-muted-foreground">
              Scan a barcode, upload an image, paste a product URL, or paste label text for AI-powered ingredient analysis and stack interactions.
            </p>
          </div>

          <Alert className="mb-6 border-cyan-500/20 bg-cyan-500/5 dark:bg-cyan-950/20 dark:border-cyan-800/50">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Educational only.</strong> Not medical advice. Individual responses vary. Always consult healthcare professionals before starting new supplements.
            </AlertDescription>
          </Alert>

          {/* Tabs */}
          <div className="flex gap-2 mb-6" role="tablist" aria-label="Input method">
            {tabs.map((tab) => (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => { setActiveTab(tab.id); setError(null); }}
                role="tab"
                aria-selected={activeTab === tab.id}
                aria-controls={`panel-${tab.id}`}
                id={`tab-${tab.id}`}
                className="flex items-center gap-2"
              >
                {tab.icon}
                {tab.label}
              </Button>
            ))}
          </div>

          {/* Tab panels */}
          <Card>
            <CardContent className="pt-6">
              {activeTab === 'scan' && (
                <div id="panel-scan" role="tabpanel" aria-labelledby="tab-scan">
                  <p className="text-sm text-muted-foreground mb-4">
                    Scan your supplement bottle&apos;s barcode (UPC/EAN) to auto-detect and analyze.
                  </p>
                  {scannedCode && (
                    <div className="mb-4 flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Scanned: <strong>{scannedCode}</strong></span>
                    </div>
                  )}
                  <Button
                    className="w-full bg-red-600 hover:bg-red-700"
                    onClick={() => setScannerOpen(true)}
                    disabled={analyzing}
                    aria-label="Open barcode scanner"
                  >
                    <ScanBarcode className="h-4 w-4 mr-2" />
                    Scan Barcode
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    No camera? Use &quot;Upload Image&quot; or &quot;Paste Text&quot; instead.
                  </p>
                </div>
              )}

              {activeTab === 'upload' && (
                <div id="panel-upload" role="tabpanel" aria-labelledby="tab-upload">
                  <p className="text-sm text-muted-foreground mb-4">
                    Upload a photo of the supplement label. AI will read the ingredients and provide analysis.
                  </p>
                  <div className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-6 text-center">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setUploadedFile(e.target.files?.[0] ?? null)}
                      className="hidden"
                      id="supplement-upload"
                      aria-label="Upload supplement label image"
                    />
                    <label htmlFor="supplement-upload" className="cursor-pointer block">
                      <Camera className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                      <span className="text-sm font-medium">
                        {uploadedFile ? uploadedFile.name : 'Choose image'}
                      </span>
                    </label>
                  </div>
                  <Button
                    className="w-full mt-4"
                    onClick={handleFileAnalyze}
                    disabled={!uploadedFile || analyzing}
                  >
                    {analyzing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Analyze Image
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    AI will read the label and analyze ingredients. For best results, use a clear, well-lit photo.
                  </p>
                </div>
              )}

              {activeTab === 'url' && (
                <div id="panel-url" role="tabpanel" aria-labelledby="tab-url">
                  <p className="text-sm text-muted-foreground mb-4">
                    Paste a product link (Amazon, supplement retailers, etc.). We&apos;ll fetch the page and analyze ingredients.
                  </p>
                  <Input
                    type="url"
                    placeholder="https://www.amazon.com/dp/..."
                    value={productUrl}
                    onChange={(e) => setProductUrl(e.target.value)}
                    className="mb-4"
                    aria-label="Product URL"
                  />
                  <Button
                    className="w-full"
                    onClick={handleUrlAnalyze}
                    disabled={!productUrl.trim() || analyzing}
                  >
                    {analyzing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Analyze from URL
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    Some sites may block automated access. Amazon can be unreliable; supplement retailers often work better.
                  </p>
                </div>
              )}

              {activeTab === 'paste' && (
                <div id="panel-paste" role="tabpanel" aria-labelledby="tab-paste">
                  <p className="text-sm text-muted-foreground mb-4">
                    Paste the supplement label, ingredient list, or product name.
                  </p>
                  <Textarea
                    placeholder="e.g. Optimum Nutrition Gold Standard Whey - 24g protein, 5.5g BCAAs, 4g glutamine per scoop. Ingredients: Whey Protein Isolate, Cocoa..."
                    value={pastedText}
                    onChange={(e) => setPastedText(e.target.value)}
                    rows={6}
                    className="resize-none"
                    aria-label="Supplement label or ingredient list"
                  />
                  <Button
                    className="w-full mt-4"
                    onClick={handlePasteAnalyze}
                    disabled={!pastedText.trim() || analyzing}
                  >
                    {analyzing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Analyze
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Error */}
          {error && (
            <Alert variant="destructive" className="mt-6">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Result */}
          {result && (
            <Card className="mt-6 border-cyan-500/20">
              <CardHeader>
                <CardTitle className="text-lg">
                  {result.productName ?? 'Supplement Analysis'}
                </CardTitle>
                <CardDescription>AI-generated educational analysis</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {result.ingredientBreakdown && result.ingredientBreakdown.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Ingredient Breakdown</h4>
                    <div className="space-y-3">
                      {result.ingredientBreakdown.map((ing, i) => (
                        <div key={i} className="border rounded-lg p-3 bg-muted/30">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="secondary">{ing.ingredient}</Badge>
                            {ing.commonlyDiscussedDose && (
                              <span className="text-xs text-muted-foreground">{ing.commonlyDiscussedDose}</span>
                            )}
                          </div>
                          <p className="text-sm">{ing.purpose}</p>
                          {ing.considerations && (
                            <p className="text-xs text-muted-foreground mt-1">{ing.considerations}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {result.stackInteractions && (
                  <div>
                    <h4 className="font-semibold mb-2">Stack Interactions</h4>
                    <p className="text-sm text-muted-foreground">{result.stackInteractions}</p>
                  </div>
                )}
                {result.bloodworkConsiderations && (
                  <div>
                    <h4 className="font-semibold mb-2">Bloodwork Considerations</h4>
                    <p className="text-sm text-muted-foreground">{result.bloodworkConsiderations}</p>
                  </div>
                )}
                {result.generalNotes && (
                  <p className="text-sm text-muted-foreground border-t pt-4">{result.generalNotes}</p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <SupplementScanner
        open={scannerOpen}
        onOpenChange={setScannerOpen}
        onScanSuccess={handleScanSuccess}
      />
    </TierGate>
  )
}
