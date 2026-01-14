import Link from 'next/link'

import { Category } from '@/features/categories/utils/types'
import { Goal } from '@/features/goals/utils/types'
import { format } from 'date-fns'
import { motion } from 'framer-motion'
import { ArrowRight, Plus, Target } from 'lucide-react'

import { getProgressColor } from '@/lib/utils'

interface DashboardGoalsProps {
  goals: Goal[]
  categories: Category[]
}

export function DashboardGoals({ goals, categories }: DashboardGoalsProps) {
  return (
    <div className="lg:col-span-2">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold uppercase sm:text-xl">Active Goals</h2>
        <Link
          href="/dashboard/goals"
          className="flex items-center gap-2 text-xs font-bold uppercase transition-colors hover:text-primary sm:text-sm"
        >
          <span className="hidden sm:inline">View All</span>
          <span className="sm:hidden">All</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="space-y-2 sm:space-y-4">
        {goals.length === 0 ? (
          <div className="card-brutal py-4 text-center sm:py-12">
            <Target className="mx-auto mb-3 h-10 w-10 text-gray-400 sm:mb-4 sm:h-12 sm:w-12" />
            <p className="mb-2 text-sm font-bold uppercase sm:text-base">No Active Goals</p>
            <p className="mb-4 font-mono text-sm text-gray-600">Create your first goal to start tracking</p>
            <Link href="/dashboard/goals" className="btn-brutal inline-flex items-center gap-2">
              <Plus className="h-4 w-4" /> Create Goal
            </Link>
          </div>
        ) : (
          goals.slice(0, 4).map((goal, i) => {
            const progress =
              goal.targetHours > 0 ? Math.min(100, Math.round((goal.loggedHours / goal.targetHours) * 100)) : 0

            return (
              <motion.div
                key={goal.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="card-brutal flex items-center gap-2 sm:gap-4"
              >
                <div
                  className="h-full min-h-[60px] w-2 border-r-3 border-secondary sm:min-h-[80px] sm:w-3"
                  style={{ backgroundColor: goal.color }}
                />

                <div className="flex-1 overflow-hidden">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <span
                        className="badge-brutal mr-2 text-xs"
                        style={{
                          backgroundColor: categories.find((cat) => cat.value === goal.category)?.color || '#9CA3AF',
                        }}
                      >
                        {goal.category}
                      </span>
                      <span className="truncate text-sm font-bold uppercase sm:text-base">{goal.title}</span>
                    </div>
                    {goal.deadline && (
                      <span className="badge-brutal shrink-0 bg-secondary text-xs text-white">
                        {format(new Date(goal.deadline), 'MMM d')}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="progress-brutal">
                        <div
                          className={`progress-brutal-fill ${getProgressColor(progress)}`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                    <span className="font-mono text-sm font-bold">{progress}%</span>
                  </div>
                </div>
              </motion.div>
            )
          })
        )}
      </div>
    </div>
  )
}
