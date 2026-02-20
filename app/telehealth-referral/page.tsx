'use client'

import { useState } from 'react'
import { TierGate } from '@/components/TierGate'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { UpdateInfoModal } from '@/components/UpdateInfoModal'
import {
  Stethoscope,
  FileText,
  AlertTriangle,
  Loader2,
  CheckCircle,
  User,
  Activity,
  Calendar,
  Shield,
  Pill,
  Droplet,
  ClipboardList,
  Eye,
  Download
} from 'lucide-react'

interface ReferralPackageResult {
  patientInfo: {
    name: string
    consultationType: string
    referralDate: string
    urgency: string
  }
  healthHistory: string
  currentProtocol: string
  labResults: string
  sideEffectsReport?: string
  symptomReport: string
  consultationFocus: string[]
  providerNotes: string
}

export default function TelehealthReferralPage() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [result, setResult] = useState<ReferralPackageResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [includeCompounds, setIncludeCompounds] = useState(true)
  const [includeSideEffects, setIncludeSideEffects] = useState(true)
  const [includeBloodwork, setIncludeBloodwork] = useState(true)
  const [updateModalOpen, setUpdateModalOpen] = useState(false)
  const [generatedWithUpdatedInfo, setGeneratedWithUpdatedInfo] = useState(false)
  const [isPdfLoading, setIsPdfLoading] = useState<'view' | 'download' | null>(null)
  const [pdfError, setPdfError] = useState<string | null>(null)

  const callTelehealthApi = async () => {
    const response = await fetch('/api/telehealth-referral', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        includeCompounds,
        includeSideEffects,
        includeBloodwork,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      const msg = data.error || 'Failed to generate referral package'
      const flags = data.flags as string[] | undefined
      throw new Error(flags?.length ? `${msg} Flagged: ${flags.join(', ')}` : msg)
    }

    setResult(data.data)
  }

  const handleGenerateReferral = async () => {
    setIsGenerating(true)
    setError(null)

    try {
      await callTelehealthApi()
    } catch (err: any) {
      setError(err.message || 'An error occurred while generating referral package')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSaveAndGenerate = async (
    compounds: string[],
    dosages: string,
    sideEffects: string[],
    additionalSupplements?: string
  ) => {
    setIsGenerating(true)
    setError(null)

    try {
      const saveRes = await fetch('/api/side-effects/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          compounds,
          dosages,
          sideEffects,
          additionalSupplements,
        }),
      })

      if (!saveRes.ok) {
        const errData = await saveRes.json().catch(() => ({}))
        throw new Error(errData.error || 'Failed to save compounds and side effects')
      }

      setGeneratedWithUpdatedInfo(true)
      await callTelehealthApi()
    } catch (err: any) {
      setError(err.message || 'An error occurred')
      throw err
    } finally {
      setIsGenerating(false)
    }
  }

  const handleGenerateWithLastKnown = async () => {
    setIsGenerating(true)
    setError(null)
    setGeneratedWithUpdatedInfo(false)

    try {
      await callTelehealthApi()
    } catch (err: any) {
      setError(err.message || 'An error occurred while generating referral package')
      throw err
    } finally {
      setIsGenerating(false)
    }
  }

  const resetReferral = () => {
    setResult(null)
    setError(null)
    setGeneratedWithUpdatedInfo(false)
    setPdfError(null)
  }

  const fetchPdfBlob = async (): Promise<Blob> => {
    const response = await fetch('/api/generate-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        analysisType: 'telehealth-referral',
        patientData: {
          name: 'Telehealth Referral Package',
          id: 'telehealth-referral',
          analysis: result,
        },
      }),
    })
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}))
      throw new Error(errData.error || 'Failed to generate PDF')
    }
    return response.blob()
  }

  const handleViewReport = async () => {
    if (!result) return
    setIsPdfLoading('view')
    setPdfError(null)
    try {
      const blob = await fetchPdfBlob()
      const url = window.URL.createObjectURL(blob)
      window.open(url, '_blank', 'noopener,noreferrer')
      setTimeout(() => window.URL.revokeObjectURL(url), 10000)
    } catch (err: any) {
      setPdfError(err.message || 'Failed to open report')
    } finally {
      setIsPdfLoading(null)
    }
  }

  const handleDownloadReport = async () => {
    if (!result) return
    setIsPdfLoading('download')
    setPdfError(null)
    try {
      const blob = await fetchPdfBlob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'Telehealth_Referral_Package_medical_summary.pdf'
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err: any) {
      setPdfError(err.message || 'Failed to download report')
    } finally {
      setIsPdfLoading(null)
    }
  }

  return (
    <TierGate>
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Telehealth Referral</h1>
          <p className="text-muted-foreground">
            Generate professional referral packages for telehealth consultations.
          </p>
        </div>

        {/* Disclaimer Banner */}
        <Alert className="mb-8 border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            <strong>Educational tool only. Not medical advice. Consult your physician.</strong> Referral packages are formatted for healthcare provider review and contain educational information only. Always consult qualified healthcare professionals for medical care.
          </AlertDescription>
        </Alert>

        {!result ? (
          /* Referral Generation Form */
          <div className="space-y-8">
            {/* Referral Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Stethoscope className="h-5 w-5" />
                  Telehealth Referral Package
                </CardTitle>
                <CardDescription>
                  Generate a comprehensive referral package using your health data for telehealth consultations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-semibold flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Data Sources Included
                    </h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• Profile information</li>
                      <li>• Current supplementation protocols</li>
                      <li>• Bloodwork results</li>
                      <li>• Progress photo reports</li>
                      <li>• Recent analyses</li>
                    </ul>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-semibold flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Package Contents
                    </h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• Professional patient summary</li>
                      <li>• Health history overview</li>
                      <li>• Current protocol details</li>
                      <li>• Laboratory results summary</li>
                      <li>• Recommended consultation focus</li>
                    </ul>
                  </div>
                </div>

                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Privacy Note:</strong> Referral packages are generated locally and contain only your educational health data.
                    No information is transmitted to external healthcare providers without your explicit consent.
                  </AlertDescription>
                </Alert>

                {/* Data inclusion options */}
                <div className="space-y-4 pt-4 border-t">
                  <h4 className="font-semibold">Include in referral package</h4>
                  <p className="text-sm text-muted-foreground">
                    Choose which data to include. Profile information is always included.
                  </p>
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="include-compounds"
                        checked={includeCompounds}
                        onCheckedChange={(c) => setIncludeCompounds(!!c)}
                      />
                      <Label htmlFor="include-compounds" className="flex items-center gap-2 cursor-pointer font-normal">
                        <Pill className="h-4 w-4" />
                        Compound usage & protocols
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="include-side-effects"
                        checked={includeSideEffects}
                        onCheckedChange={(c) => setIncludeSideEffects(!!c)}
                      />
                      <Label htmlFor="include-side-effects" className="flex items-center gap-2 cursor-pointer font-normal">
                        <ClipboardList className="h-4 w-4" />
                        Side effect logs
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="include-bloodwork"
                        checked={includeBloodwork}
                        onCheckedChange={(c) => setIncludeBloodwork(!!c)}
                      />
                      <Label htmlFor="include-bloodwork" className="flex items-center gap-2 cursor-pointer font-normal">
                        <Droplet className="h-4 w-4" />
                        Bloodwork data
                      </Label>
                    </div>
                  </div>
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

            {/* Generate Button - opens Update Info modal */}
            <div className="flex justify-center">
              <Button
                onClick={() => setUpdateModalOpen(true)}
                disabled={isGenerating}
                size="lg"
              >
                Generate Referral Package
              </Button>
            </div>

            <UpdateInfoModal
              open={updateModalOpen}
              onOpenChange={setUpdateModalOpen}
              onSaveAndGenerate={handleSaveAndGenerate}
              onGenerateWithLastKnown={handleGenerateWithLastKnown}
              isGenerating={isGenerating}
            />
          </div>
        ) : (
          /* Results Display */
          <div className="space-y-8">
            {/* Success Message + Download */}
            <Alert className="border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                <strong>
                  {generatedWithUpdatedInfo
                    ? 'Report generated with updated info – download below.'
                    : 'Referral Package Generated:'}
                </strong>{' '}
                {generatedWithUpdatedInfo
                  ? 'Your report reflects your current compounds and side effects. Self-reported data only – physician must verify.'
                  : 'Your professional referral package is ready for download and use with healthcare providers.'}
              </AlertDescription>
            </Alert>

            {/* View & Download - prominent colorful buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                onClick={handleViewReport}
                disabled={!!isPdfLoading}
                size="lg"
                className="bg-cyan-600 hover:bg-cyan-700 text-white shadow-lg shadow-cyan-500/25 font-semibold gap-2"
              >
                {isPdfLoading === 'view' ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Opening...
                  </>
                ) : (
                  <>
                    <Eye className="h-5 w-5" />
                    View Report
                  </>
                )}
              </Button>
              <Button
                onClick={handleDownloadReport}
                disabled={!!isPdfLoading}
                size="lg"
                className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/25 font-semibold gap-2"
              >
                {isPdfLoading === 'download' ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Downloading...
                  </>
                ) : (
                  <>
                    <Download className="h-5 w-5" />
                    Download Report (PDF)
                  </>
                )}
              </Button>
            </div>
            {pdfError && (
              <Alert variant="destructive" className="max-w-md mx-auto">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{pdfError}</AlertDescription>
              </Alert>
            )}

            {/* Referral Package Display */}
            <Card>
              <CardHeader>
                <div className="flex flex-col items-center gap-6 pb-4">
                  <img
                    src="https://gzqoufimouwzhondmkid.supabase.co/storage/v1/object/public/email-assets/logo.png"
                    alt="Enhanced.AI"
                    className="w-full max-w-md h-auto object-contain"
                  />
                  <div className="text-center space-y-1">
                    <CardTitle>Telehealth Consultation Referral Package</CardTitle>
                    <CardDescription>
                      Professional documentation formatted for healthcare provider review
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Patient Information */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Patient Information
                  </h3>
                  <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Consultation Type:</span> Health Optimization Consultation
                      </div>
                      <div>
                        <span className="font-medium">Urgency:</span> Routine (Educational Review)
                      </div>
                      <div>
                        <span className="font-medium">Referral Date:</span> {new Date().toLocaleDateString()}
                      </div>
                      <div>
                        <span className="font-medium">Status:</span>
                        <Badge variant="secondary" className="ml-2">Ready for Review</Badge>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Package Contents Preview */}
                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold mb-2">Package Includes:</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>• Comprehensive patient health summary</li>
                      <li>• Current supplementation protocol details</li>
                      <li>• Recent laboratory results overview</li>
                      <li>• Symptom and progress reports</li>
                      <li>• Recommended consultation focus areas</li>
                      <li>• Educational context and background</li>
                    </ul>
                  </div>

                  <Alert>
                    <FileText className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Professional Documentation:</strong> This referral package is formatted as professional medical documentation suitable for healthcare provider review.
                      It contains educational health information and serves as a comprehensive starting point for telehealth consultations.
                    </AlertDescription>
                  </Alert>

                  <div className="bg-muted/30 rounded-lg p-4">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Recommended Next Steps
                    </h4>
                    <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
                      <li>Download the referral package PDF</li>
                      <li>Share with your chosen healthcare provider</li>
                      <li>Schedule telehealth consultation</li>
                      <li>Bring additional medical records if requested</li>
                      <li>Prepare questions for your healthcare provider</li>
                    </ol>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Healthcare Provider Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Stethoscope className="h-5 w-5" />
                  Working with Healthcare Providers
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-2">What Healthcare Providers Need to Know</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>• Your health goals and concerns</li>
                      <li>• Current supplementation protocols</li>
                      <li>• Recent bloodwork and test results</li>
                      <li>• Any symptoms or side effects</li>
                      <li>• Your complete medical history</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Questions to Ask Your Provider</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>• Protocol safety and monitoring</li>
                      <li>• Required laboratory testing</li>
                      <li>• Individual risk assessment</li>
                      <li>• Treatment plan recommendations</li>
                      <li>• Follow-up schedule</li>
                    </ul>
                  </div>
                </div>

                <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800">
                  <Activity className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Important:</strong> Always verify healthcare provider credentials and ensure they are licensed in your jurisdiction.
                    Professional medical care should always take precedence over any educational information.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            {/* Generate New Referral Button */}
            <div className="flex justify-center">
              <Button onClick={resetReferral} variant="outline">
                Generate New Referral Package
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
    </TierGate>
  )
}