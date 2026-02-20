'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Lock,
} from 'lucide-react'

interface ComplianceFlag {
  id: string
  created_at: string
  user_id: string | null
  route: string
  query: string | null
  output: string | null
  flags: string[]
  severity: 'low' | 'medium' | 'high'
  acknowledged: boolean
  acknowledged_at: string | null
}

export default function AdminCompliancePage() {
  const router = useRouter()
  const [flags, setFlags] = useState<ComplianceFlag[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [acknowledgingId, setAcknowledgingId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [offset, setOffset] = useState(0)
  const limit = 50

  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)

  useEffect(() => {
    fetch('/api/auth/user', { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.dev_mode_enabled) {
          setIsAdmin(true)
        } else {
          setIsAdmin(false)
        }
      })
      .catch(() => setIsAdmin(false))
  }, [])

  const fetchFlags = async (off = 0) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/compliance-flags?limit=${limit}&offset=${off}`, {
        credentials: 'include',
      })
      if (res.status === 401) {
        router.replace('/login?redirectTo=/admin/compliance')
        return
      }
      if (res.status === 403) {
        setError('Admin access required. Enable dev mode via /admin/dev-toggle.')
        setFlags([])
        return
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error || 'Failed to fetch flags')
        return
      }
      const data = await res.json()
      setFlags(data.flags ?? [])
    } catch {
      setError('Request failed')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isAdmin) fetchFlags(offset)
  }, [offset, isAdmin])

  const handleAcknowledge = async (id: string) => {
    setAcknowledgingId(id)
    try {
      const res = await fetch(`/api/admin/compliance-flags/${id}`, {
        method: 'PATCH',
        credentials: 'include',
      })
      if (res.ok) {
        setFlags((prev) =>
          prev.map((f) =>
            f.id === id ? { ...f, acknowledged: true, acknowledged_at: new Date().toISOString() } : f
          )
        )
      }
    } catch {
      // Ignore
    } finally {
      setAcknowledgingId(null)
    }
  }

  const formatDate = (s: string) =>
    new Date(s).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })

  const getSeverityColor = (s: string) => {
    switch (s) {
      case 'high':
        return 'bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-300'
      case 'medium':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300'
      default:
        return 'bg-muted text-muted-foreground'
    }
  }

  if (isAdmin === false) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md">
          <Lock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-lg font-semibold mb-2">Admin Access Required</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Enable dev mode via the Dev Mode Toggle to access compliance flags.
          </p>
          <Link href="/admin/dev-toggle" className="text-sm text-primary underline">
            Go to Dev Mode Toggle
          </Link>
        </div>
      </div>
    )
  }

  if (loading && flags.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Loading compliance flags...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="mb-8">
          <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
            ← Back to Dashboard
          </Link>
        </div>

        <div className="flex items-center gap-2 mb-6">
          <Lock className="h-6 w-6 text-muted-foreground" />
          <h1 className="text-2xl font-bold text-foreground">Compliance Flags</h1>
        </div>
        <p className="text-muted-foreground text-sm mb-6">
          Internal review of Grok output scans. Only visible to admins (dev_mode_enabled).
        </p>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex items-center gap-2 mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchFlags(offset)}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {offset > 0 && (
            <Button variant="ghost" size="sm" onClick={() => setOffset((o) => Math.max(0, o - limit))}>
              ← Previous
            </Button>
          )}
          {flags.length === limit && (
            <Button variant="ghost" size="sm" onClick={() => setOffset((o) => o + limit)}>
              Next →
            </Button>
          )}
        </div>

        {flags.length === 0 && !error ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No compliance flags yet.</p>
              <p className="text-sm mt-1">Flags are logged when Grok outputs trigger compliance rules.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {flags.map((flag) => (
              <Card key={flag.id} className={flag.acknowledged ? 'opacity-75' : ''}>
                <CardHeader className="py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <Badge className={getSeverityColor(flag.severity)}>{flag.severity}</Badge>
                        <span className="text-sm text-muted-foreground">{flag.route}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(flag.created_at)}
                        </span>
                        {flag.acknowledged && (
                          <Badge variant="outline" className="text-green-600 border-green-500/50">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Acknowledged
                          </Badge>
                        )}
                      </div>
                      {flag.query && (
                        <p className="text-sm text-muted-foreground truncate" title={flag.query}>
                          Query: {flag.query.slice(0, 120)}...
                        </p>
                      )}
                    </div>
                    {!flag.acknowledged && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAcknowledge(flag.id)}
                        disabled={acknowledgingId === flag.id}
                      >
                        {acknowledgingId === flag.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          'Acknowledge'
                        )}
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-0 space-y-2">
                  <div className="flex flex-wrap gap-1">
                    {flag.flags.map((f, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {f}
                      </Badge>
                    ))}
                  </div>
                  <button
                    type="button"
                    className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                    onClick={() => setExpandedId(expandedId === flag.id ? null : flag.id)}
                  >
                    {expandedId === flag.id ? (
                      <ChevronUp className="h-3 w-3" />
                    ) : (
                      <ChevronDown className="h-3 w-3" />
                    )}
                    {expandedId === flag.id ? 'Hide output' : 'Show output'}
                  </button>
                  {expandedId === flag.id && flag.output && (
                    <pre className="text-xs bg-muted p-3 rounded-md overflow-auto max-h-48 whitespace-pre-wrap break-words">
                      {flag.output}
                    </pre>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
