import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { LayoutWrapper } from '@/components/LayoutWrapper'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Enhanced AI v2',
  description: 'Educational health analysis platform',
  manifest: '/manifest.json',
  themeColor: '#000000',
  viewport: 'width=device-width, initial-scale=1',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <LayoutWrapper>{children}</LayoutWrapper>
      </body>
    </html>
  )
}