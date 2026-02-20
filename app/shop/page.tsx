'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  SHOP_PRODUCTS,
  PRODUCT_CATEGORIES,
  type ShopProduct,
  type ProductCategory,
} from '@/lib/shop-products'
import { Search, ExternalLink, ShoppingBag, Filter } from 'lucide-react'

export default function ShopPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategories, setSelectedCategories] = useState<Set<ProductCategory>>(new Set())

  const toggleCategory = (cat: ProductCategory) => {
    setSelectedCategories((prev) => {
      const next = new Set(prev)
      if (next.has(cat)) next.delete(cat)
      else next.add(cat)
      return next
    })
  }

  const clearFilters = () => {
    setSearchQuery('')
    setSelectedCategories(new Set())
  }

  const filteredProducts = useMemo(() => {
    const query = searchQuery.toLowerCase().trim()
    return SHOP_PRODUCTS.filter((p) => {
      const matchesSearch =
        !query ||
        p.title.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query) ||
        (p.brand && p.brand.toLowerCase().includes(query)) ||
        PRODUCT_CATEGORIES[p.category].toLowerCase().includes(query)
      const matchesCategory =
        selectedCategories.size === 0 || selectedCategories.has(p.category)
      return matchesSearch && matchesCategory
    })
  }, [searchQuery, selectedCategories])

  const categoryKeys = Object.keys(PRODUCT_CATEGORIES) as ProductCategory[]

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-2">
            <ShoppingBag className="h-8 w-8 text-primary" />
            Shop
          </h1>
          <p className="text-muted-foreground">
            Curated products and services for enhanced bodybuilders. Affiliate links support our platform.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters */}
          <aside
            className="lg:w-64 shrink-0"
            role="navigation"
            aria-label="Product category filters"
          >
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <h2 className="font-semibold text-foreground">Categories</h2>
                </div>
                <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                  {categoryKeys.map((cat) => (
                    <div
                      key={cat}
                      className="flex items-center space-x-2"
                    >
                      <Checkbox
                        id={`filter-${cat}`}
                        checked={selectedCategories.has(cat)}
                        onCheckedChange={() => toggleCategory(cat)}
                        aria-label={`Filter by ${PRODUCT_CATEGORIES[cat]}`}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            toggleCategory(cat)
                          }
                        }}
                      />
                      <Label
                        htmlFor={`filter-${cat}`}
                        className="text-sm font-normal cursor-pointer flex-1"
                      >
                        {PRODUCT_CATEGORIES[cat]}
                      </Label>
                    </div>
                  ))}
                </div>
                {(selectedCategories.size > 0 || searchQuery) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full mt-4"
                    onClick={clearFilters}
                  >
                    Clear filters
                  </Button>
                )}
              </CardContent>
            </Card>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {/* Search Bar */}
            <div className="mb-6">
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
                  aria-hidden
                />
                <Input
                  type="search"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  aria-label="Search products by keyword"
                  autoComplete="off"
                />
              </div>
            </div>

            {/* Results count */}
            <p className="text-sm text-muted-foreground mb-4">
              {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''} found
            </p>

            {/* Product Grid */}
            <div
              className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6"
              role="list"
              aria-label="Product listings"
            >
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {filteredProducts.length === 0 && (
              <div className="text-center py-16 text-muted-foreground">
                <p className="font-medium">No products match your filters.</p>
                <p className="text-sm mt-1">Try adjusting your search or category filters.</p>
                <Button variant="outline" className="mt-4" onClick={clearFilters}>
                  Clear filters
                </Button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}

function ProductCard({ product }: { product: ShopProduct }) {
  return (
    <Card
      className="flex flex-col overflow-hidden hover:border-primary/50 transition-colors"
      role="listitem"
    >
      <div className="relative aspect-square bg-muted">
        <div
          className="w-full h-full bg-gradient-to-br from-muted to-muted/60 flex items-center justify-center"
          style={{ backgroundImage: product.imageUrl.startsWith('http') ? `url(${product.imageUrl})` : undefined, backgroundSize: 'cover' }}
        >
          {!product.imageUrl.startsWith('http') && (
            <ShoppingBag className="h-16 w-16 text-muted-foreground/50" />
          )}
        </div>
        {product.comingSoon && (
          <Badge
            className="absolute top-2 right-2 bg-amber-500 text-amber-950 hover:bg-amber-500"
            aria-label="Coming soon"
          >
            Coming Soon
          </Badge>
        )}
        {product.brand && (
          <Badge variant="secondary" className="absolute top-2 left-2 text-xs">
            {product.brand}
          </Badge>
        )}
      </div>
      <CardContent className="flex-1 p-4">
        <h3 className="font-semibold text-foreground line-clamp-2 mb-1">
          {product.title}
        </h3>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
          {product.description}
        </p>
        <p className="text-lg font-bold text-primary">{product.price}</p>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        {product.comingSoon ? (
          <Button
            className="w-full"
            variant="secondary"
            disabled
            aria-label={`${product.title} coming soon`}
          >
            Coming Soon
          </Button>
        ) : (
          <Button asChild className="w-full" aria-label={`Buy ${product.title} now`}>
            <a
              href={product.affiliateUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2"
            >
              Buy Now
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
