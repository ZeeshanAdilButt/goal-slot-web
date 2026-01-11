'use client'

import { useMemo, useState } from 'react'
import { Filter, X } from 'lucide-react'

import { useCategoriesQuery } from '@/features/categories/hooks/use-categories-queries'
import { useTimeTrackerData } from '@/features/time-tracker/hooks/use-time-tracker-queries'
import type { Goal } from '@/features/time-tracker/utils/types'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface Category {
  id: string
  name: string
  color?: string | null
}

export interface ReportFilterState {
  goalIds: string[]
  categoryIds: string[]
}

interface FocusFiltersProps {
  filters: ReportFilterState
  onChange: (filters: ReportFilterState) => void
}

export function FocusFilters({ filters, onChange }: FocusFiltersProps) {
  const [open, setOpen] = useState(false)
  const { goals } = useTimeTrackerData()
  const { data: categories = [] } = useCategoriesQuery() as { data: Category[] }

  const activeFilterCount = useMemo(() => {
    return filters.goalIds.length + filters.categoryIds.length
  }, [filters])

  const handleGoalToggle = (goalId: string) => {
    const newGoalIds = filters.goalIds.includes(goalId)
      ? filters.goalIds.filter((id) => id !== goalId)
      : [...filters.goalIds, goalId]
    onChange({ ...filters, goalIds: newGoalIds })
  }

  const handleCategoryToggle = (categoryId: string) => {
    const newCategoryIds = filters.categoryIds.includes(categoryId)
      ? filters.categoryIds.filter((id) => id !== categoryId)
      : [...filters.categoryIds, categoryId]
    onChange({ ...filters, categoryIds: newCategoryIds })
  }

  const clearFilters = () => {
    onChange({ goalIds: [], categoryIds: [] })
  }

  const selectedGoalNames = useMemo((): string[] => {
    return (goals as Goal[])
      .filter((g: Goal) => filters.goalIds.includes(g.id))
      .map((g: Goal) => g.title)
  }, [goals, filters.goalIds])

  const selectedCategoryNames = useMemo((): string[] => {
    return categories
      .filter((c: Category) => filters.categoryIds.includes(c.id))
      .map((c: Category) => c.name)
  }, [categories, filters.categoryIds])

  return (
    <div className="flex flex-wrap items-center gap-2">
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <div className="flex items-center rounded-md border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground">
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'btn-brutal-secondary gap-2 border-none shadow-none hover:bg-transparent',
                activeFilterCount > 0 && 'rounded-r-none pr-2',
              )}
            >
              <Filter className="h-4 w-4" />
              <span className="hidden sm:inline">Filters</span>
            </Button>
          </DropdownMenuTrigger>
          {activeFilterCount > 0 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation()
                clearFilters()
              }}
              className="h-9 w-8 rounded-l-none border-l hover:bg-transparent hover:text-destructive"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Clear filters</span>
            </Button>
          )}
        </div>
        <DropdownMenuContent className="w-64 border-3 border-secondary" align="end">
          <DropdownMenuLabel className="flex items-center justify-between">
            <span className="font-bold uppercase">Filter By</span>
            {activeFilterCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-auto p-1 text-xs text-gray-500 hover:text-gray-700"
              >
                Clear all
              </Button>
            )}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {/* Goals Section */}
          <DropdownMenuLabel className="text-xs font-semibold uppercase text-gray-500">
            Goals
          </DropdownMenuLabel>
          {goals.length === 0 ? (
            <div className="px-2 py-1 text-sm text-gray-400">No goals available</div>
          ) : (
            (goals as Goal[]).map((goal: Goal) => (
              <DropdownMenuCheckboxItem
                key={goal.id}
                checked={filters.goalIds.includes(goal.id)}
                onCheckedChange={() => handleGoalToggle(goal.id)}
                className="cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  {goal.color && (
                    <div
                      className="h-3 w-3 rounded-full border border-black/20"
                      style={{ backgroundColor: goal.color }}
                    />
                  )}
                  <span className="truncate">{goal.title}</span>
                </div>
              </DropdownMenuCheckboxItem>
            ))
          )}
          
          <DropdownMenuSeparator />
          
          {/* Categories Section */}
          <DropdownMenuLabel className="text-xs font-semibold uppercase text-gray-500">
            Categories
          </DropdownMenuLabel>
          {categories.length === 0 ? (
            <div className="px-2 py-1 text-sm text-gray-400">No categories available</div>
          ) : (
            categories.map((category) => (
              <DropdownMenuCheckboxItem
                key={category.id}
                checked={filters.categoryIds.includes(category.id)}
                onCheckedChange={() => handleCategoryToggle(category.id)}
                className="cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  {category.color && (
                    <div
                      className="h-3 w-3 rounded-full border border-black/20"
                      style={{ backgroundColor: category.color }}
                    />
                  )}
                  <span className="truncate">{category.name}</span>
                </div>
              </DropdownMenuCheckboxItem>
            ))
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Active Filter Tags */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap items-center gap-1">
          {selectedGoalNames.map((name: string) => (
            <Badge
              key={name}
              variant="secondary"
              className="gap-1 border-2 border-secondary bg-white px-2 py-1 text-xs"
            >
              {name}
              <button
                type="button"
                onClick={() => {
                  const goal = (goals as Goal[]).find((g: Goal) => g.title === name)
                  if (goal) handleGoalToggle(goal.id)
                }}
                className="hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          {selectedCategoryNames.map((name: string) => (
            <Badge
              key={name}
              variant="outline"
              className="gap-1 border-2 border-secondary bg-gray-100 px-2 py-1 text-xs"
            >
              {name}
              <button
                type="button"
                onClick={() => {
                  const category = categories.find((c: Category) => c.name === name)
                  if (category) handleCategoryToggle(category.id)
                }}
                className="hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}

export function useFilteredEntries<T extends { goalId?: string | null; goal?: { id: string } | null; task?: { category: string | null } | null }>(
  entries: T[],
  filters: ReportFilterState
): T[] {
  return useMemo(() => {
    let filtered = entries

    // Filter by goals
    if (filters.goalIds.length > 0) {
      filtered = filtered.filter((entry) => {
        const entryGoalId = entry.goalId || entry.goal?.id
        return entryGoalId && filters.goalIds.includes(entryGoalId)
      })
    }

    // Filter by categories (from task)
    if (filters.categoryIds.length > 0) {
      filtered = filtered.filter((entry) => {
        const taskCategory = entry.task?.category
        return taskCategory && filters.categoryIds.includes(taskCategory)
      })
    }

    return filtered
  }, [entries, filters.goalIds, filters.categoryIds])
}

export const emptyFilters: ReportFilterState = {
  goalIds: [],
  categoryIds: [],
}
