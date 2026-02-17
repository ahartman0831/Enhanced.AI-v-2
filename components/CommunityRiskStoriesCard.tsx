'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, RefreshCw } from 'lucide-react'

interface CommunityRiskStoriesCardProps {
  className?: string
}

export function CommunityRiskStoriesCard({ className }: CommunityRiskStoriesCardProps) {
  const [story, setStory] = useState<string | null>(null)
  const [educationalNote, setEducationalNote] = useState<string>('')
  const [loading, setLoading] = useState(true)

  const fetchStory = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/community-risk-stories')
      const data = await res.json()
      setStory(data.story ?? null)
      setEducationalNote(data.educational_note ?? 'Individual responses vary.')
    } catch {
      setStory('Community insights are being calculated. Check back later.')
      setEducationalNote('')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStory()
  }, [])

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Users className="h-4 w-4" />
            Community Risk Stories
          </CardTitle>
          <CardDescription className="text-xs">
            Anonymized insight from users on similar combos
          </CardDescription>
        </div>
        <button
          onClick={fetchStory}
          disabled={loading}
          className="p-1 rounded-md hover:bg-muted transition-colors"
          title="Refresh"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-12 bg-muted animate-pulse rounded" />
        ) : story ? (
          <div className="space-y-2">
            <p className="text-sm leading-relaxed">{story}</p>
            {educationalNote && (
              <p className="text-xs text-muted-foreground">{educationalNote}</p>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Be among the first to contribute anonymized insights.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
