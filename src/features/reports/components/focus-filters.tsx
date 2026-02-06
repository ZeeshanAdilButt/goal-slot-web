'use client'

import { useMemo, useState } from 'react'

import { useCategoriesQuery } from '@/features/categories/hooks/use-categories-queries'
import { useTimeTrackerData } from '@/features/time-tracker/hooks/use-time-tracker-queries'
import type { Goal } from '@/features/time-tracker/utils/types'
import { Filter, X } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
  explicitGoals?: Goal[]
  explicitCategories?: Category[]
  triggerClassName?: string
}

export function FocusFilters({
  filters,
  onChange,
  explicitGoals,
  explicitCategories,
  triggerClassName,
}: FocusFiltersProps) {
  const [open, setOpen] = useState(false)
  const [draftFilters, setDraftFilters] = useState<ReportFilterState>(filters)
  const { goals: myGoals } = useTimeTrackerData()
  const { data: myCategories = [] } = useCategoriesQuery() as { data: Category[] }

  const goals = explicitGoals ?? myGoals
  const categories = explicitCategories ?? myCategories

  const activeFilterCount = useMemo(() => {
    return filters.goalIds.length + filters.categoryIds.length
  }, [filters])

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)
    setDraftFilters(filters)
  }

  const handleDraftGoalToggle = (goalId: string) => {
    setDraftFilters((prev) => ({
      ...prev,
      goalIds: prev.goalIds.includes(goalId) ? prev.goalIds.filter((id) => id !== goalId) : [...prev.goalIds, goalId],
    }))
  }

  const handleDraftCategoryToggle = (categoryId: string) => {
    setDraftFilters((prev) => ({
      ...prev,
      categoryIds: prev.categoryIds.includes(categoryId)
        ? prev.categoryIds.filter((id) => id !== categoryId)
        : [...prev.categoryIds, categoryId],
    }))
  }

  const clearFilters = () => {
    onChange({ goalIds: [], categoryIds: [] })
  }

  const clearDraftFilters = () => {
    setDraftFilters({ goalIds: [], categoryIds: [] })
  }

  const applyDraftFilters = () => {
    onChange(draftFilters)
    setOpen(false)
  }

  const selectedGoals = useMemo((): Goal[] => {
    return (goals as Goal[]).filter((g: Goal) => filters.goalIds.includes(g.id))
  }, [goals, filters.goalIds])

  const selectedCategoryNames = useMemo((): string[] => {
    return categories.filter((c: Category) => filters.categoryIds.includes(c.id)).map((c: Category) => c.name)
  }, [categories, filters.categoryIds])

  return (
    <div className="flex flex-wrap items-center gap-2">
      <DropdownMenu open={open} onOpenChange={handleOpenChange}>
        <div className="flex items-center rounded-md border-3 border-secondary bg-white shadow-brutal">
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'btn-brutal-secondary h-10 gap-2 border-none bg-transparent shadow-none hover:bg-primary/20',
                activeFilterCount > 0 && 'rounded-r-none pr-2',
                triggerClassName,
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
              className="h-9 w-8 rounded-l-none border-l-2 border-secondary hover:bg-primary/20 hover:text-destructive"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Clear filters</span>
            </Button>
          )}
        </div>
        <DropdownMenuContent className="w-64 border-3 border-secondary bg-white p-1.5 shadow-brutal" align="end">
          <DropdownMenuLabel className="flex items-center justify-between">
            <span className="font-bold uppercase">Filter By</span>
            {(open ? draftFilters.goalIds.length + draftFilters.categoryIds.length : activeFilterCount) > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={open ? clearDraftFilters : clearFilters}
                className="h-auto p-1 text-xs text-gray-500 hover:bg-primary/20 hover:text-gray-700"
              >
                Clear all
              </Button>
            )}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          {/* Goals Section */}
          <DropdownMenuLabel className="text-xs font-semibold uppercase text-gray-500">Goals</DropdownMenuLabel>
          {goals.length === 0 ? (
            <div className="px-2 py-1 text-sm text-gray-400">No goals available</div>
          ) : (
            (goals as Goal[]).map((goal: Goal) => (
              <DropdownMenuCheckboxItem
                key={goal.id}
                checked={draftFilters.goalIds.includes(goal.id)}
                onCheckedChange={() => handleDraftGoalToggle(goal.id)}
                onSelect={(e) => e.preventDefault()}
                className="cursor-pointer hover:bg-primary/20 data-[highlighted]:bg-primary/20 data-[highlighted]:text-foreground"
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
          <DropdownMenuLabel className="text-xs font-semibold uppercase text-gray-500">Categories</DropdownMenuLabel>
          {categories.length === 0 ? (
            <div className="px-2 py-1 text-sm text-gray-400">No categories available</div>
          ) : (
            categories.map((category) => (
              <DropdownMenuCheckboxItem
                key={category.id}
                checked={draftFilters.categoryIds.includes(category.id)}
                onCheckedChange={() => handleDraftCategoryToggle(category.id)}
                onSelect={(e) => e.preventDefault()}
                className="cursor-pointer hover:bg-primary/20 data-[highlighted]:bg-primary/20 data-[highlighted]:text-foreground"
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
          <DropdownMenuSeparator />
          <div className="p-1">
            <Button className="h-9 w-full" size="sm" onClick={applyDraftFilters}>
              Apply filters
            </Button>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Active Filter Tags */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap items-center gap-1">
          {selectedGoals.map((goal: Goal) => (
            <Badge
              key={goal.id}
              variant="outline"
              className="gap-1.5 border-2 border-secondary bg-white px-2 py-1 text-xs text-foreground"
            >
              {goal.color != null && (
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full border border-black/20"
                  style={{ backgroundColor: goal.color }}
                />
              )}
              <span className="truncate">{goal.title}</span>
              <button
                type="button"
                onClick={() => {
                  onChange({
                    ...filters,
                    goalIds: filters.goalIds.filter((id) => id !== goal.id),
                  })
                }}
                className="shrink-0 text-foreground hover:text-destructive"
              >
                <X className="h-4 w-4" />
              </button>
            </Badge>
          ))}
          {selectedCategoryNames.map((name: string) => (
            <Badge
              key={name}
              variant="outline"
              className="gap-1 border-2 border-secondary bg-gray-100 px-2 py-1 text-xs text-foreground"
            >
              {name}
              <button
                type="button"
                onClick={() => {
                  const category = categories.find((c: Category) => c.name === name)
                  if (!category) return
                  onChange({
                    ...filters,
                    categoryIds: filters.categoryIds.filter((id) => id !== category.id),
                  })
                }}
                className="text-foreground hover:text-destructive"
              >
                <X className="h-4 w-4" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}

export function useFilteredEntries<
  T extends { goalId?: string | null; goal?: { id: string } | null; task?: { category: string | null } | null },
>(entries: T[], filters: ReportFilterState): T[] {
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
