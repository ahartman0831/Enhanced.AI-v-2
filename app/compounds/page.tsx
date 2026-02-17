'use client'

import { useState, useEffect, useMemo } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase-client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CompoundCard } from '@/components/CompoundCard'
import { CompoundsSearch } from '@/components/CompoundsSearch'
import { AlertTriangle, Database, Loader2 } from 'lucide-react'

interface Compound {
  id: string
  name: string
  category: string
  common_uses: string | null
  risk_score: number
  affected_systems: string[] | null
  key_monitoring_markers: string[] | null
  nutrition_impact_summary: string | null
}

export default function CompoundsPage() {
  const [compounds, setCompounds] = useState<Compound[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [riskMin, setRiskMin] = useState(1)
  const [riskMax, setRiskMax] = useState(10)

  const supabase = createSupabaseBrowserClient()

  // Fetch compounds on component mount
  useEffect(() => {
    async function fetchCompounds() {
      try {
        setLoading(true)
        const { data, error } = await supabase
          .from('compounds')
          .select('*')
          .order('name')

        if (error) {
          throw error
        }

        setCompounds(data || [])
      } catch (err) {
        console.error('Error fetching compounds:', err)
        setError('Failed to load compound database. Please try again later.')
      } finally {
        setLoading(false)
      }
    }

    fetchCompounds()
  }, [supabase])

  // Get unique categories for filter dropdown
  const categories = useMemo(() => {
    const uniqueCategories = [...new Set(compounds.map(c => c.category))]
    return uniqueCategories.sort()
  }, [compounds])

  // Filter compounds based on search and filters
  const filteredCompounds = useMemo(() => {
    return compounds.filter((compound) => {
      // Search filter
      const matchesSearch = compound.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          compound.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (compound.common_uses && compound.common_uses.toLowerCase().includes(searchTerm.toLowerCase()))

      // Category filter
      const matchesCategory = categoryFilter === 'all' || compound.category === categoryFilter

      // Risk score filter
      const matchesRisk = compound.risk_score >= riskMin && compound.risk_score <= riskMax

      return matchesSearch && matchesCategory && matchesRisk
    })
  }, [compounds, searchTerm, categoryFilter, riskMin, riskMax])

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Disclaimer Banner */}
        <Alert className="mb-8 border-destructive/50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            <strong>Medical Disclaimer:</strong> This database contains educational information about various compounds for informational purposes only.
            This is not medical advice. Always consult with qualified healthcare professionals before starting any supplementation regimen.
            Individual results may vary, and compounds may have significant health impacts. No dosages are provided as this information is for educational use only.
          </AlertDescription>
        </Alert>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Compound Database</h1>
          <p className="text-muted-foreground">
            Explore detailed information about vitamins, supplements, and medications.
            {compounds.length > 0 && (
              <span className="ml-2 text-sm">
                ({filteredCompounds.length} of {compounds.length} compounds)
              </span>
            )}
          </p>
        </div>

        {/* Disclaimer Banner */}
        <Alert className="mb-8 border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            <strong>Educational tool only. Not medical advice. Consult your physician.</strong> All analysis provided is for educational purposes only and should not be used as a substitute for professional medical advice, diagnosis, or treatment.
          </AlertDescription>
        </Alert>

        {/* Search and Filters */}
        <CompoundsSearch
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          categoryFilter={categoryFilter}
          onCategoryChange={setCategoryFilter}
          riskMin={riskMin}
          onRiskMinChange={setRiskMin}
          riskMax={riskMax}
          onRiskMaxChange={setRiskMax}
          categories={categories}
        />

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mr-2" />
            <span className="text-muted-foreground">Loading compound database...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Compounds Grid */}
        {!loading && !error && (
          <>
            {filteredCompounds.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Database className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No compounds found</h3>
                  <p className="text-muted-foreground text-center">
                    Try adjusting your search terms or filters to find more compounds.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCompounds.map((compound) => (
                  <CompoundCard key={compound.id} compound={compound} />
                ))}
              </div>
            )}
          </>
        )}

        {/* Footer Info */}
        {!loading && compounds.length > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>About This Database</CardTitle>
              <CardDescription>
                Educational resource for understanding compound properties and effects
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Risk Score Legend:</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-secondary rounded"></div>
                    <span>1-3: Low Risk</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 border rounded"></div>
                    <span>4-6: Medium Risk</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-destructive rounded"></div>
                    <span>7-8: High Risk</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-destructive rounded"></div>
                    <span>9-10: Very High Risk</span>
                  </div>
                </div>
              </div>

              <p className="text-sm text-muted-foreground">
                This database is updated regularly with educational information. Risk scores are relative indicators
                and should not be used as the sole basis for decision-making. Always consult healthcare professionals
                for personalized medical advice.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}