'use client'

import { Shield } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

interface LogoProps {
  /** Size variant: 'sm' | 'md' | 'lg' | 'xl' | 'fill' (fill fills the container) */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'fill'
  /** Show text fallback next to icon when no logo image */
  showText?: boolean
  className?: string
}

const sizes = {
  sm: { img: 24, icon: 20 },
  md: { img: 36, icon: 28 },
  lg: { img: 56, icon: 48 },
  xl: { img: 72, icon: 64 },
  fill: { img: 0, icon: 0 },
}

const LOGO_SOURCES = ['/logo/logo.png', '/logo/logo.svg', '/logo/logo.webp'] as const

export function Logo({ size = 'md', showText = true, className }: LogoProps) {
  const [attempt, setAttempt] = useState(0)
  const { img, icon } = sizes[size ?? 'md']
  const imgError = attempt >= LOGO_SOURCES.length
  const isFill = size === 'fill'

  return (
    <div className={cn('flex items-center gap-2', isFill && 'w-full h-full min-w-0 min-h-0', className)}>
      {!imgError ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={LOGO_SOURCES[attempt]}
          alt="Enhanced AI"
          width={isFill ? undefined : img}
          height={isFill ? undefined : img}
          className={cn('object-contain shrink-0', isFill && 'w-full h-full')}
          onError={() => setAttempt((a) => a + 1)}
        />
      ) : (
        <Shield className={cn('shrink-0 text-primary', isFill && 'w-full h-full')} style={!isFill ? { width: icon, height: icon } : undefined} />
      )}
      {showText && (
        <span className="font-bold text-foreground whitespace-nowrap">
          Enhanced AI
        </span>
      )}
    </div>
  )
}
