'use client'

import { useState } from 'react'

import { GoalModal } from '@/features/goals/components/goal-modal'
import { GoalsFilters } from '@/features/goals/components/goals-filters'
import { GoalsHeader } from '@/features/goals/components/goals-header'
import { GoalsList } from '@/features/goals/components/goals-list'
import { GoalsStats } from '@/features/goals/components/goals-stats'
import { useGoalsQuery } from '@/features/goals/hooks/use-goals-queries'
import { Goal, GoalFilters } from '@/features/goals/utils/types'

export function GoalsPage() {
  const [filters, setFilters] = useState<GoalFilters>({ status: 'ACTIVE' })
  const [showModal, setShowModal] = useState(false)
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)

  const goalsQuery = useGoalsQuery(filters)

  const handleEdit = (goal: Goal) => {
    setEditingGoal(goal)
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingGoal(null)
  }

  const handleFilterChange = (newFilters: GoalFilters) => {
    setFilters(newFilters)
  }

  return (
    <div className="space-y-6 p-4 sm:space-y-8 sm:p-6">
      <GoalsHeader onCreateClick={() => setShowModal(true)} />

      <GoalsStats />

      <GoalsFilters filters={filters} onFilterChange={handleFilterChange} />

      <GoalsList
        goals={goalsQuery.data || []}
        isLoading={goalsQuery.isLoading}
        filter={filters.status || 'ACTIVE'}
        onEdit={handleEdit}
        onCreateClick={() => setShowModal(true)}
      />

      <GoalModal isOpen={showModal} onClose={handleCloseModal} goal={editingGoal} />
    </div>
  )
}
