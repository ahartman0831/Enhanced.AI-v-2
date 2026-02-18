'use client'

import { useState, useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Loader2, Plus } from 'lucide-react'

interface SideEffectsCompoundInputProps {
  onAdd: (name: string) => void
  existingNames: string[]
  disabled?: boolean
  className?: string
}

export function SideEffectsCompoundInput({
  onAdd,
  existingNames,
  disabled,
  className
}: SideEffectsCompoundInputProps) {
  const [value, setValue] = useState('')
  const [suggestions, setSuggestions] = useState<{ id: string; name: string }[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [loading, setLoading] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (value.length < 2) {
      setSuggestions([])
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    const timer = setTimeout(() => {
      fetch(`/api/compounds/search?q=${encodeURIComponent(value)}`)
        .then((r) => r.json())
        .then((data) => !cancelled && setSuggestions(Array.isArray(data) ? data : []))
        .catch(() => !cancelled && setSuggestions([]))
        .finally(() => !cancelled && setLoading(false))
    }, 200)
    return () => {
      clearTimeout(timer)
      cancelled = true
    }
  }, [value])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleAdd = (nameToAdd?: string) => {
    const name = (nameToAdd ?? value.trim()).trim()
    if (!name || existingNames.includes(name)) return
    onAdd(name)
    setValue('')
    setShowDropdown(false)
  }

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            value={value}
            onChange={(e) => {
              setValue(e.target.value)
              setShowDropdown(true)
            }}
            onFocus={() => value.length >= 2 && setShowDropdown(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleAdd()
              }
            }}
            placeholder="Type to search database or enter custom compound..."
            disabled={disabled}
          />
          {loading && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => handleAdd()}
          disabled={disabled || !value.trim()}
          aria-label="Add compound"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      {showDropdown && suggestions.length > 0 && (
        <ul
          className="absolute z-50 mt-1 w-full rounded-md border bg-popover py-1 text-sm shadow-md max-h-48 overflow-auto"
          role="listbox"
        >
          {suggestions
            .filter((s) => !existingNames.includes(s.name))
            .map((s) => (
              <li
                key={s.id}
                role="option"
                tabIndex={0}
                className="cursor-pointer px-3 py-2 hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground outline-none"
                onMouseDown={(e) => {
                  e.preventDefault()
                  handleAdd(s.name)
                }}
              >
                {s.name}
              </li>
            ))}
        </ul>
      )}
    </div>
  )
}
