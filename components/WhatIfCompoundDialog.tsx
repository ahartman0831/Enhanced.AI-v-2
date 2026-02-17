'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Sparkles } from 'lucide-react'

export type TweakAction = 'add' | 'remove' | 'replace'

interface WhatIfCompoundDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  compoundNames: string[]
  approachIndex: number
  onRegenerate: (tweak: string) => Promise<void>
}

export function WhatIfCompoundDialog({
  open,
  onOpenChange,
  compoundNames,
  approachIndex,
  onRegenerate
}: WhatIfCompoundDialogProps) {
  const [action, setAction] = useState<TweakAction>('add')
  const [compound, setCompound] = useState('')
  const [replaceWith, setReplaceWith] = useState('')
  const [loading, setLoading] = useState(false)

  const buildTweakString = (): string => {
    if (action === 'add') return `Add compound: ${compound.trim()}`
    if (action === 'remove') return `Remove compound: ${compound}`
    if (action === 'replace') return `Replace ${compound} with ${replaceWith.trim()}`
    return ''
  }

  const handleSubmit = async () => {
    const tweak = buildTweakString()
    if (!tweak || (action !== 'remove' && !compound.trim()) || (action === 'replace' && !replaceWith.trim())) {
      return
    }
    setLoading(true)
    try {
      await onRegenerate(tweak)
      onOpenChange(false)
      setCompound('')
      setReplaceWith('')
    } finally {
      setLoading(false)
    }
  }

  const canSubmit =
    (action === 'add' && compound.trim().length >= 2) ||
    (action === 'remove' && compound) ||
    (action === 'replace' && compound && replaceWith.trim().length >= 2)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            What If?
          </DialogTitle>
          <DialogDescription>
            Tweak one compound and regenerate the analysis with updated risks and nutrition impact.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label>Action</Label>
            <Select value={action} onValueChange={(v) => setAction(v as TweakAction)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="add">Add compound</SelectItem>
                <SelectItem value="remove">Remove compound</SelectItem>
                <SelectItem value="replace">Replace compound</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {action === 'remove' && (
            <div>
              <Label>Compound to remove</Label>
              <Select value={compound} onValueChange={setCompound}>
                <SelectTrigger>
                  <SelectValue placeholder="Select compound" />
                </SelectTrigger>
                <SelectContent>
                  {compoundNames.map((name) => (
                    <SelectItem key={name} value={name}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {(action === 'add' || action === 'replace') && (
            <div>
              <Label>{action === 'replace' ? 'Compound to replace' : 'Compound to add'}</Label>
              {action === 'replace' ? (
                <Select value={compound} onValueChange={setCompound}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select compound" />
                  </SelectTrigger>
                  <SelectContent>
                    {compoundNames.map((name) => (
                      <SelectItem key={name} value={name}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  placeholder="e.g. Trenbolone, Primobolan"
                  value={compound}
                  onChange={(e) => setCompound(e.target.value)}
                />
              )}
            </div>
          )}

          {action === 'replace' && (
            <div>
              <Label>Replace with</Label>
              <Input
                placeholder="e.g. Anavar"
                value={replaceWith}
                onChange={(e) => setReplaceWith(e.target.value)}
              />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit || loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Regenerating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Regenerate Analysis
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
