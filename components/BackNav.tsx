'use client'

import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Beaker } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TierBadge } from '@/components/TierBadge'
import { useUnsavedAnalysis } from '@/contexts/UnsavedAnalysisContext'

const PROTECTED_ROUTES = ['/dashboard', '/stack-explorer', '/side-effects', '/compounds', '/onboarding', '/bloodwork-parser', '/bloodwork-history', '/progress-photos', '/results-forecaster', '/recovery-timeline', '/counterfeit-checker', '/telehealth-referral', '/profile', '/blood-panel-order']

const ORDER_BLOOD_TEST_ROUTES = ['/stack-explorer', '/side-effects', '/recovery-timeline', '/telehealth-referral', '/bloodwork-parser']

export function BackNav() {
  const router = useRouter()
  const pathname = usePathname()
  const unsaved = useUnsavedAnalysis()
  const isProtected = PROTECTED_ROUTES.some((route) => pathname?.startsWith(route))
  const isBloodPanelPage = pathname?.startsWith('/blood-panel-order')
  const showOrderBloodTest = ORDER_BLOOD_TEST_ROUTES.some((route) => pathname?.startsWith(route))
  const isSideEffectsWithUnsaved = pathname?.startsWith('/side-effects') && unsaved?.hasUnsavedSideEffectAnalysis

  const handleBackClick = () => {
    if (isSideEffectsWithUnsaved) {
      unsaved?.triggerNavigateAwayPrompt()
    } else {
      router.back()
    }
  }

  return (
    <div className="sticky top-0 z-40 flex h-10 items-center justify-between gap-4 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <Button
        variant="ghost"
        size="sm"
        onClick={handleBackClick}
        className="-ml-2 gap-1 text-muted-foreground hover:text-foreground shrink-0"
      >
        <ChevronLeft className="h-4 w-4" />
        Back
      </Button>
      <div className="flex items-center gap-2">
        {showOrderBloodTest && !isBloodPanelPage && (
          <Button variant="ghost" size="sm" asChild className="bg-blue-600 hover:bg-blue-700 text-white text-xs">
            <Link href="/blood-panel-order" className="flex items-center gap-1">
              <Beaker className="h-3.5 w-3.5" />
              Order Blood Test
            </Link>
          </Button>
        )}
        <TierBadge />
      </div>
    </div>
  )
}
