'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertTriangle, Loader2, User, Target } from 'lucide-react'

const SEX_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' }
]

const PED_EXPERIENCE_OPTIONS = [
  { value: 'none', label: 'None (New to PEDs)' },
  { value: 'beginner', label: 'Beginner (Some experience)' },
  { value: 'intermediate', label: 'Intermediate (Moderate experience)' },
  { value: 'advanced', label: 'Advanced (Extensive experience)' }
]

const PRIMARY_GOAL_OPTIONS = [
  'Contest Prep',
  'Lean Bulk',
  'Cut',
  'TRT Optimization',
  'Strength Gains',
  'Strength Density',
  'General Health Optimization',
  'Recovery Enhancement',
  'Endurance Improvement',
  'Body Recomposition',
  'Other'
]

function OnboardingContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') || '/dashboard'
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [alreadyCompleted, setAlreadyCompleted] = useState(false)

  const [age, setAge] = useState('')
  const [sex, setSex] = useState('')
  const [pedExperienceLevel, setPedExperienceLevel] = useState('')
  const [primaryGoal, setPrimaryGoal] = useState('')
  const [allowAnonymizedInsights, setAllowAnonymizedInsights] = useState(false)

  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch('/api/onboarding')
        if (res.status === 401) {
          router.replace(`/login?redirectTo=${encodeURIComponent(redirectTo)}`)
          return
        }
        if (res.ok) {
          const data = await res.json()
          if (data) {
            setAlreadyCompleted(true)
            setAge(String(data.age ?? ''))
            setSex(data.sex ?? '')
            setPedExperienceLevel(data.ped_experience_level ?? '')
            setPrimaryGoal(data.primary_goal ?? '')
            router.replace(redirectTo)
            return
          }
        }
        const consentRes = await fetch('/api/consent')
        if (consentRes.ok) {
          const consent = await consentRes.json()
          setAllowAnonymizedInsights(consent.has_consented ?? false)
        }
      } catch {
        router.replace('/login?redirectTo=/onboarding')
      } finally {
        setLoading(false)
      }
    }
    check()
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSaving(true)

    const ageNum = parseInt(age, 10)
    if (isNaN(ageNum) || ageNum < 18 || ageNum > 120) {
      setError('Please enter a valid age (18–120)')
      setSaving(false)
      return
    }

    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          age: ageNum,
          sex,
          ped_experience_level: pedExperienceLevel,
          primary_goal: primaryGoal,
          allow_anonymized_insights: allowAnonymizedInsights
        })
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save')
      }

      router.replace(redirectTo)
    } catch (err: any) {
      setError(err.message || 'Failed to save onboarding')
    } finally {
      setSaving(false)
    }
  }

  const canSubmit = age && sex && pedExperienceLevel && primaryGoal

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-lg mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Welcome to Enhanced.AI</h1>
          <p className="text-muted-foreground">
            A few quick questions help us tailor your experience and provide better insights.
          </p>
        </div>

        <Alert className="mb-6 border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            All data is used only to personalize your analysis. We never share identifiable information.
          </AlertDescription>
        </Alert>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Survey
              </CardTitle>
              <CardDescription>
                Required fields for tailoring your Stack Explorer and insights.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="age">Age *</Label>
                <Input
                  id="age"
                  type="number"
                  min={18}
                  max={120}
                  placeholder="e.g. 35"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  required
                />
              </div>

              <div>
                <Label>Sex *</Label>
                <Select value={sex} onValueChange={setSex} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {SEX_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>PED Experience Level *</Label>
                <Select value={pedExperienceLevel} onValueChange={setPedExperienceLevel} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {PED_EXPERIENCE_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Primary Goal *</Label>
                <Select value={primaryGoal} onValueChange={setPrimaryGoal} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIMARY_GOAL_OPTIONS.map((o) => (
                      <SelectItem key={o} value={o}>
                        {o}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-start gap-3 rounded-lg border p-4">
                <Checkbox
                  id="consent"
                  checked={allowAnonymizedInsights}
                  onCheckedChange={(c) => setAllowAnonymizedInsights(!!c)}
                />
                <div className="space-y-1">
                  <Label htmlFor="consent" className="cursor-pointer font-medium">
                    Allow anonymized data for community insights
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Your data may be aggregated (age bucket, sex, experience, goal) to power insights like &quot;Users your age on contest prep report average X HDL drop.&quot; No personally identifiable data is shared.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="mt-6 flex justify-end">
            <Button type="submit" disabled={!canSubmit || saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Continue to Dashboard'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    }>
      <OnboardingContent />
    </Suspense>
  )
}
