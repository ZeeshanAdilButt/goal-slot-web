import { useState } from 'react'

import { GoalModal } from '@/features/goals/components/goal-modal'
import { Plus, Target } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Loading } from '@/components/ui/loading'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

import { GOAL_STATUS_OPTIONS, GoalsSidebarProps, WITHOUT_GOALS_ID } from './types'

export function GoalsSidebarDesktop({
  goals,
  selectedGoalId,
  onSelectGoal,
  selectedStatus,
  onSelectStatus,
  isLoading,
}: GoalsSidebarProps) {
  const [showModal, setShowModal] = useState(false)

  return (
    <>
      <aside className="hidden h-full w-64 flex-shrink-0 flex-col border-r-3 border-secondary bg-brutalist-bg md:flex">
        <div className="flex-shrink-0 border-b-3 border-secondary p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              <span className="text-lg font-bold uppercase">Goals</span>
            </div>
            <Select value={selectedStatus} onValueChange={onSelectStatus}>
              <SelectTrigger className="h-8 w-28 text-xs ">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {GOAL_STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex min-h-[200px] items-center justify-center">
              <Loading size="sm" />
            </div>
          ) : (
            <div className="space-y-1">
              {/* Without Goals option */}
              <button
                onClick={() => onSelectGoal(WITHOUT_GOALS_ID)}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-2 text-left font-bold uppercase text-xs border-3 border-secondary transition-all',
                  selectedGoalId === WITHOUT_GOALS_ID
                    ? 'bg-primary text-secondary shadow-brutal-sm -translate-x-0.5 -translate-y-0.5'
                    : 'bg-white hover:bg-gray-50 hover:shadow-brutal-sm hover:-translate-x-0.5 hover:-translate-y-0.5',
                )}
              >
                <span className="inline-block h-2 w-2 flex-shrink-0 rounded-full bg-gray-400" />
                <span className="truncate">Without Goals</span>
              </button>

              {goals.length === 0 ? (
                <div className="card-brutal p-4 text-center">
                  <p className="font-mono text-sm text-gray-600">No goals</p>
                </div>
              ) : (
                <>
                  {goals.map((goal) => (
                    <button
                      key={goal.id}
                      onClick={() => onSelectGoal(goal.id)}
                      className={cn(
                        'w-full flex items-center gap-2 px-3 py-2 text-left font-bold uppercase text-xs border-3 border-secondary transition-all',
                        selectedGoalId === goal.id
                          ? 'bg-primary text-secondary shadow-brutal-sm -translate-x-0.5 -translate-y-0.5'
                          : 'bg-white hover:bg-gray-50 hover:shadow-brutal-sm hover:-translate-x-0.5 hover:-translate-y-0.5',
                      )}
                    >
                      <span
                        className="inline-block h-2 w-2 flex-shrink-0 rounded-full"
                        style={{ background: goal.color }}
                      />
                      <span className="truncate">{goal.title}</span>
                    </button>
                  ))}
                </>
              )}
            </div>
          )}
        </div>

        <div className="flex-shrink-0 border-t-3 border-secondary p-4">
          <button
            onClick={() => setShowModal(true)}
            className="flex w-full items-center justify-center gap-2 border-3 border-secondary bg-white px-3 py-2 text-sm font-bold uppercase transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-primary hover:shadow-brutal-sm"
          >
            <Plus className="h-4 w-4" />
            <span>New Goal</span>
          </button>
        </div>
      </aside>

      <GoalModal isOpen={showModal} onClose={() => setShowModal(false)} goal={null} />
    </>
  )
}
