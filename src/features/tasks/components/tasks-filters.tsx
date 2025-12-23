import { GroupBy } from '@/features/tasks/utils/types'
import { Calendar, Clock, Layers, LayoutList, List } from 'lucide-react'

import { cn } from '@/lib/utils'

interface TasksFiltersProps {
  compactView: boolean
  onCompactViewChange: (compact: boolean) => void
  showCompleted: boolean
  onShowCompletedChange: (show: boolean) => void
  groupBy: GroupBy
  onGroupByChange: (groupBy: GroupBy) => void
}

export function TasksFilters({
  compactView,
  onCompactViewChange,
  showCompleted,
  onShowCompletedChange,
  groupBy,
  onGroupByChange,
}: TasksFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-6 py-2">
      {/* View Toggle */}
      <div className="flex min-w-[200px] flex-col gap-1.5">
        <span className="ml-1 text-[10px] font-black uppercase tracking-widest text-secondary/60">View Mode</span>
        <div className="flex gap-2">
          <button
            onClick={() => onCompactViewChange(true)}
            className={cn(
              'flex flex-1 items-center justify-center gap-2 px-3 py-2 font-bold uppercase text-xs border-3 border-secondary transition-all shadow-brutal-sm active:translate-x-0 active:translate-y-0',
              compactView ? 'bg-primary text-secondary' : 'bg-white hover:bg-gray-50',
            )}
          >
            <List className="h-3.5 w-3.5" />
            Compact
          </button>
          <button
            onClick={() => onCompactViewChange(false)}
            className={cn(
              'flex flex-1 items-center justify-center gap-2 px-3 py-2 font-bold uppercase text-xs border-3 border-secondary transition-all shadow-brutal-sm active:translate-x-0 active:translate-y-0',
              !compactView ? 'bg-primary text-secondary' : 'bg-white hover:bg-gray-50',
            )}
          >
            <LayoutList className="h-3.5 w-3.5" />
            Detail
          </button>
        </div>
      </div>

      {/* Task Status Filter */}
      <div className="flex min-w-[160px] flex-col gap-1.5">
        <span className="ml-1 text-[10px] font-black uppercase tracking-widest text-secondary/60">Status</span>
        <div className="flex gap-2">
          <button
            onClick={() => onShowCompletedChange(false)}
            className={cn(
              'flex-1 px-4 py-2 font-bold uppercase text-xs border-3 border-secondary transition-all shadow-brutal-sm active:translate-x-0 active:translate-y-0',
              !showCompleted ? 'bg-primary text-secondary' : 'bg-white hover:bg-gray-50',
            )}
          >
            Active
          </button>
          <button
            onClick={() => onShowCompletedChange(true)}
            className={cn(
              'flex-1 px-4 py-2 font-bold uppercase text-xs border-3 border-secondary transition-all shadow-brutal-sm active:translate-x-0 active:translate-y-0',
              showCompleted ? 'bg-primary text-secondary' : 'bg-white hover:bg-gray-50',
            )}
          >
            All
          </button>
        </div>
      </div>

      {/* Group By Filter */}
      <div className="flex min-w-[240px] flex-col gap-1.5">
        <span className="ml-1 text-[10px] font-black uppercase tracking-widest text-secondary/60">Group By</span>
        <div className="flex border-3 border-secondary bg-white p-1 shadow-brutal-sm">
          <button
            onClick={() => onGroupByChange('status')}
            className={cn(
              'flex flex-1 items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase transition-colors',
              groupBy === 'status' ? 'bg-primary text-secondary' : 'hover:bg-gray-100',
            )}
          >
            <Layers className="h-3.5 w-3.5" />
            Status
          </button>
          <button
            onClick={() => onGroupByChange('day')}
            className={cn(
              'flex flex-1 items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase transition-colors',
              groupBy === 'day' ? 'bg-primary text-secondary' : 'hover:bg-gray-100',
            )}
          >
            <Calendar className="h-3.5 w-3.5" />
            Day
          </button>
          <button
            onClick={() => onGroupByChange('schedule')}
            className={cn(
              'flex flex-1 items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase transition-colors',
              groupBy === 'schedule' ? 'bg-primary text-secondary' : 'hover:bg-gray-100',
            )}
          >
            <Clock className="h-3.5 w-3.5" />
            Time
          </button>
        </div>
      </div>
    </div>
  )
}
