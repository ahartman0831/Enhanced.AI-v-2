import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { LayoutWrapper } from '@/components/LayoutWrapper'
import { UnsavedAnalysisProvider } from '@/contexts/UnsavedAnalysisContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Enhanced AI v2',
  description: 'Educational health analysis platform',
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0F0F0F',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <UnsavedAnalysisProvider>
          <LayoutWrapper>{children}</LayoutWrapper>
        </UnsavedAnalysisProvider>
      </body>
    </html>
  )
}