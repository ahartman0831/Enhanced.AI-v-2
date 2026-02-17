'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { DoctorPdfButton } from '@/components/DoctorPdfButton'
import {
  Stethoscope,
  FileText,
  AlertTriangle,
  Loader2,
  CheckCircle,
  User,
  Activity,
  Calendar,
  Shield
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
  symptomReport: string
  consultationFocus: string[]
  providerNotes: string
}

export default function TelehealthReferralPage() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [result, setResult] = useState<ReferralPackageResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleGenerateReferral = async () => {
    setIsGenerating(true)
    setError(null)

    try {
      const response = await fetch('/api/telehealth-referral', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate referral package')
      }

      setResult(data.data)

    } catch (err: any) {
      setError(err.message || 'An error occurred while generating referral package')
    } finally {
      setIsGenerating(false)
    }
  }

  const resetReferral = () => {
    setResult(null)
    setError(null)
  }

  return (
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
              </CardContent>
            </Card>

            {/* Error Display */}
            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Generate Button */}
            <div className="flex justify-center">
              <Button
                onClick={handleGenerateReferral}
                disabled={isGenerating}
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating Referral Package...
                  </>
                ) : (
                  'Generate Referral Package'
                )}
              </Button>
            </div>
          </div>
        ) : (
          /* Results Display */
          <div className="space-y-8">
            {/* Success Message */}
            <Alert className="border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                <strong>Referral Package Generated:</strong> Your professional referral package is ready for download and use with healthcare providers.
              </AlertDescription>
            </Alert>

            {/* Referral Package Display */}
            <Card>
              <CardHeader>
                <CardTitle>Telehealth Consultation Referral Package</CardTitle>
                <CardDescription>
                  Professional documentation formatted for healthcare provider review
                </CardDescription>
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

            {/* PDF Download */}
            <div className="flex justify-center">
              <DoctorPdfButton
                patientData={{
                  name: 'Telehealth Referral Package',
                  id: 'telehealth-referral',
                  analysis: result
                }}
                analysisType="telehealth-referral"
              />
            </div>

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
  )
}