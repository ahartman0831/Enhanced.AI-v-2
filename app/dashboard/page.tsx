'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CommunityInsightsCard } from '@/components/CommunityInsightsCard'

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const getUser = async () => {
      try {
        const response = await fetch('/api/auth/user')
        if (response.ok) {
          const userData = await response.json()
          setUser(userData)
        } else if (response.status === 401) {
          router.replace('/login?redirectTo=/dashboard')
          return
        }
      } catch {
        router.replace('/login?redirectTo=/dashboard')
        return
      } finally {
        setLoading(false)
      }
    }
    getUser()
  }, [router])

  if (loading || !user) {
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

        <div className="grid gap-6 md:grid-cols-2">
          <CommunityInsightsCard className="md:col-span-2" />
        </div>
      </div>
    </div>
  )
}