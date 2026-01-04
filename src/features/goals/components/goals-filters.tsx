'use client'

import { useEffect, useRef, useState } from 'react'

import { useCategoriesQuery } from '@/features/categories'
import { GoalFilters } from '@/features/goals/utils/types'
import { useLabelsQuery } from '@/features/labels'
import { ChevronDown, Filter, X } from 'lucide-react'

import { cn } from '@/lib/utils'

interface GoalsFiltersProps {
  filters: GoalFilters
  onFilterChange: (filters: GoalFilters) => void
}

export function GoalsFilters({ filters, onFilterChange }: GoalsFiltersProps) {
  const { data: categories = [] } = useCategoriesQuery()
  const { data: labels = [] } = useLabelsQuery()

  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false)
  const [showLabelDropdown, setShowLabelDropdown] = useState(false)

  const categoryRef = useRef<HTMLDivElement>(null)
  const labelRef = useRef<HTMLDivElement>(null)

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (categoryRef.current && !categoryRef.current.contains(event.target as Node)) {
        setShowCategoryDropdown(false)
      }
      if (labelRef.current && !labelRef.current.contains(event.target as Node)) {
        setShowLabelDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleStatusChange = (status: string) => {
    onFilterChange({ ...filters, status })
  }

  const handleCategoryToggle = (categoryValue: string) => {
    const currentCategories = filters.categories || []
    const newCategories = currentCategories.includes(categoryValue)
      ? currentCategories.filter((c) => c !== categoryValue)
      : [...currentCategories, categoryValue]
    onFilterChange({ ...filters, categories: newCategories.length > 0 ? newCategories : undefined })
  }

  const handleLabelToggle = (labelId: string) => {
    const currentLabels = filters.labelIds || []
    const newLabels = currentLabels.includes(labelId)
      ? currentLabels.filter((l) => l !== labelId)
      : [...currentLabels, labelId]
    onFilterChange({ ...filters, labelIds: newLabels.length > 0 ? newLabels : undefined })
  }

  const clearAllFilters = () => {
    onFilterChange({ status: filters.status })
  }

  const hasActiveFilters =
    (filters.categories && filters.categories.length > 0) || (filters.labelIds && filters.labelIds.length > 0)

  const selectedCategoryNames = categories.filter((c) => filters.categories?.includes(c.value)).map((c) => c.name)

  const selectedLabelNames = labels.filter((l) => filters.labelIds?.includes(l.id)).map((l) => l.name)

  return (
    <div className="space-y-4">
      {/* Status Filter */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-bold uppercase text-gray-600">Status:</span>
        {['ACTIVE', 'COMPLETED', 'PAUSED'].map((status) => (
          <button
            key={status}
            onClick={() => handleStatusChange(status)}
            className={cn(
              'px-4 py-2 font-bold uppercase text-sm border-3 border-secondary transition-all',
              filters.status === status ? 'bg-secondary text-white' : 'bg-white hover:bg-gray-100',
            )}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Category & Label Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Filter className="h-4 w-4 text-gray-500" />

        {/* Category Multi-Select */}
        <div ref={categoryRef} className="relative">
          <button
            onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
            className={cn(
              'flex items-center gap-2 px-3 py-2 text-sm font-bold border-2 border-secondary transition-all',
              selectedCategoryNames.length > 0 ? 'bg-accent-blue text-white' : 'bg-white hover:bg-gray-100',
            )}
          >
            Categories
            {selectedCategoryNames.length > 0 && (
              <span className="rounded bg-white px-1.5 py-0.5 text-xs font-bold text-accent-blue">
                {selectedCategoryNames.length}
              </span>
            )}
            <ChevronDown className="h-4 w-4" />
          </button>

          {showCategoryDropdown && (
            <div className="absolute z-50 mt-1 max-h-64 w-56 overflow-y-auto border-3 border-secondary bg-white shadow-brutal">
              {categories.length === 0 ? (
                <div className="px-3 py-2 text-sm text-gray-500">No categories</div>
              ) : (
                categories.map((category) => (
                  <label
                    key={category.id}
                    className="flex cursor-pointer items-center gap-2 px-3 py-2 hover:bg-gray-100"
                  >
                    <input
                      type="checkbox"
                      checked={filters.categories?.includes(category.value) || false}
                      onChange={() => handleCategoryToggle(category.value)}
                      className="h-4 w-4 border-2 border-secondary"
                    />
                    <span
                      className="h-3 w-3 rounded-full border border-gray-300"
                      style={{ backgroundColor: category.color }}
                    />
                    <span className="text-sm">{category.name}</span>
                  </label>
                ))
              )}
            </div>
          )}
        </div>

        {/* Label Multi-Select */}
        <div ref={labelRef} className="relative">
          <button
            onClick={() => setShowLabelDropdown(!showLabelDropdown)}
            className={cn(
              'flex items-center gap-2 px-3 py-2 text-sm font-bold border-2 border-secondary transition-all',
              selectedLabelNames.length > 0 ? 'bg-accent-green text-white' : 'bg-white hover:bg-gray-100',
            )}
          >
            Labels
            {selectedLabelNames.length > 0 && (
              <span className="rounded bg-white px-1.5 py-0.5 text-xs font-bold text-accent-green">
                {selectedLabelNames.length}
              </span>
            )}
            <ChevronDown className="h-4 w-4" />
          </button>

          {showLabelDropdown && (
            <div className="absolute z-50 mt-1 max-h-64 w-56 overflow-y-auto border-3 border-secondary bg-white shadow-brutal">
              {labels.length === 0 ? (
                <div className="px-3 py-2 text-sm text-gray-500">No labels</div>
              ) : (
                labels.map((label) => (
                  <label key={label.id} className="flex cursor-pointer items-center gap-2 px-3 py-2 hover:bg-gray-100">
                    <input
                      type="checkbox"
                      checked={filters.labelIds?.includes(label.id) || false}
                      onChange={() => handleLabelToggle(label.id)}
                      className="h-4 w-4 border-2 border-secondary"
                    />
                    <span
                      className="h-3 w-3 rounded-full border border-gray-300"
                      style={{ backgroundColor: label.color }}
                    />
                    <span className="text-sm">{label.name}</span>
                  </label>
                ))
              )}
            </div>
          )}
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="flex items-center gap-1 px-2 py-1 text-xs font-bold text-gray-600 transition-colors hover:text-red-600"
          >
            <X className="h-3 w-3" />
            Clear filters
          </button>
        )}
      </div>

      {/* Active Filter Tags */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {selectedCategoryNames.map((name) => {
            const category = categories.find((c) => c.name === name)
            return (
              <span
                key={name}
                className="inline-flex items-center gap-1 border-2 border-secondary px-2 py-1 text-xs font-bold"
                style={{ backgroundColor: category?.color + '40' }}
              >
                {name}
                <button onClick={() => handleCategoryToggle(category?.value || '')} className="hover:text-red-600">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )
          })}
          {selectedLabelNames.map((name) => {
            const label = labels.find((l) => l.name === name)
            return (
              <span
                key={name}
                className="inline-flex items-center gap-1 border-2 border-secondary px-2 py-1 text-xs font-bold"
                style={{ backgroundColor: label?.color + '40' }}
              >
                {name}
                <button onClick={() => handleLabelToggle(label?.id || '')} className="hover:text-red-600">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )
          })}
        </div>
      )}
    </div>
  )
}
