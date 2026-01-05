'use client'

import { useCategoriesQuery } from '@/features/categories'
import { GoalFilters } from '@/features/goals/utils/types'
import { useLabelsQuery } from '@/features/labels'
import { Filter } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface GoalsFiltersProps {
  filters: GoalFilters
  onFilterChange: (filters: GoalFilters) => void
}

export function GoalsFilters({ filters, onFilterChange }: GoalsFiltersProps) {
  const { data: categories = [] } = useCategoriesQuery()
  const { data: labels = [] } = useLabelsQuery()

  const handleStatusChange = (status: string) => {
    onFilterChange({ ...filters, status })
  }

  const handleCategoryChange = (categoryValue: string) => {
    onFilterChange({ ...filters, categories: categoryValue === 'all' ? undefined : [categoryValue] })
  }

  const handleLabelChange = (labelId: string) => {
    onFilterChange({ ...filters, labelIds: labelId === 'all' ? undefined : [labelId] })
  }

  const selectedCategory = filters.categories?.[0] || 'all'
  const selectedLabel = filters.labelIds?.[0] || 'all'

  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="inline-flex h-11 items-center gap-2 border-2 bg-gray-50 px-3 text-xs font-bold uppercase text-gray-500">
        <Filter className="h-4 w-4" />
        Filters
      </span>
      <Select value={filters.status || 'ACTIVE'} onValueChange={handleStatusChange}>
        <SelectTrigger aria-label="Status" className="h-11 w-full sm:w-48">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          {['ACTIVE', 'COMPLETED', 'PAUSED'].map((status) => (
            <SelectItem key={status} value={status}>
              {status}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={selectedCategory} onValueChange={handleCategoryChange}>
        <SelectTrigger
          aria-label="Category"
          className={cn('h-11 w-full sm:w-56', selectedCategory !== 'all' && 'bg-accent-blue text-white')}
        >
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All categories</SelectItem>
          {categories.length === 0 ? (
            <SelectItem value="no-categories" disabled>
              No categories
            </SelectItem>
          ) : (
            categories.map((category) => (
              <SelectItem key={category.id} value={category.value}>
                {category.name}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>

      <Select value={selectedLabel} onValueChange={handleLabelChange}>
        <SelectTrigger
          aria-label="Label"
          className={cn('h-11 w-full sm:w-56', selectedLabel !== 'all' && 'bg-accent-green text-white')}
        >
          <SelectValue placeholder="Label" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All labels</SelectItem>
          {labels.length === 0 ? (
            <SelectItem value="no-labels" disabled>
              No labels
            </SelectItem>
          ) : (
            labels.map((label) => (
              <SelectItem key={label.id} value={label.id}>
                {label.name}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    </div>
  )
}
