'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  User,
  Settings,
  Shield,
  Database,
  AlertTriangle,
  CheckCircle,
  Save,
  Eye,
  EyeOff
} from 'lucide-react'
import { useRouter } from 'next/navigation'

interface ProfileData {
  age: number | null
  sex: string | null
  weight_kg: number | null
  goals: string | null
  experience_level: string | null
  risk_tolerance: string | null
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileData>({
    age: null,
    sex: null,
    weight_kg: null,
    goals: null,
    experience_level: null,
    risk_tolerance: null
  })
  const [consentGiven, setConsentGiven] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    fetchProfile()
    fetchConsentStatus()
  }, [])

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/profile')
      if (response.ok) {
        const data = await response.json()
        setProfile(data)
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
        body: JSON.stringify(profile)
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
                  <Label htmlFor="weight">Weight (kg)</Label>
                  <Input
                    id="weight"
                    type="number"
                    step="0.1"
                    value={profile.weight_kg || ''}
                    onChange={(e) => handleProfileChange('weight_kg', e.target.value ? parseFloat(e.target.value) : null)}
                    placeholder="Enter weight"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sex">Sex</Label>
                <select
                  id="sex"
                  value={profile.sex || ''}
                  onChange={(e) => handleProfileChange('sex', e.target.value || null)}
                  className="w-full px-3 py-2 border border-input bg-background rounded-md"
                >
                  <option value="">Select sex</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="experience">Experience Level</Label>
                <select
                  id="experience"
                  value={profile.experience_level || ''}
                  onChange={(e) => handleProfileChange('experience_level', e.target.value || null)}
                  className="w-full px-3 py-2 border border-input bg-background rounded-md"
                >
                  <option value="">Select experience level</option>
                  <option value="beginner">Beginner (0-6 months)</option>
                  <option value="intermediate">Intermediate (6-24 months)</option>
                  <option value="advanced">Advanced (2+ years)</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="risk-tolerance">Risk Tolerance</Label>
                <select
                  id="risk-tolerance"
                  value={profile.risk_tolerance || ''}
                  onChange={(e) => handleProfileChange('risk_tolerance', e.target.value || null)}
                  className="w-full px-3 py-2 border border-input bg-background rounded-md"
                >
                  <option value="">Select risk tolerance</option>
                  <option value="low">Low - Conservative approach</option>
                  <option value="medium">Medium - Balanced approach</option>
                  <option value="high">High - Aggressive optimization</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="goals">Health Goals</Label>
                <Textarea
                  id="goals"
                  value={profile.goals || ''}
                  onChange={(e) => handleProfileChange('goals', e.target.value || null)}
                  placeholder="Describe your health and fitness goals..."
                  rows={3}
                />
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