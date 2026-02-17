'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Calendar,
  Tag,
  Save,
  TrendingUp,
  Target,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'

interface TimelineEntry {
  id: string
  date: string
  category: 'progress_photo' | 'bloodwork' | 'protocol_start' | 'protocol_end' | 'milestone' | 'other'
  title: string
  description: string
  tags: string[]
  metrics?: {
    weight?: number
    bodyFat?: number
    muscleMass?: number
    other?: Record<string, any>
  }
}

interface TimelineTaggerProps {
  onSaveEntry: (entry: Omit<TimelineEntry, 'id'>) => void
  existingEntries?: TimelineEntry[]
}

export function TimelineTagger({ onSaveEntry, existingEntries = [] }: TimelineTaggerProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [entry, setEntry] = useState({
    date: new Date().toISOString().split('T')[0],
    category: '' as TimelineEntry['category'],
    title: '',
    description: '',
    tags: [] as string[],
    metrics: {
      weight: undefined as number | undefined,
      bodyFat: undefined as number | undefined,
      muscleMass: undefined as number | undefined,
      other: {} as Record<string, any>
    }
  })
  const [newTag, setNewTag] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const categoryOptions = [
    { value: 'progress_photo', label: 'Progress Photo', icon: '📸' },
    { value: 'bloodwork', label: 'Bloodwork', icon: '🩸' },
    { value: 'protocol_start', label: 'Protocol Start', icon: '🚀' },
    { value: 'protocol_end', label: 'Protocol End', icon: '🏁' },
    { value: 'milestone', label: 'Milestone', icon: '🎯' },
    { value: 'other', label: 'Other', icon: '📝' }
  ]

  const commonTags = [
    'bulking', 'cutting', 'maintenance', 'strength', 'hypertrophy', 'endurance',
    'pct', 'bridge', 'deload', 'injury', 'recovery', 'peak', 'competition',
    'new-supplement', 'dosage-change', 'lifestyle-change', 'sleep-improvement',
    'stress-reduction', 'nutrition-optimization'
  ]

  const handleAddTag = (tag: string) => {
    if (tag && !entry.tags.includes(tag)) {
      setEntry(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }))
    }
    setNewTag('')
  }

  const handleRemoveTag = (tag: string) => {
    setEntry(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }))
  }

  const handleSave = async () => {
    if (!entry.title.trim() || !entry.category) {
      return
    }

    setIsSaving(true)
    try {
      await onSaveEntry(entry)
      // Reset form
      setEntry({
        date: new Date().toISOString().split('T')[0],
        category: '' as TimelineEntry['category'],
        title: '',
        description: '',
        tags: [],
        metrics: {
          weight: undefined,
          bodyFat: undefined,
          muscleMass: undefined,
          other: {}
        }
      })
      setIsExpanded(false)
    } catch (error) {
      console.error('Error saving timeline entry:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const canSave = entry.title.trim() && entry.category

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Health Timeline
        </CardTitle>
        <CardDescription>
          Track important health events, milestones, and progress markers
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick Add Button */}
        {!isExpanded && (
          <Button
            onClick={() => setIsExpanded(true)}
            variant="outline"
            className="w-full"
          >
            <Tag className="h-4 w-4 mr-2" />
            Add Timeline Entry
          </Button>
        )}

        {/* Expanded Form */}
        {isExpanded && (
          <div className="space-y-6 border rounded-lg p-6 bg-muted/20">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="entry-date">Date</Label>
                <Input
                  id="entry-date"
                  type="date"
                  value={entry.date}
                  onChange={(e) => setEntry(prev => ({ ...prev, date: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="entry-category">Category</Label>
                <Select
                  value={entry.category}
                  onValueChange={(value: TimelineEntry['category']) =>
                    setEntry(prev => ({ ...prev, category: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <span className="flex items-center gap-2">
                          <span>{option.icon}</span>
                          {option.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Title and Description */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="entry-title">Title *</Label>
                <Input
                  id="entry-title"
                  placeholder="e.g., Started TRT Protocol, Competition Prep Begins"
                  value={entry.title}
                  onChange={(e) => setEntry(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="entry-description">Description</Label>
                <Textarea
                  id="entry-description"
                  placeholder="Detailed description of this health event or milestone..."
                  value={entry.description}
                  onChange={(e) => setEntry(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>
            </div>

            {/* Tags */}
            <div className="space-y-4">
              <Label>Tags</Label>

              {/* Selected Tags */}
              {entry.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {entry.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                      {tag}
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1 hover:text-destructive"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              )}

              {/* Add Custom Tag */}
              <div className="flex gap-2">
                <Input
                  placeholder="Add custom tag..."
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddTag(newTag)}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddTag(newTag)}
                  disabled={!newTag.trim()}
                >
                  Add
                </Button>
              </div>

              {/* Common Tags */}
              <div>
                <p className="text-sm text-muted-foreground mb-2">Common tags:</p>
                <div className="flex flex-wrap gap-2">
                  {commonTags.filter(tag => !entry.tags.includes(tag)).slice(0, 12).map((tag) => (
                    <Button
                      key={tag}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddTag(tag)}
                      className="h-7 text-xs"
                    >
                      {tag}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {/* Metrics (Optional) */}
            <div className="space-y-4">
              <Label>Optional Metrics</Label>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="weight" className="text-sm">Weight (lbs)</Label>
                  <Input
                    id="weight"
                    type="number"
                    step="0.1"
                    placeholder="185.5"
                    value={entry.metrics.weight || ''}
                    onChange={(e) => setEntry(prev => ({
                      ...prev,
                      metrics: { ...prev.metrics, weight: e.target.value ? Number(e.target.value) : undefined }
                    }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bodyfat" className="text-sm">Body Fat %</Label>
                  <Input
                    id="bodyfat"
                    type="number"
                    step="0.1"
                    placeholder="12.5"
                    value={entry.metrics.bodyFat || ''}
                    onChange={(e) => setEntry(prev => ({
                      ...prev,
                      metrics: { ...prev.metrics, bodyFat: e.target.value ? Number(e.target.value) : undefined }
                    }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="muscle" className="text-sm">Muscle Mass (lbs)</Label>
                  <Input
                    id="muscle"
                    type="number"
                    step="0.1"
                    placeholder="165.2"
                    value={entry.metrics.muscleMass || ''}
                    onChange={(e) => setEntry(prev => ({
                      ...prev,
                      metrics: { ...prev.metrics, muscleMass: e.target.value ? Number(e.target.value) : undefined }
                    }))}
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsExpanded(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={!canSave || isSaving}
                className="flex-1"
              >
                {isSaving ? (
                  <>
                    <Save className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Entry
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Recent Entries */}
        {existingEntries.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Recent Timeline Entries
            </h4>
            <div className="space-y-2">
              {existingEntries.slice(0, 5).map((timelineEntry) => (
                <div key={timelineEntry.id} className="flex items-start gap-3 p-3 border rounded-lg">
                  <div className="flex-shrink-0 mt-1">
                    {timelineEntry.category === 'progress_photo' && '📸'}
                    {timelineEntry.category === 'bloodwork' && '🩸'}
                    {timelineEntry.category === 'protocol_start' && '🚀'}
                    {timelineEntry.category === 'protocol_end' && '🏁'}
                    {timelineEntry.category === 'milestone' && '🎯'}
                    {timelineEntry.category === 'other' && '📝'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h5 className="font-medium text-sm truncate">{timelineEntry.title}</h5>
                      <Badge variant="outline" className="text-xs">
                        {new Date(timelineEntry.date).toLocaleDateString()}
                      </Badge>
                    </div>
                    {timelineEntry.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {timelineEntry.description}
                      </p>
                    )}
                    {timelineEntry.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {timelineEntry.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {timelineEntry.tags.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{timelineEntry.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Educational Note */}
        <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800">
          <Target className="h-4 w-4" />
          <AlertDescription className="text-sm">
            <strong>Timeline Tracking:</strong> Regular documentation of health events, protocol changes,
            and progress markers helps identify patterns and optimize your health optimization journey.
            Use this tool to maintain comprehensive records for yourself and healthcare providers.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}