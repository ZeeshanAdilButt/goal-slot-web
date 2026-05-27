'use client'

import { useState } from 'react'

import { GoalModal } from '@/features/goals/components/goal-modal'
import { GoalsFilters } from '@/features/goals/components/goals-filters'
import { GoalsHeader } from '@/features/goals/components/goals-header'
import { GoalsLimitBanner } from '@/features/goals/components/goals-limit-banner'
import { GoalsList } from '@/features/goals/components/goals-list'
import { GoalsStats } from '@/features/goals/components/goals-stats'
import { useGoalsQuery } from '@/features/goals/hooks/use-goals-queries'
import { Goal, GoalFilters } from '@/features/goals/utils/types'

import { PageShell } from '@/components/ui/page-shell'

export function GoalsPage() {
  const [filters, setFilters] = useState<GoalFilters>({ status: 'ACTIVE' })
  const [showModal, setShowModal] = useState(false)
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)

  const goalsQuery = useGoalsQuery(filters)
  // Also fetch active goals count for limit banner
  const activeGoalsQuery = useGoalsQuery({ status: 'ACTIVE' })
  const activeGoalsCount = activeGoalsQuery.data?.length ?? 0

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
    <PageShell>
      <GoalsHeader onCreateClick={() => setShowModal(true)} />

      <GoalsLimitBanner activeGoalsCount={activeGoalsCount} />

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
    </PageShell>
  )
}
