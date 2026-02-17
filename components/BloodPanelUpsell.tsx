'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Crown, Beaker, ArrowRight, CheckCircle } from 'lucide-react'
import Link from 'next/link'

interface BloodPanelUpsellProps {
  className?: string
}

export function BloodPanelUpsell({ className }: BloodPanelUpsellProps) {
  return (
    <Card className={`${className} bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-amber-200 dark:border-amber-800`}>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-100 dark:bg-amber-900 rounded-lg">
            <Beaker className="h-6 w-6 text-amber-600" />
          </div>
          <div>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-amber-600" />
              Elite Blood Panel Package
            </CardTitle>
            <CardDescription>
              Comprehensive TRT optimization testing
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <h4 className="font-medium text-amber-900 dark:text-amber-100">
            14-Marker Comprehensive Panel - $229
          </h4>
          <div className="grid grid-cols-1 gap-2 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Total & Free Testosterone</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>LH, FSH, Prolactin, SHBG</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Estradiol, DHT, Cortisol</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Complete Blood Count (CBC)</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Comprehensive Metabolic Panel</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Lipid Panel (Cholesterol)</span>
            </div>
          </div>
        </div>

        <div className="bg-white/50 dark:bg-black/20 rounded-lg p-3">
          <p className="text-sm text-amber-800 dark:text-amber-200">
            <strong>Save $70</strong> compared to ordering individual tests
          </p>
        </div>

        <div className="space-y-2">
          <Link href="/blood-panel-order">
            <Button className="w-full bg-amber-600 hover:bg-amber-700 text-white">
              Order Elite Blood Panel
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
          <p className="text-xs text-center text-amber-700 dark:text-amber-300">
            LabCorp partnership • Results in 2-3 business days
          </p>
        </div>

        <Badge variant="secondary" className="w-full justify-center bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
          <Crown className="h-3 w-3 mr-1" />
          Elite Feature
        </Badge>
      </CardContent>
    </Card>
  )
}