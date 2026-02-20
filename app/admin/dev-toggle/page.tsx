'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ToggleLeft, ToggleRight, Lock } from 'lucide-react'
import Link from 'next/link'

/**
 * Hidden page to toggle dev_mode_enabled for the current user.
 * Protected by secret - enter DEV_TOGGLE_SECRET to enable/disable.
 * Add DEV_TOGGLE_SECRET to .env.local
 */
export default function DevTogglePage() {
  const router = useRouter()
  const [secret, setSecret] = useState('')
  const [devModeEnabled, setDevModeEnabled] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [authenticated, setAuthenticated] = useState(false)

  useEffect(() => {
    fetch('/api/auth/user', { cache: 'no-store', credentials: 'include' })
      .then((res) => {
        if (!res.ok) {
          router.replace('/login?redirectTo=/admin/dev-toggle')
          return null
        }
        return res.json()
      })
      .then((data) => {
        if (data) {
          setDevModeEnabled(!!data.dev_mode_enabled)
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [router])

  const handleToggle = async () => {
    if (!secret.trim()) {
      setMessage({ type: 'error', text: 'Enter the dev toggle secret.' })
      return
    }
    setToggling(true)
    setMessage(null)
    try {
      const res = await fetch(`/api/admin/dev-toggle?secret=${encodeURIComponent(secret)}`, {
        method: 'POST',
        credentials: 'include',
      })
      const data = await res.json()
      if (res.ok) {
        setDevModeEnabled(data.dev_mode_enabled)
        setMessage({ type: 'success', text: data.message })
        setAuthenticated(true)
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to toggle' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Request failed' })
    } finally {
      setToggling(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-md">
        <div className="mb-8">
          <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
            ← Back to Dashboard
          </Link>
        </div>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Lock className="h-6 w-6" />
              Dev Mode Toggle
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Toggle dev_mode_enabled to access unfinished features (e.g. Progress Photos).
            </p>
          </div>

          <div className="rounded-lg border bg-card p-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Dev mode</span>
              <span className="text-sm text-muted-foreground">
                {devModeEnabled === null ? '—' : devModeEnabled ? (
                  <span className="text-green-600 dark:text-green-400">ON</span>
                ) : (
                  <span className="text-muted-foreground">OFF</span>
                )}
              </span>
            </div>

            <div className="space-y-2">
              <Label htmlFor="secret">Secret</Label>
              <Input
                id="secret"
                type="password"
                placeholder="Enter DEV_TOGGLE_SECRET"
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleToggle()}
              />
            </div>

            <Button
              onClick={handleToggle}
              disabled={toggling || !secret.trim()}
              className="w-full"
            >
              {toggling ? (
                'Toggling...'
              ) : devModeEnabled ? (
                <>
                  <ToggleRight className="h-4 w-4 mr-2" />
                  Turn Off Dev Mode
                </>
              ) : (
                <>
                  <ToggleLeft className="h-4 w-4 mr-2" />
                  Turn On Dev Mode
                </>
              )}
            </Button>
          </div>

          {message && (
            <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
              <AlertDescription>{message.text}</AlertDescription>
            </Alert>
          )}

          {authenticated && devModeEnabled && (
            <p className="text-sm text-muted-foreground">
              Refresh the app. Dev-gated features:{' '}
              <Link href="/progress-photos" className="text-primary underline">Progress Photos</Link>
              ,{' '}
              <Link href="/results-forecaster" className="text-primary underline">Results Forecaster</Link>
              ,{' '}
              <Link href="/recovery-timeline" className="text-primary underline">Recovery Timeline</Link>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
