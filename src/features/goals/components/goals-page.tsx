'use client'

import { useState } from 'react'

import { GoalModal } from '@/features/goals/components/goal-modal'
import { GoalsFilters } from '@/features/goals/components/goals-filters'
import { GoalsHeader } from '@/features/goals/components/goals-header'
import { GoalsList } from '@/features/goals/components/goals-list'
import { GoalsStats } from '@/features/goals/components/goals-stats'
import { useGoalsQuery } from '@/features/goals/hooks/use-goals-queries'
import { Goal } from '@/features/goals/utils/types'

export function GoalsPage() {
  const [filter, setFilter] = useState<string>('ACTIVE')
  const [showModal, setShowModal] = useState(false)
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)

  const goalsQuery = useGoalsQuery(filter)

  const handleEdit = (goal: Goal) => {
    setEditingGoal(goal)
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingGoal(null)
  }

  return (
    <div className="space-y-8 p-6">
      <GoalsHeader onCreateClick={() => setShowModal(true)} />

      <GoalsStats />

      <GoalsFilters filter={filter} onFilterChange={setFilter} />

      <GoalsList
        goals={goalsQuery.data || []}
        isLoading={goalsQuery.isLoading}
        filter={filter}
        onEdit={handleEdit}
        onCreateClick={() => setShowModal(true)}
      />

      <GoalModal isOpen={showModal} onClose={handleCloseModal} goal={editingGoal} />
    </div>
  )
}
