'use client'

import { useMemo, useState } from 'react'

import { GoalModal } from '@/features/goals/components/goal-modal'
import { GoalsFilters } from '@/features/goals/components/goals-filters'
import { GoalsHeader } from '@/features/goals/components/goals-header'
import { GoalsLimitBanner } from '@/features/goals/components/goals-limit-banner'
import { GoalsList } from '@/features/goals/components/goals-list'
import { GoalsStats } from '@/features/goals/components/goals-stats'
import { useGoalsQuery } from '@/features/goals/hooks/use-goals-queries'
import { Goal, GoalFilters } from '@/features/goals/utils/types'
import { useQuery } from '@tanstack/react-query'

import { scheduleApi } from '@/lib/api'
import { PageShell } from '@/components/ui/page-shell'

export function GoalsPage() {
  const [filters, setFilters] = useState<GoalFilters>({ status: 'ACTIVE' })
  const [showModal, setShowModal] = useState(false)
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)

  const goalsQuery = useGoalsQuery(filters)
  const activeGoalsQuery = useGoalsQuery({ status: 'ACTIVE' })
  const activeGoalsCount = activeGoalsQuery.data?.length ?? 0

  // Pull the weekly schedule so we can sort goals by their next block.
  const scheduleQuery = useQuery({
    queryKey: ['schedule', 'weekly'],
    queryFn: async () => (await scheduleApi.getWeekly()).data,
    staleTime: 30_000,
  })

  // Schedule-aware sort: goals with a block sooner float up. Active-now
  // (block running this minute) is treated as 0; unscheduled = Infinity.
  const sortedGoals = useMemo(() => {
    const goals = goalsQuery.data ?? []
    const weekly = scheduleQuery.data ?? {}
    const blocks: { goalId: string | null; dayOfWeek: number; startTime: string; endTime: string }[] = []
    Object.values(weekly).forEach((arr: any) => {
      if (Array.isArray(arr)) blocks.push(...arr)
    })
    const now = new Date()
    const todayDow = now.getDay()
    const nowMin = now.getHours() * 60 + now.getMinutes()
    const parseHM = (s: string): number => {
      const [h, m] = s.split(':').map(Number)
      return h * 60 + m
    }
    const nextByGoal = new Map<string, number>()
    blocks.forEach((b) => {
      if (!b.goalId || typeof b.dayOfWeek !== 'number') return
      const start = parseHM(b.startTime)
      const end = parseHM(b.endTime)
      if (Number.isNaN(start) || Number.isNaN(end)) return
      if (b.dayOfWeek === todayDow && nowMin >= start && nowMin < end) {
        nextByGoal.set(b.goalId, 0)
        return
      }
      let daysUntil = (b.dayOfWeek - todayDow + 7) % 7
      let m = daysUntil * 1440 + start - nowMin
      if (m < 0) m += 7 * 1440
      const prev = nextByGoal.get(b.goalId)
      if (prev === undefined || m < prev) nextByGoal.set(b.goalId, m)
    })
    const withIdx = goals.map((g, i) => ({
      g,
      i,
      key: nextByGoal.get(g.id) ?? Number.POSITIVE_INFINITY,
    }))
    withIdx.sort((a, b) => (a.key === b.key ? a.i - b.i : a.key - b.key))
    return withIdx.map((x) => x.g)
  }, [goalsQuery.data, scheduleQuery.data])

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
        goals={sortedGoals}
        isLoading={goalsQuery.isLoading}
        filter={filters.status || 'ACTIVE'}
        onEdit={handleEdit}
        onCreateClick={() => setShowModal(true)}
      />

      <GoalModal isOpen={showModal} onClose={handleCloseModal} goal={editingGoal} />
    </PageShell>
  )
}
