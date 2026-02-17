'use client'

import { useState, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, Filter } from 'lucide-react'

interface CompoundsSearchProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  categoryFilter: string
  onCategoryChange: (value: string) => void
  riskMin: number
  onRiskMinChange: (value: number) => void
  riskMax: number
  onRiskMaxChange: (value: number) => void
  categories: string[]
}

export function CompoundsSearch({
  searchTerm,
  onSearchChange,
  categoryFilter,
  onCategoryChange,
  riskMin,
  onRiskMinChange,
  riskMax,
  onRiskMaxChange,
  categories
}: CompoundsSearchProps) {
  return (
    <div className="bg-card rounded-lg p-6 border mb-8">
      <div className="flex items-center gap-2 mb-4">
        <Filter className="h-5 w-5" />
        <h3 className="text-lg font-semibold">Search & Filter Compounds</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Search Input */}
        <div className="space-y-2">
          <Label htmlFor="search">Search</Label>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="search"
              placeholder="Search compounds..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Category Filter */}
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Select value={categoryFilter} onValueChange={onCategoryChange}>
            <SelectTrigger>
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Risk Score Min */}
        <div className="space-y-2">
          <Label htmlFor="risk-min">Min Risk Score</Label>
          <Select value={riskMin.toString()} onValueChange={(value) => onRiskMinChange(Number(value))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 11 }, (_, i) => (
                <SelectItem key={i} value={i.toString()}>
                  {i}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Risk Score Max */}
        <div className="space-y-2">
          <Label htmlFor="risk-max">Max Risk Score</Label>
          <Select value={riskMax.toString()} onValueChange={(value) => onRiskMaxChange(Number(value))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 11 }, (_, i) => (
                <SelectItem key={i} value={i.toString()}>
                  {i}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}