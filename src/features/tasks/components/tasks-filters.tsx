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
    <div className="flex flex-col gap-4 py-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-6">
      {/* View Toggle */}
      <div className="flex min-w-[160px] flex-col gap-1.5 sm:min-w-[200px]">
        <span className="ml-1 text-[10px] font-black uppercase tracking-widest text-secondary/60">View Mode</span>
        <div className="flex gap-2">
          <button
            onClick={() => onCompactViewChange(true)}
            className={cn(
              'flex flex-1 items-center justify-center gap-2 px-2 py-2 font-bold uppercase text-xs border-3 border-secondary transition-all shadow-brutal-sm active:translate-x-0 active:translate-y-0 sm:px-3',
              compactView ? 'bg-primary text-secondary' : 'bg-white hover:bg-gray-50',
            )}
          >
            <List className="h-3.5 w-3.5" />
            <span>Compact</span>
          </button>
          <button
            onClick={() => onCompactViewChange(false)}
            className={cn(
              'flex flex-1 items-center justify-center gap-2 px-2 py-2 font-bold uppercase text-xs border-3 border-secondary transition-all shadow-brutal-sm active:translate-x-0 active:translate-y-0 sm:px-3',
              !compactView ? 'bg-primary text-secondary' : 'bg-white hover:bg-gray-50',
            )}
          >
            <LayoutList className="h-3.5 w-3.5" />
            <span>Detail</span>
          </button>
        </div>
      </div>

      {/* Task Status Filter */}
      <div className="flex min-w-[140px] flex-col gap-1.5 sm:min-w-[160px]">
        <span className="ml-1 text-[10px] font-black uppercase tracking-widest text-secondary/60">Status</span>
        <div className="flex gap-2">
          <button
            onClick={() => onShowCompletedChange(false)}
            className={cn(
              'flex-1 px-3 py-2 font-bold uppercase text-xs border-3 border-secondary transition-all shadow-brutal-sm active:translate-x-0 active:translate-y-0 sm:px-4',
              !showCompleted ? 'bg-primary text-secondary' : 'bg-white hover:bg-gray-50',
            )}
          >
            Active
          </button>
          <button
            onClick={() => onShowCompletedChange(true)}
            className={cn(
              'flex-1 px-3 py-2 font-bold uppercase text-xs border-3 border-secondary transition-all shadow-brutal-sm active:translate-x-0 active:translate-y-0 sm:px-4',
              showCompleted ? 'bg-primary text-secondary' : 'bg-white hover:bg-gray-50',
            )}
          >
            All
          </button>
        </div>
      </div>

      {/* Group By Filter */}
      <div className="flex w-full flex-col gap-1.5 sm:w-auto sm:min-w-[240px]">
        <span className="ml-1 text-[10px] font-black uppercase tracking-widest text-secondary/60">Group By</span>
        <div className="flex border-3 border-secondary bg-white p-1 shadow-brutal-sm">
          <button
            onClick={() => onGroupByChange('status')}
            className={cn(
              'flex flex-1 items-center justify-center gap-1 px-2 py-1.5 text-xs font-bold uppercase transition-colors sm:gap-1.5 sm:px-3',
              groupBy === 'status' ? 'bg-primary text-secondary' : 'hover:bg-gray-100',
            )}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Status</span>
          </button>
          <button
            onClick={() => onGroupByChange('day')}
            className={cn(
              'flex flex-1 items-center justify-center gap-1 px-2 py-1.5 text-xs font-bold uppercase transition-colors sm:gap-1.5 sm:px-3',
              groupBy === 'day' ? 'bg-primary text-secondary' : 'hover:bg-gray-100',
            )}
          >
            <Calendar className="h-3.5 w-3.5" />
            <span>Day</span>
          </button>
          <button
            onClick={() => onGroupByChange('schedule')}
            className={cn(
              'flex flex-1 items-center justify-center gap-1 px-2 py-1.5 text-xs font-bold uppercase transition-colors sm:gap-1.5 sm:px-3',
              groupBy === 'schedule' ? 'bg-primary text-secondary' : 'hover:bg-gray-100',
            )}
          >
            <Clock className="h-3.5 w-3.5" />
            <span>Time</span>
          </button>
        </div>
      </div>
    </div>
  )
}
