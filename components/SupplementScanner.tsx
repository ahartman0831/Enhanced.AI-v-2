'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, X, Camera, ImagePlus, AlertTriangle, CheckCircle } from 'lucide-react'

const SCAN_TIMEOUT_MS = 30_000

export interface SupplementScannerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onScanSuccess: (barcode: string, productName?: string) => void
}

export function SupplementScanner({ open, onOpenChange, onScanSuccess }: SupplementScannerProps) {
  const [status, setStatus] = useState<'idle' | 'requesting' | 'scanning' | 'success' | 'error' | 'timeout' | 'no-camera'>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [scannedCode, setScannedCode] = useState<string | null>(null)
  const containerId = useRef(`supplement-scanner-${Date.now()}`)
  const html5QrRef = useRef<import('html5-qrcode').Html5Qrcode | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const stopScan = useCallback(async () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    if (html5QrRef.current?.isScanning) {
      try {
        await html5QrRef.current.stop()
      } catch {
        // ignore
      }
      html5QrRef.current = null
    }
    setStatus((s) => (s === 'scanning' || s === 'requesting' ? 'idle' : s))
  }, [])

  const startCameraScan = useCallback(async () => {
    if (typeof window === 'undefined') return
    setStatus('requesting')
    setErrorMessage(null)

    try {
      const { Html5Qrcode } = await import('html5-qrcode')
      const elementId = containerId.current
      const element = document.getElementById(elementId)
      if (!element) {
        setErrorMessage('Scanner container not found')
        setStatus('error')
        return
      }

      const html5Qr = new Html5Qrcode(elementId, { verbose: false })
      html5QrRef.current = html5Qr

      await html5Qr.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 120 },
          videoConstraints: { facingMode: 'environment' },
        },
        (decodedText) => {
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current)
            timeoutRef.current = null
          }
          html5Qr.stop().catch(() => {})
          html5QrRef.current = null
          setScannedCode(decodedText)
          setStatus('success')
          // Brief delay then call success
          setTimeout(() => {
            onScanSuccess(decodedText)
            onOpenChange(false)
          }, 800)
        },
        () => {
          // Error callback - no code found this frame, ignore
        }
      )

      setStatus('scanning')

      timeoutRef.current = setTimeout(() => {
        timeoutRef.current = null
        if (html5QrRef.current?.isScanning) {
          html5Qr.stop().catch(() => {})
          html5QrRef.current = null
        }
        setStatus('timeout')
        setErrorMessage('Scan timed out after 30 seconds. Try upload or paste instead.')
      }, SCAN_TIMEOUT_MS)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to start camera'
      setErrorMessage(
        msg.includes('Permission') || msg.includes('permission')
          ? 'Camera permission denied. Use upload or paste instead.'
          : msg.includes('NotFound') || msg.includes('not found')
            ? 'No camera found. Use upload or paste instead.'
            : `Camera error: ${msg}`
      )
      setStatus('error')
      html5QrRef.current = null
    }
  }, [onScanSuccess, onOpenChange])

  const handleFileScan = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return
      e.target.value = ''

      setStatus('requesting')
      setErrorMessage(null)

      try {
        const { Html5Qrcode } = await import('html5-qrcode')
        const scanId = `file-scan-${Date.now()}`
        const el = document.createElement('div')
        el.id = scanId
        el.style.display = 'none'
        document.body.appendChild(el)
        const html5Qr = new Html5Qrcode(scanId, { verbose: false })
        const result = await html5Qr.scanFileV2(file, false)
        document.body.removeChild(el)
        setScannedCode(result.decodedText)
        setStatus('success')
        setTimeout(() => {
          onScanSuccess(result.decodedText)
          onOpenChange(false)
        }, 800)
      } catch {
        setErrorMessage('No barcode found in image. Try a clearer photo or paste the label text.')
        setStatus('error')
      }
    },
    [onScanSuccess, onOpenChange]
  )

  useEffect(() => {
    if (!open) {
      stopScan()
      setStatus('idle')
      setErrorMessage(null)
      setScannedCode(null)
    } else {
      setStatus('idle')
      setErrorMessage(null)
      setScannedCode(null)
      // Auto-start camera when modal opens (after a brief delay for DOM)
      const t = setTimeout(() => startCameraScan(), 300)
      return () => clearTimeout(t)
    }
  }, [open, stopScan, startCameraScan])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      html5QrRef.current?.stop().catch(() => {})
    }
  }, [])

  const handleClose = () => {
    stopScan()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="max-w-full w-full h-[90vh] max-h-[90vh] p-0 gap-0 bg-black border-red-500/30"
        aria-label="Barcode scanner"
        aria-describedby="scanner-desc"
      >
        <DialogHeader className="absolute top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-black/80 to-transparent">
          <DialogTitle className="text-white">Scan Supplement Barcode</DialogTitle>
          <DialogDescription id="scanner-desc" className="text-gray-300">
            Position the barcode within the frame. Use rear camera on mobile.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex flex-col relative overflow-hidden">
          {/* Camera / Scanner area */}
          <div className="flex-1 relative min-h-[300px] bg-black">
            <div
              id={containerId.current}
              className="w-full h-full min-h-[300px]"
              style={{ maxHeight: '70vh' }}
              aria-live="polite"
              aria-busy={status === 'scanning' || status === 'requesting'}
            />
            {/* Overlay guide */}
            {status === 'scanning' && (
              <div
                className="absolute inset-0 pointer-events-none flex items-center justify-center"
                aria-hidden
              >
                <div className="border-2 border-cyan-500/80 rounded-lg w-64 h-28 bg-transparent" />
              </div>
            )}

            {/* Loading */}
            {(status === 'requesting' || status === 'idle') && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 gap-4">
                {status === 'requesting' && (
                  <>
                    <Loader2 className="h-12 w-12 animate-spin text-cyan-500" />
                    <p className="text-white">Starting camera...</p>
                  </>
                )}
                {status === 'idle' && (
                  <p className="text-gray-400">Click &quot;Start Camera&quot; to begin</p>
                )}
              </div>
            )}

            {/* Success */}
            {status === 'success' && scannedCode && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 gap-4">
                <CheckCircle className="h-16 w-16 text-green-500" />
                <p className="text-white font-semibold">Scanned: {scannedCode}</p>
                <p className="text-gray-400 text-sm">Analyzing...</p>
              </div>
            )}

            {/* Error / Timeout */}
            {(status === 'error' || status === 'timeout' || status === 'no-camera') && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 gap-4 p-4">
                <AlertTriangle className="h-12 w-12 text-amber-500" />
                <p className="text-white text-center">{errorMessage}</p>
                <p className="text-gray-400 text-sm text-center">
                  Use &quot;Upload Image&quot; or &quot;Paste Text&quot; instead.
                </p>
                <Button variant="outline" onClick={handleClose} className="border-white/30 text-white">
                  Close
                </Button>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="p-4 bg-black border-t border-red-500/20 flex flex-col sm:flex-row gap-2">
            {status === 'scanning' && (
              <Button
                variant="destructive"
                className="flex-1"
                onClick={stopScan}
                aria-label="Stop scanning"
              >
                <X className="h-4 w-4 mr-2" />
                Stop Scan
              </Button>
            )}
            {(status === 'idle' || status === 'error' || status === 'timeout') && (
              <>
                <Button
                  className="flex-1 bg-red-600 hover:bg-red-700"
                  onClick={startCameraScan}
                  disabled={status === 'requesting'}
                  aria-label="Start camera for barcode scan"
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Start Camera
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 border-white/30 text-white hover:bg-white/10"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImagePlus className="h-4 w-4 mr-2" />
                  Scan from Image
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileScan}
                  className="hidden"
                  aria-label="Scan barcode from image file"
                />
              </>
            )}
            <Button variant="ghost" onClick={handleClose} className="text-gray-400 hover:text-white">
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
