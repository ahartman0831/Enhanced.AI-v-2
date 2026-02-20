'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  User,
  Shield,
  Database,
  AlertTriangle,
  CheckCircle,
  Save,
  Eye,
  Star,
  Crown,
  Award,
  ArrowRight
} from 'lucide-react'
import { useSubscriptionTier } from '@/hooks/useSubscriptionTier'

const GOALS_OPTIONS = [
  'Contest Prep', 'Lean Bulk', 'Dirty Bulk', 'Cut', 'TRT Optimization',
  'Strength Gains', 'Strength Density', 'General Health Optimization',
  'Recovery Enhancement', 'Endurance Improvement', 'Body Recomposition', 'Other'
]

interface ProfileData {
  age: number | null
  sex: string | null
  weight_lbs: number | null
  goals: string | null
  experience_level: string | null
  risk_tolerance: string | null
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileData>({
    age: null,
    sex: null,
    weight_lbs: null,
    goals: null,
    experience_level: null,
    risk_tolerance: null
  })
  const [consentGiven, setConsentGiven] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const { tier, isPaid, isElite, loading: tierLoading } = useSubscriptionTier()

  useEffect(() => {
    fetchProfile()
    fetchConsentStatus()
  }, [])

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/profile')
      if (response.ok) {
        const data = await response.json()
        setProfile({
          age: data.age ?? null,
          sex: data.sex ?? null,
          weight_lbs: data.weight_lbs ?? null,
          goals: data.goals ?? null,
          experience_level: data.experience_level ?? null,
          risk_tolerance: data.risk_tolerance ?? null
        })
      }
    } catch (err: any) {
      setError('Failed to load profile')
    }
  }

  const fetchConsentStatus = async () => {
    try {
      const response = await fetch('/api/consent')
      if (response.ok) {
        const data = await response.json()
        setConsentGiven(data.has_consented)
      }
    } catch (err: any) {
      console.error('Failed to fetch consent status')
    } finally {
      setLoading(false)
    }
  }

  const handleProfileChange = (field: keyof ProfileData, value: any) => {
    setProfile(prev => ({ ...prev, [field]: value }))
  }

  const handleSaveProfile = async () => {
    setSaving(true)
    setError(null)
    setSuccess(null)

      try {
        const response = await fetch('/api/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            age: profile.age,
            sex: profile.sex,
            weight_lbs: profile.weight_lbs,
            goals: profile.goals,
            experience_level: profile.experience_level,
            risk_tolerance: profile.risk_tolerance
          })
        })

      if (!response.ok) {
        throw new Error('Failed to save profile')
      }

      setSuccess('Profile saved successfully!')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleConsentChange = async (consented: boolean) => {
    try {
      const response = await fetch('/api/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: consented ? 'consent' : 'revoke' })
      })

      if (!response.ok) {
        throw new Error('Failed to update consent')
      }

      const data = await response.json()
      setConsentGiven(consented)
      setSuccess(data.message)
    } catch (err: any) {
      setError(err.message)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Profile Settings</h1>
          <p className="text-muted-foreground">
            Manage your personal information and privacy preferences.
          </p>
        </div>

        {error && (
          <Alert className="mb-6 border-destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6 border-green-500 bg-green-50 dark:bg-green-950/20">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription className="text-green-800 dark:text-green-200">{success}</AlertDescription>
          </Alert>
        )}

        {/* Subscription Tier Card - click to manage */}
        <Link href="/subscription">
          <Card className="mb-8 border-cyan-500/20 bg-cyan-500/5 dark:bg-cyan-950/20 dark:border-cyan-800/50 hover:border-cyan-500/40 hover:bg-cyan-500/10 dark:hover:bg-cyan-950/30 transition-colors cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-cyan-500" />
                Subscription Plan
              </CardTitle>
              <CardDescription>
                Your current plan. Click to view tiers, features, pricing, and manage your subscription.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                {tierLoading ? (
                  <div className="h-9 w-24 animate-pulse rounded-md bg-muted" />
                ) : (
                  <Badge
                    variant="outline"
                    className={
                      tier === 'elite'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 border-amber-400 dark:border-amber-600'
                        : tier === 'paid'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-blue-300 dark:border-blue-700'
                          : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-600'
                    }
                  >
                    {tier === 'elite' && <Crown className="h-3.5 w-3.5 mr-1" />}
                    {tier === 'paid' && <Star className="h-3.5 w-3.5 mr-1" />}
                    {tier === 'free' && '🆓'}
                    {tier === 'elite' ? 'Elite' : tier === 'paid' ? 'Pro' : 'Free'}
                  </Badge>
                )}
                <div className="text-sm text-muted-foreground">
                  {tierLoading ? (
                    <span className="animate-pulse">Loading...</span>
                  ) : tier === 'elite' ? (
                    'Full access to all features including doctor consultations and lab partnerships.'
                  ) : tier === 'paid' ? (
                    'Stack Explorer, bloodwork analysis, progress photos, and side effects monitoring.'
                  ) : (
                    'Basic compound database and educational content.'
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-cyan-600 dark:text-cyan-400">
                View plans & manage
                <ArrowRight className="h-4 w-4" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Personal Information
              </CardTitle>
              <CardDescription>
                Your health optimization profile data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="age">Age</Label>
                  <Input
                    id="age"
                    type="number"
                    value={profile.age || ''}
                    onChange={(e) => handleProfileChange('age', e.target.value ? parseInt(e.target.value) : null)}
                    placeholder="Enter age"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="weight">Weight (lbs)</Label>
                  <Input
                    id="weight"
                    type="number"
                    step="0.1"
                    value={profile.weight_lbs || ''}
                    onChange={(e) => handleProfileChange('weight_lbs', e.target.value ? parseFloat(e.target.value) : null)}
                    placeholder="Enter weight in lbs"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sex">Sex</Label>
                <Select value={profile.sex || ''} onValueChange={(v) => handleProfileChange('sex', v || null)}>
                  <SelectTrigger id="sex">
                    <SelectValue placeholder="Select sex" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                    <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="experience">Experience Level</Label>
                <Select value={profile.experience_level || ''} onValueChange={(v) => handleProfileChange('experience_level', v || null)}>
                  <SelectTrigger id="experience">
                    <SelectValue placeholder="Select experience level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None (New to PEDs)</SelectItem>
                    <SelectItem value="beginner">Beginner (0-6 months)</SelectItem>
                    <SelectItem value="intermediate">Intermediate (6-24 months)</SelectItem>
                    <SelectItem value="advanced">Advanced (2+ years)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="risk-tolerance">Risk Tolerance</Label>
                <Select value={profile.risk_tolerance || ''} onValueChange={(v) => handleProfileChange('risk_tolerance', v || null)}>
                  <SelectTrigger id="risk-tolerance">
                    <SelectValue placeholder="Select risk tolerance" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low - Conservative approach</SelectItem>
                    <SelectItem value="medium">Medium - Balanced approach</SelectItem>
                    <SelectItem value="high">High - Aggressive optimization</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="goals">Primary Goal</Label>
                <Select
                  value={profile.goals && GOALS_OPTIONS.includes(profile.goals) ? profile.goals : 'Other'}
                  onValueChange={(v) => handleProfileChange('goals', v === 'Other' ? '' : v)}
                >
                  <SelectTrigger id="goals">
                    <SelectValue placeholder="Select primary goal" />
                  </SelectTrigger>
                  <SelectContent>
                    {GOALS_OPTIONS.map((opt) => (
                      <SelectItem key={opt} value={opt}>
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {(!profile.goals || !GOALS_OPTIONS.includes(profile.goals)) && (
                  <Textarea
                    placeholder="Describe your goals (when Other selected)"
                    value={profile.goals || ''}
                    onChange={(e) => handleProfileChange('goals', e.target.value || null)}
                    rows={2}
                    className="mt-2"
                  />
                )}
              </div>

              <Button onClick={handleSaveProfile} disabled={saving} className="w-full">
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Profile
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Privacy & Data Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Privacy & Data
              </CardTitle>
              <CardDescription>
                Control how your data is used
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Anonymized Insights Consent */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-base font-medium">Anonymized Community Insights</Label>
                    <p className="text-sm text-muted-foreground">
                      Help improve the platform by contributing anonymized health trends
                    </p>
                  </div>
                  <Switch
                    checked={consentGiven}
                    onCheckedChange={handleConsentChange}
                  />
                </div>

                <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <Eye className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium">What we collect:</p>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        <li>• Experience level and goals (no names)</li>
                        <li>• General health marker ranges</li>
                        <li>• Protocol categories (not specific compounds)</li>
                        <li>• Timeline data (in quarters, not exact dates)</li>
                      </ul>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Database className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium">How it's used:</p>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        <li>• Generate educational community trends</li>
                        <li>• Improve AI analysis accuracy</li>
                        <li>• Help users understand typical experiences</li>
                        <li>• Never shared with third parties</li>
                      </ul>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Shield className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Your privacy:</p>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        <li>• Data is irreversibly anonymized with SHA-256 hashing</li>
                        <li>• Minimum 10 users required for any trend</li>
                        <li>• You can revoke consent anytime</li>
                        <li>• Contributions deleted upon revocation</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {consentGiven && (
                  <Badge variant="secondary" className="w-full justify-center bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Contributing to Community Insights
                  </Badge>
                )}
              </div>

              <Separator />

              {/* Data Export/Deletion */}
              <div className="space-y-3">
                <Label className="text-base font-medium">Data Management</Label>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full">
                    <Database className="h-4 w-4 mr-2" />
                    Export My Data
                  </Button>
                  <Button variant="outline" className="w-full text-destructive hover:text-destructive">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Delete My Account
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Privacy Policy Footer */}
        <div className="mt-12 pt-8 border-t">
          <div className="text-center text-sm text-muted-foreground">
            <p className="mb-2">
              We never share identifiable data. Aggregated trends are educational only.
            </p>
            <a
              href="/privacy-policy"
              className="text-primary hover:underline"
            >
              Read our Privacy Policy →
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}