'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Shield, CheckCircle } from 'lucide-react'

export function DisclaimerModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [hasAccepted, setHasAccepted] = useState(false)

  useEffect(() => {
    // Check if user has already accepted disclaimer
    const accepted = localStorage.getItem('disclaimer-accepted')
    if (!accepted) {
      setIsOpen(true)
    }
  }, [])

  const handleAccept = () => {
    if (hasAccepted) {
      localStorage.setItem('disclaimer-accepted', 'true')
      setIsOpen(false)
    }
  }

  const handleDecline = () => {
    // Redirect to external educational resource or close app
    window.location.href = 'https://www.healthline.com/health/understanding-health'
  }

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto" hideCloseButton>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Shield className="h-6 w-6 text-primary" />
            Important Medical Disclaimer
          </DialogTitle>
          <DialogDescription className="text-base">
            Before using Enhanced.AI, you must read and acknowledge this critical medical disclaimer.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Main Disclaimer */}
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
              <div className="space-y-3">
                <h3 className="font-semibold text-destructive">Educational Purpose Only</h3>
                <div className="space-y-2 text-sm">
                  <p>
                    <strong>Enhanced.AI is NOT a medical service and does NOT provide medical advice, diagnosis, or treatment.</strong>
                  </p>
                  <p>
                    All information provided on this platform is for <strong>educational purposes only</strong> and should not be used as a substitute for professional medical care.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Key Warnings */}
          <div className="space-y-4">
            <h4 className="font-semibold text-lg">Critical Safety Information:</h4>

            <div className="grid gap-3">
              <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <strong>Always Consult Healthcare Professionals:</strong> Never start, stop, or modify any supplementation, medication, or health regimen without direct supervision from qualified healthcare providers.
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <strong>Individual Variability:</strong> Responses to any intervention can vary significantly between individuals. What works for one person may not work for another, and may even be harmful.
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <strong>No Medical Diagnosis:</strong> This platform does not diagnose medical conditions, prescribe treatments, or interpret medical tests as a substitute for professional medical evaluation.
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <strong>Bloodwork & Monitoring:</strong> Regular bloodwork and health monitoring by qualified professionals is essential when considering any health interventions.
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <strong>Emergency Situations:</strong> If you experience any adverse symptoms or medical emergencies, immediately seek emergency medical care.
                </div>
              </div>
            </div>
          </div>

          {/* Platform Purpose */}
          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Platform Purpose:</h4>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              Enhanced.AI provides educational information about health optimization concepts discussed in wellness communities.
              Our goal is to facilitate informed discussions between users and their healthcare providers by providing educational context and analysis tools.
            </p>
          </div>

          {/* Legal Notice */}
          <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
            <strong>Legal Notice:</strong> By using Enhanced.AI, you acknowledge that you have read, understood, and agree to abide by this disclaimer.
            The platform creators, contributors, and associated parties are not liable for any actions taken based on information provided here.
            Always prioritize evidence-based medical care from licensed healthcare professionals.
          </div>

          {/* Acceptance Checkbox */}
          <div className="flex items-start gap-3 p-4 bg-muted/30 rounded-lg">
            <input
              type="checkbox"
              id="disclaimer-accept"
              checked={hasAccepted}
              onChange={(e) => setHasAccepted(e.target.checked)}
              className="mt-1 h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
            />
            <label htmlFor="disclaimer-accept" className="text-sm cursor-pointer">
              <strong>I have read and understand this medical disclaimer.</strong> I acknowledge that this platform provides educational information only and does not constitute medical advice.
              I agree to consult qualified healthcare professionals for any medical decisions and to use this platform responsibly.
            </label>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleDecline}
            className="flex-1"
          >
            I Do Not Agree
          </Button>
          <Button
            onClick={handleAccept}
            disabled={!hasAccepted}
            className="flex-1"
          >
            I Agree & Continue
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}