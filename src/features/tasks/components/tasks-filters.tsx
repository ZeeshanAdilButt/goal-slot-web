import { ArrowUpDown, Eye, EyeOff } from 'lucide-react'

import { cn } from '@/lib/utils'

import type { SortBy } from '../utils/types'

const SORT_OPTIONS: { value: SortBy; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'due_date', label: 'Due date' },
  { value: 'goal', label: 'Goal' },
  { value: 'status', label: 'Status' },
]

interface TasksFiltersProps {
  showCompleted: boolean
  onShowCompletedChange: (show: boolean) => void
  sortBy: SortBy
  onSortByChange: (sort: SortBy) => void
}

export function TasksFilters({ showCompleted, onShowCompletedChange, sortBy, onSortByChange }: TasksFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 py-2">
      {/* Sort dropdown */}
      <div className="flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-2.5 py-1 shadow-sm">
        <ArrowUpDown className="h-3 w-3 text-zinc-400" />
        <select
          value={sortBy}
          onChange={(e) => onSortByChange(e.target.value as SortBy)}
          className="h-6 border-none bg-transparent text-xs font-medium text-zinc-700 focus:outline-none"
          aria-label="Sort tasks"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Show/hide completed */}
      <button
        type="button"
        onClick={() => onShowCompletedChange(!showCompleted)}
        aria-pressed={!showCompleted}
        className={cn(
          'inline-flex h-8 items-center gap-1.5 rounded-md border px-3 text-xs font-medium transition-colors',
          showCompleted
            ? 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50'
            : 'border-zinc-900 bg-zinc-900 text-white hover:bg-zinc-800',
        )}
      >
        {showCompleted ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
        {showCompleted ? 'Hide completed' : 'Show completed'}
      </button>
    </div>
  )
}
