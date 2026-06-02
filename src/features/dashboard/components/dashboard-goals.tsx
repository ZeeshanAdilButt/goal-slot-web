import Link from 'next/link'

import { Category } from '@/features/categories/utils/types'
import { Goal } from '@/features/goals/utils/types'
import { format } from 'date-fns'
import { motion } from 'framer-motion'
import { ArrowRight, Plus, Target } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { GlassCard } from '@/components/ui/glass-card'

interface DashboardGoalsProps {
  goals: Goal[]
  categories: Category[]
}

export function DashboardGoals({ goals, categories }: DashboardGoalsProps) {
  return (
    <div className="lg:col-span-2">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">Active Goals</h2>
        <Link
          href="/dashboard/goals"
          className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-500 transition-colors hover:text-zinc-900"
        >
          <span className="hidden sm:inline">View All</span>
          <span className="sm:hidden">All</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="space-y-3">
        {goals.length === 0 ? (
          <GlassCard className="py-10 text-center">
            <Target className="mx-auto mb-3 h-10 w-10 text-zinc-400" />
            <p className="mb-1 text-base font-semibold text-zinc-900">No active goals</p>
            <p className="mb-4 text-sm text-zinc-500">Create your first goal to start tracking</p>
            <Button asChild variant="brand" size="sm">
              <Link href="/dashboard/goals">
                <Plus className="h-4 w-4" /> Create Goal
              </Link>
            </Button>
          </GlassCard>
        ) : (
          goals.slice(0, 4).map((goal, i) => {
            const progress =
              goal.targetHours > 0 ? Math.min(100, Math.round((goal.loggedHours / goal.targetHours) * 100)) : 0
            const category = categories.find((cat) => cat.value === goal.category)

            return (
              <motion.div
                key={goal.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <GlassCard padded={false} className="flex items-stretch gap-4 p-4">
                  <div
                    className="w-1 shrink-0 rounded-full"
                    style={{ backgroundColor: goal.color }}
                  />

                  <div className="flex-1 overflow-hidden">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <div className="flex min-w-0 flex-1 items-center gap-2">
                        <span
                          className="inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
                          style={{
                            backgroundColor: (category?.color || '#9CA3AF') + '20',
                            color: category?.color || '#4B5563',
                            borderColor: (category?.color || '#9CA3AF') + '40',
                          }}
                        >
                          {goal.category}
                        </span>
                        <span className="truncate text-sm font-semibold text-zinc-900">{goal.title}</span>
                      </div>
                      {goal.deadline && (
                        <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                          {format(new Date(goal.deadline), 'MMM d')}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <div className="h-1.5 overflow-hidden rounded-full bg-zinc-100">
                          <div
                            className="h-full bg-[#f2cc0d] transition-all"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                      <span className="font-mono text-xs font-semibold tabular-nums text-zinc-700">{progress}%</span>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            )
          })
        )}
      </div>
    </div>
  )
}
