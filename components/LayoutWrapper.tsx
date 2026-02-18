'use client'

import { DisclaimerModal } from '@/components/DisclaimerModal'
import { Footer } from '@/components/Footer'
import { BackNav } from '@/components/BackNav'

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <DisclaimerModal />
      <BackNav />
      <div className="flex-1">
        {children}
      </div>
      <Footer />
    </div>
  )
}