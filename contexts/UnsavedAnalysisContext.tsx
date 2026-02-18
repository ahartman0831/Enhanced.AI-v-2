'use client'

import { createContext, useContext, useState, useCallback, useRef, ReactNode } from 'react'

interface UnsavedAnalysisContextValue {
  hasUnsavedSideEffectAnalysis: boolean
  setHasUnsavedSideEffectAnalysis: (value: boolean) => void
  registerNavigateAwayHandler: (handler: () => void) => void
  unregisterNavigateAwayHandler: () => void
  triggerNavigateAwayPrompt: () => void
}

const UnsavedAnalysisContext = createContext<UnsavedAnalysisContextValue | null>(null)

export function UnsavedAnalysisProvider({ children }: { children: ReactNode }) {
  const [hasUnsavedSideEffectAnalysis, setHasUnsavedSideEffectAnalysis] = useState(false)
  const handlerRef = useRef<(() => void) | null>(null)

  const registerNavigateAwayHandler = useCallback((handler: () => void) => {
    handlerRef.current = handler
  }, [])

  const unregisterNavigateAwayHandler = useCallback(() => {
    handlerRef.current = null
  }, [])

  const triggerNavigateAwayPrompt = useCallback(() => {
    if (handlerRef.current) {
      handlerRef.current()
    }
  }, [])

  const value: UnsavedAnalysisContextValue = {
    hasUnsavedSideEffectAnalysis,
    setHasUnsavedSideEffectAnalysis,
    registerNavigateAwayHandler,
    unregisterNavigateAwayHandler,
    triggerNavigateAwayPrompt,
  }

  return (
    <UnsavedAnalysisContext.Provider value={value}>
      {children}
    </UnsavedAnalysisContext.Provider>
  )
}

export function useUnsavedAnalysis() {
  return useContext(UnsavedAnalysisContext)
}
