'use client'

import { TierGate } from '@/components/TierGate'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Sparkles, AlertTriangle } from 'lucide-react'

export default function SupplementAnalyzerPage() {
  return (
    <TierGate>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-2">
              <Sparkles className="h-8 w-8 text-cyan-500" />
              Supplement Analyzer
            </h1>
            <p className="text-muted-foreground">
              AI-powered analysis of supplement labels, ingredients, and quality indicators.
            </p>
          </div>

          <Alert className="border-cyan-500/20 bg-cyan-500/5 dark:bg-cyan-950/20 dark:border-cyan-800/50">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Coming soon.</strong> Supplement Analyzer will help you understand ingredient lists, identify potential interactions, and assess product quality. This Pro feature is in development.
            </AlertDescription>
          </Alert>

          <Card className="mt-8">
            <CardHeader>
              <CardTitle>What to expect</CardTitle>
              <CardDescription>
                When available, you&apos;ll be able to:
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>• Upload or paste supplement labels for AI analysis</p>
              <p>• Get ingredient breakdowns and educational context</p>
              <p>• Identify potential interactions with your stack</p>
              <p>• Compare products and formulations</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </TierGate>
  )
}
