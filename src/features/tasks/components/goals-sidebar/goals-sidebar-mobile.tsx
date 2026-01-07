import { useState } from 'react'

import { GoalModal } from '@/features/goals/components/goal-modal'
import { ChevronDown, ChevronUp, Plus } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Loading } from '@/components/ui/loading'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

import { GOAL_STATUS_OPTIONS, GoalsSidebarProps, WITHOUT_GOALS_ID } from './types'

export function GoalsSidebarMobile({
  goals,
  selectedGoalId,
  onSelectGoal,
  selectedStatus,
  onSelectStatus,
  isLoading,
}: GoalsSidebarProps) {
  const [showModal, setShowModal] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const selectedGoal = goals.find((g) => g.id === selectedGoalId)
  const isWithoutGoals = selectedGoalId === WITHOUT_GOALS_ID

  return (
    <>
      {/* Mobile Goal Selector - Inline below header */}
      <div className="border-3 border-secondary bg-brutalist-bg md:hidden">
        {/* Current Goal Display - Click to expand */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex w-full items-center justify-between gap-3 border-b-3 border-secondary bg-white p-4 transition-all hover:bg-gray-50"
        >
          <div className="flex min-w-0 flex-1 items-center gap-3">
            {isWithoutGoals ? (
              <>
                <span className="inline-block h-3 w-3 flex-shrink-0 rounded-full bg-gray-400" />
                <span className="truncate text-sm font-bold uppercase">Without Goals</span>
              </>
            ) : selectedGoal ? (
              <>
                <span
                  className="inline-block h-3 w-3 flex-shrink-0 rounded-full"
                  style={{ background: selectedGoal.color }}
                />
                <span className="truncate text-sm font-bold uppercase">{selectedGoal.title}</span>
              </>
            ) : (
              <span className="text-sm font-bold uppercase text-gray-500">Select a Goal</span>
            )}
          </div>
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <Select value={selectedStatus} onValueChange={onSelectStatus}>
              <SelectTrigger className="h-8 w-24 border-3 border-secondary bg-white text-[10px] font-bold uppercase shadow-brutal-sm">
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
            {isExpanded ? (
              <ChevronUp className="h-5 w-5 flex-shrink-0" />
            ) : (
              <ChevronDown className="h-5 w-5 flex-shrink-0" />
            )}
          </div>
        </button>

        {/* Expanded Goals List */}
        {isExpanded && (
          <div className="max-h-[60vh] overflow-y-auto border-b-3 border-secondary bg-brutalist-bg">
            {isLoading ? (
              <div className="flex min-h-[150px] items-center justify-center">
                <Loading size="sm" />
              </div>
            ) : (
              <div className="space-y-0">
                {/* Without Goals option */}
                <button
                  onClick={() => {
                    onSelectGoal(WITHOUT_GOALS_ID)
                    setIsExpanded(false)
                  }}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3 text-left font-bold uppercase text-xs border-b-2 border-secondary/20 transition-all',
                    selectedGoalId === WITHOUT_GOALS_ID ? 'bg-primary text-secondary' : 'bg-white hover:bg-gray-50',
                  )}
                >
                  <span className="inline-block h-2.5 w-2.5 flex-shrink-0 rounded-full bg-gray-400" />
                  <span className="flex-1 truncate">Without Goals</span>
                </button>

                {goals.length === 0 ? (
                  <div className="bg-white p-6 text-center">
                    <p className="font-mono text-sm text-gray-600">No goals available</p>
                  </div>
                ) : (
                  goals.map((goal) => (
                    <button
                      key={goal.id}
                      onClick={() => {
                        onSelectGoal(goal.id)
                        setIsExpanded(false)
                      }}
                      className={cn(
                        'w-full flex items-center gap-3 px-4 py-3 text-left font-bold uppercase text-xs border-b-2 border-secondary/20 transition-all',
                        selectedGoalId === goal.id ? 'bg-primary text-secondary' : 'bg-white hover:bg-gray-50',
                      )}
                    >
                      <span
                        className="inline-block h-2.5 w-2.5 flex-shrink-0 rounded-full"
                        style={{ background: goal.color }}
                      />
                      <span className="flex-1 truncate">{goal.title}</span>
                    </button>
                  ))
                )}

                {/* New Goal Button */}
                <button
                  onClick={() => {
                    setShowModal(true)
                    setIsExpanded(false)
                  }}
                  className="flex w-full items-center justify-center gap-2 border-t-3 border-secondary bg-primary px-4 py-3 text-sm font-bold uppercase transition-all hover:bg-white"
                >
                  <Plus className="h-4 w-4" />
                  <span>New Goal</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <GoalModal isOpen={showModal} onClose={() => setShowModal(false)} goal={null} />
    </>
  )
}
