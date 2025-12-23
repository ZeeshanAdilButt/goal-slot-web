import { useState } from 'react'

import { GoalModal } from '@/features/goals/components/goal-modal'
import { Plus } from 'lucide-react'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

import { GOAL_STATUS_OPTIONS, GoalsSidebarProps } from './types'

export function GoalsSidebarMobile({
  goals,
  selectedGoalId,
  onSelectGoal,
  selectedStatus,
  onSelectStatus,
}: GoalsSidebarProps) {
  const [showModal, setShowModal] = useState(false)
  const selectedGoal = goals.find((g) => g.id === selectedGoalId)

  return (
    <>
      <div className="flex flex-col gap-3 border-b-3 border-secondary bg-brutalist-bg p-4 md:hidden">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-black uppercase tracking-tight">Goals</span>
          <div className="flex items-center gap-2">
            <Select value={selectedStatus} onValueChange={onSelectStatus}>
              <SelectTrigger className="h-9 w-28 border-3 border-secondary bg-white text-[10px] font-bold uppercase shadow-brutal-sm">
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
            <button
              onClick={() => setShowModal(true)}
              className="flex h-9 w-9 shrink-0 items-center justify-center border-3 border-secondary bg-primary shadow-brutal-sm transition-all hover:bg-white hover:shadow-brutal-sm active:translate-x-0.5 active:translate-y-0.5"
              aria-label="New Goal"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Select value={selectedGoalId || ''} onValueChange={onSelectGoal}>
            <SelectTrigger className="h-11 min-w-0 flex-1 border-3 border-secondary bg-white shadow-brutal-sm">
              {selectedGoal ? (
                <div className="flex items-center gap-2 overflow-hidden">
                  <span
                    className="inline-block h-2.5 w-2.5 flex-shrink-0 rounded-full border border-secondary"
                    style={{ background: selectedGoal.color }}
                  />
                  <span className="truncate text-sm font-bold uppercase">{selectedGoal.title}</span>
                </div>
              ) : (
                <SelectValue placeholder="SELECT A GOAL" />
              )}
            </SelectTrigger>
            <SelectContent>
              {goals.length === 0 ? (
                <SelectItem value="no-goals" disabled>
                  No goals
                </SelectItem>
              ) : (
                goals.map((goal) => (
                  <SelectItem key={goal.id} value={goal.id}>
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-block h-2 w-2 shrink-0 rounded-full border border-secondary bg-transparent"
                        style={{ background: goal.color }}
                      />
                      <span className="text-xs font-bold uppercase">{goal.title}</span>
                    </div>
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      <GoalModal isOpen={showModal} onClose={() => setShowModal(false)} goal={null} />
    </>
  )
}
