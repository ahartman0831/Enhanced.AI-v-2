'use client'

import { DisclaimerModal } from '@/components/DisclaimerModal'

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  return (
    <>
      <DisclaimerModal />
      {children}
    </>
  )
}