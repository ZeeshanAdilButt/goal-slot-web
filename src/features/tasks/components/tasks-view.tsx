'use client'

import { useMemo, useState } from 'react'
import { GoalsSidebarMobile } from '@/features/tasks/components/goals-sidebar/goals-sidebar-mobile'
import { TaskBoard } from '@/features/tasks/components/task-board'
import { Goal, Task } from '@/features/tasks/utils/types'
import { Calendar, Clock, Filter, Plus, X } from 'lucide-react'

import { GoalSlotSpinner } from '@/components/goalslot-logo'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { startOfDay, startOfWeek, isSameDay, isBefore, addDays, getWeek } from 'date-fns'

interface TasksViewProps {
  tasks: Task[]
  onComplete: (task: Task) => void
  onEdit: (task: Task) => void
  onCreate: () => void
  hasSelectedGoal: boolean
  isLoading: boolean
  goals?: Goal[]
  selectedGoalId?: string | null
  onSelectGoal?: (id: string | null) => void
  selectedStatus?: string
  onSelectStatus?: (status: string) => void
  goalsLoading?: boolean
}

export function TasksView({
  tasks,
  onComplete,
  onEdit,
  onCreate,
  hasSelectedGoal,
  isLoading,
  goals = [],
  selectedGoalId = null,
  onSelectGoal,
  selectedStatus = 'ACTIVE',
  onSelectStatus,
  goalsLoading = false,
}: TasksViewProps) {
  const [dueDateFilter, setDueDateFilter] = useState<string>('all')
  const [durationFilter, setDurationFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // Search Filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesTitle = task.title.toLowerCase().includes(query)
        const matchesDesc = task.description?.toLowerCase().includes(query)
        if (!matchesTitle && !matchesDesc) return false
      }

      // Due Date Filter
      if (dueDateFilter !== 'all') {
        if (dueDateFilter === 'no_date') {
          if (task.dueDate) return false
        } else if (task.dueDate) {
          const date = new Date(task.dueDate)
          const today = startOfDay(new Date())
          
          if (dueDateFilter === 'overdue') {
            if (!isBefore(date, today)) return false
          } else if (dueDateFilter === 'today') {
            if (!isSameDay(date, today)) return false
          } else if (dueDateFilter === 'week') {
            // Check if same ISO week
             const taskWeek = getWeek(date)
             const currentWeek = getWeek(today)
             if (taskWeek !== currentWeek) return false
          }
        } else {
           // If filtering by specific date criteria but task has no date
           return false
        }
      }

      // Duration Filter
      if (durationFilter !== 'all') {
        // If task has no estimate, treat as 'unknown' or maybe 0? 
        // Let's include unchecked items if user selects 'short' maybe? 
        // Better to check explicitly.
        const minutes = task.estimatedMinutes || 0
        
        if (durationFilter === 'short') { // < 30m
          if (minutes === 0 || minutes >= 30) return false
        } else if (durationFilter === 'medium') { // 30m - 2h
          if (minutes < 30 || minutes > 120) return false
        } else if (durationFilter === 'long') { // > 2h
          if (minutes <= 120) return false
        } else if (durationFilter === 'no_estimate') {
          if (task.estimatedMinutes) return false
        }
      }

      return true
    })
  }, [tasks, dueDateFilter, durationFilter, searchQuery])

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <GoalSlotSpinner size="md" />
      </div>
    )
  }

  if (!hasSelectedGoal) {
    return (
      <div className="p-4 sm:p-6">
        <div className="px-0 sm:px-4 md:-ml-[3px] md:px-0">
          <div className="card-brutal p-4 text-center font-mono text-sm text-gray-600 sm:p-6 sm:text-base">
            Select a goal to view tasks.
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      <div className="p-4 sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="font-display text-2xl font-bold uppercase sm:text-3xl md:text-4xl">Tasks</h1>
          <button
            onClick={onCreate}
            className="btn-brutal flex items-center gap-2 px-3 py-2 text-sm sm:px-4 sm:py-2 md:px-6 md:py-3 md:text-base"
          >
            <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="hidden sm:inline">New Task</span>
            <span className="sm:hidden">New</span>
          </button>
        </div>

        {onSelectGoal && onSelectStatus && (
          <div className="mb-4 md:hidden">
            <GoalsSidebarMobile
              goals={goals}
              selectedGoalId={selectedGoalId}
              onSelectGoal={onSelectGoal}
              selectedStatus={selectedStatus}
              onSelectStatus={onSelectStatus}
              isLoading={goalsLoading}
            />
          </div>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
             {/* Search */}
             <input
               type="text"
               placeholder="Search tasks..."
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               className="h-8 w-full rounded-sm border-2 border-secondary bg-white px-3 text-xs font-bold uppercase placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black/20 sm:w-48"
             />

             {/* Filters Row */}
             <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
                <Select value={dueDateFilter} onValueChange={setDueDateFilter}>
                  <SelectTrigger className="h-8 w-[130px] border-2 border-secondary bg-white text-[10px] font-bold uppercase shadow-brutal-sm">
                     <div className="flex items-center gap-2">
                       <Calendar className="h-3 w-3" />
                       <span className="truncate">{dueDateFilter === 'all' ? 'Any Date' : dueDateFilter.replace('_', ' ')}</span>
                     </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any Date</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="no_date">No Date</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={durationFilter} onValueChange={setDurationFilter}>
                  <SelectTrigger className="h-8 w-[130px] border-2 border-secondary bg-white text-[10px] font-bold uppercase shadow-brutal-sm">
                     <div className="flex items-center gap-2">
                       <Clock className="h-3 w-3" />
                       <span className="truncate">{durationFilter === 'all' ? 'Any Duration' : durationFilter.replace('_', ' ')}</span>
                     </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any Duration</SelectItem>
                    <SelectItem value="short">Short (&lt;30m)</SelectItem>
                    <SelectItem value="medium">Medium (30m-2h)</SelectItem>
                    <SelectItem value="long">Long (&gt;2h)</SelectItem>
                    <SelectItem value="no_estimate">No Estimate</SelectItem>
                  </SelectContent>
                </Select>
                
                {(dueDateFilter !== 'all' || durationFilter !== 'all' || searchQuery) && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => {
                      setDueDateFilter('all')
                      setDurationFilter('all')
                      setSearchQuery('')
                    }}
                    className="h-8 px-2 text-red-500 hover:bg-red-50 hover:text-red-600"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
             </div>
          </div>
        
          <div className="hidden items-center gap-2 text-[10px] font-semibold uppercase tracking-wide text-secondary/70 lg:flex">
            <span className="rounded-sm border border-dashed border-secondary/40 px-2 py-1">Drag tasks to reorder</span>
          </div>
        </div>
      </div>

      <div className="pb-4 sm:pb-6">
        <TaskBoard tasks={filteredTasks} onEdit={onEdit} onComplete={onComplete} />
      </div>
    </div>
  )
}
