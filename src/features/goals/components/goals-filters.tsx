'use client'

import { useCategoriesQuery } from '@/features/categories'
import { GoalFilters } from '@/features/goals/utils/types'
import { useLabelsQuery } from '@/features/labels'
import { Filter } from 'lucide-react'

import { SearchableSelect } from '@/components/ui/searchable-select'
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
      <span className="inline-flex h-10 items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
        <Filter className="h-3.5 w-3.5" />
        Filters
      </span>
      <Select value={filters.status || 'ACTIVE'} onValueChange={handleStatusChange}>
        <SelectTrigger aria-label="Status" className="h-10 w-full sm:w-48">
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

      <SearchableSelect
        className="w-full sm:w-56"
        value={selectedCategory}
        onChange={handleCategoryChange}
        placeholder="All categories"
        options={[
          { value: 'all', label: 'All categories' },
          ...categories.map((c) => ({ value: c.value, label: c.name, color: c.color })),
        ]}
      />

      <SearchableSelect
        className="w-full sm:w-56"
        value={selectedLabel}
        onChange={handleLabelChange}
        placeholder="All labels"
        options={[
          { value: 'all', label: 'All labels' },
          ...labels.map((l) => ({ value: l.id, label: l.name, color: l.color })),
        ]}
      />
    </div>
  )
}
