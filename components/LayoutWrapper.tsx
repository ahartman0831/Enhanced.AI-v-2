'use client'

import { DisclaimerModal } from '@/components/DisclaimerModal'
import { Footer } from '@/components/Footer'

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <DisclaimerModal />
      <div className="flex-1">
        {children}
      </div>
      <Footer />
    </div>
  )
}