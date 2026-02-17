'use client'

import { useEffect, useState } from 'react'

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const getUser = async () => {
      const response = await fetch('/api/auth/user')
      if (response.ok) {
        const userData = await response.json()
        setUser(userData)
      }
    }
    getUser()
  }, [])

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Welcome back, {user.email?.split('@')[0]}
          </h1>
          <p className="text-muted-foreground">
            Here's an overview of your health optimization analysis.
          </p>
        </div>

        <div className="text-center py-12">
          <p className="text-lg">Dashboard loading...</p>
        </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Access your most used features
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/compounds">
                <Button className="w-full justify-start" variant="outline">
                  <Pill className="mr-2 h-4 w-4" />
                  Compound Database
                </Button>
              </Link>
              <Link href="/stack-explorer">
                <Button className="w-full justify-start" variant="outline">
                  <Search className="mr-2 h-4 w-4" />
                  Stack Explorer
                </Button>
              </Link>
              <Link href="/side-effects">
                <Button className="w-full justify-start" variant="outline">
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Side Effects Monitor
                </Button>
              </Link>
              <Link href="/bloodwork-parser">
                <Button className="w-full justify-start" variant="outline">
                  <FileText className="mr-2 h-4 w-4" />
                  Bloodwork Parser
                </Button>
              </Link>
              <Link href="/progress-photos">
                <Button className="w-full justify-start" variant="outline">
                  <Camera className="mr-2 h-4 w-4" />
                  Progress Photos
                </Button>
              </Link>
              <Link href="/results-forecaster">
                <Button className="w-full justify-start" variant="outline">
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Results Forecaster
                </Button>
              </Link>
              <Link href="/recovery-timeline">
                <Button className="w-full justify-start" variant="outline">
                  <Clock className="mr-2 h-4 w-4" />
                  Recovery Timeline
                </Button>
              </Link>
              <Link href="/counterfeit-checker">
                <Button className="w-full justify-start" variant="outline">
                  <Shield className="mr-2 h-4 w-4" />
                  Counterfeit Checker
                </Button>
              </Link>
              <Link href="/telehealth-referral">
                <Button className="w-full justify-start" variant="outline">
                  <Stethoscope className="mr-2 h-4 w-4" />
                  Telehealth Referral
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Your latest health insights
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium">Vitamin D levels improved</p>
                    <p className="text-xs text-muted-foreground">2 hours ago</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium">Potential interaction detected</p>
                    <p className="text-xs text-muted-foreground">1 day ago</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium">New compound analysis completed</p>
                    <p className="text-xs text-muted-foreground">3 days ago</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
  )
}