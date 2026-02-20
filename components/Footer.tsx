import Link from 'next/link'
import { Logo } from '@/components/Logo'

export function Footer() {
  return (
    <footer className="border-t bg-muted/30 mt-auto">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center h-24 w-48 sm:h-28 sm:w-56">
            <Logo size="fill" showText={false} />
          </div>

          <div className="flex items-center gap-6 text-sm flex-wrap justify-center">
            <Link
              href="/privacy-policy"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Privacy Policy
            </Link>
            <span className="text-muted-foreground max-w-md">
              We never share identifiable data. Aggregated trends are educational only. We may earn a commission from qualifying purchases via affiliate links.
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}