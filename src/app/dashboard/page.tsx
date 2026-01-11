'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

import { useCategoriesQuery } from '@/features/categories'
import { format } from 'date-fns'
import { motion } from 'framer-motion'
import { ArrowRight, Calendar, CheckSquare, Clock, Plus, Tag, Target, TrendingUp } from 'lucide-react'
import { toast } from 'react-hot-toast'

import { goalsApi, reportsApi, timeEntriesApi } from '@/lib/api'
import { formatDuration, getProgressColor } from '@/lib/utils'
import { Loading } from '@/components/ui/loading'

interface DashboardStats {
  todayFormatted: string
  weeklyFormatted: string
  activeGoals: number
  tasksLogged: number
}

interface Goal {
  id: string
  title: string
  category: string
  targetHours: number
  loggedHours: number
  deadline: string
  status: string
  color: string
}

interface TimeEntry {
  id: string
  taskName: string
  duration: number
  date: string
  goal?: { id: string; title: string; color: string }
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [goals, setGoals] = useState<Goal[]>([])
  const [recentActivity, setRecentActivity] = useState<TimeEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { data: categories = [] } = useCategoriesQuery()

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      const [statsRes, goalsRes, activityRes] = await Promise.all([
        reportsApi.getDashboard(),
        goalsApi.getAll({ status: 'ACTIVE' }),
        timeEntriesApi.getRecent({ page: 1, pageSize: 5 }),
      ])

      setStats(statsRes.data)
      setGoals(goalsRes.data)
      const recentItems = Array.isArray(activityRes.data) ? activityRes.data : activityRes.data?.items || []
      setRecentActivity(recentItems)
    } catch (error) {
      toast.error('Failed to load dashboard data')
    } finally {
      setIsLoading(false)
    }
  }

  const today = format(new Date(), 'EEEE, MMMM d, yyyy')

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loading size="sm" />
      </div>
    )
  }

  return (
    <div className="space-y-4 p-4 sm:space-y-6 sm:p-6 md:space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold uppercase sm:text-3xl md:text-4xl">Dashboard</h1>
          <p className="font-mono text-sm uppercase text-gray-600 sm:text-base">{today}</p>
        </div>

        <div className="flex flex-wrap gap-2 sm:gap-4">
          <Link href="/dashboard/settings?tab=categories" className="btn-brutal-secondary flex items-center gap-2">
            <Tag className="h-5 w-5" />
            <span className="hidden sm:inline">Categories</span>
          </Link>
          <Link href="/dashboard/time-tracker" className="btn-brutal-secondary flex items-center gap-2">
            <Clock className="h-5 w-5" />
            <span className="hidden sm:inline">Log Time</span>
          </Link>
          <Link href="/dashboard/goals" className="btn-brutal flex items-center gap-2">
            <Plus className="h-5 w-5" />
            <span className="hidden sm:inline">New Goal</span>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
        {[
          {
            label: "Today's Focus",
            value: stats?.todayFormatted || '0m',
            icon: Clock,
            color: 'bg-accent-pink',
          },
          {
            label: 'Weekly Total',
            value: stats?.weeklyFormatted || '0m',
            icon: TrendingUp,
            color: 'bg-accent-blue',
          },
          {
            label: 'Active Goals',
            value: stats?.activeGoals || 0,
            icon: Target,
            color: 'bg-accent-green',
          },
          {
            label: 'Tasks Logged',
            value: stats?.tasksLogged || 0,
            icon: CheckSquare,
            color: 'bg-primary',
          },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`${stat.color} border-3 border-secondary p-4 shadow-brutal sm:p-6`}
          >
            <stat.icon className="mb-2 h-6 w-6 sm:mb-4 sm:h-8 sm:w-8" />
            <div className="font-mono text-2xl font-bold sm:text-3xl">{stat.value}</div>
            <div className="text-xs font-bold uppercase sm:text-sm">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-3">
        {/* Active Goals */}
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
                              backgroundColor:
                                categories.find((cat) => cat.value === goal.category)?.color || '#9CA3AF',
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

        {/* Right Column */}
        <div className="space-y-6">
          {/* Recent Activity */}
          <div>
            <h2 className="mb-4 text-lg font-bold uppercase sm:text-xl">Recent Activity</h2>
            <div className="card-brutal">
              {recentActivity.length === 0 ? (
                <div className="py-4 text-center sm:py-8">
                  <Clock className="mx-auto mb-2 h-8 w-8 text-gray-400 sm:mb-3 sm:h-10 sm:w-10" />
                  <p className="font-mono text-xs text-gray-600 sm:text-sm">No activity yet</p>
                </div>
              ) : (
                <div className="space-y-1 sm:space-y-3">
                  {recentActivity.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center gap-2 border-2 border-secondary bg-brutalist-bg p-1.5 sm:gap-3 sm:p-3"
                    >
                      <div
                        className="flex h-10 w-10 shrink-0 items-center justify-center border-2 border-secondary font-mono text-xs font-bold sm:h-12 sm:w-12 sm:text-sm"
                        style={{ backgroundColor: entry.goal?.color || '#FFD700' }}
                      >
                        {formatDuration(entry.duration).replace(' ', '')}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-bold sm:text-sm">{entry.taskName}</p>
                        <p className="truncate font-mono text-xs text-gray-600">{entry.goal?.title || 'No Goal'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* View Schedule CTA */}
          <Link
            href="/dashboard/schedule"
            className="card-brutal-colored group flex cursor-pointer items-center justify-between bg-primary transition-shadow hover:shadow-brutal-lg"
          >
            <div>
              <Calendar className="mb-2 h-6 w-6 sm:h-8 sm:w-8" />
              <span className="text-sm font-bold uppercase sm:text-base">View Schedule</span>
              <p className="font-mono text-xs sm:text-sm">Plan your week</p>
            </div>
            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1 sm:h-6 sm:w-6" />
          </Link>
        </div>
      </div>
    </div>
  )
}
