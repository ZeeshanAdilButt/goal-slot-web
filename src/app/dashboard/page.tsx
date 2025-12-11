'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

import { format } from 'date-fns'
import { motion } from 'framer-motion'
import { ArrowRight, Calendar, CheckSquare, Clock, Plus, Target, TrendingUp } from 'lucide-react'
import { toast } from 'react-hot-toast'

import { goalsApi, reportsApi, timeEntriesApi } from '@/lib/api'
import { formatDuration, getCategoryColor, getProgressColor } from '@/lib/utils'

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

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      const [statsRes, goalsRes, activityRes] = await Promise.all([
        reportsApi.getDashboard(),
        goalsApi.getAll('ACTIVE'),
        timeEntriesApi.getRecent(5),
      ])

      setStats(statsRes.data)
      setGoals(goalsRes.data)
      setRecentActivity(activityRes.data)
    } catch (error) {
      toast.error('Failed to load dashboard data')
    } finally {
      setIsLoading(false)
    }
  }

  const today = format(new Date(), 'EEEE, MMMM d, yyyy')

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 w-64 rounded bg-gray-200" />
        <div className="grid grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 rounded bg-gray-200" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-4xl font-bold uppercase">Dashboard</h1>
          <p className="font-mono uppercase text-gray-600">{today}</p>
        </div>

        <div className="flex gap-4">
          <Link href="/dashboard/time-tracker" className="btn-brutal-secondary flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Log Time
          </Link>
          <Link href="/dashboard/goals" className="btn-brutal flex items-center gap-2">
            <Plus className="h-5 w-5" />
            New Goal
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-6">
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
            className={`${stat.color} border-3 border-secondary p-6 shadow-brutal`}
          >
            <stat.icon className="mb-4 h-8 w-8" />
            <div className="font-mono text-3xl font-bold">{stat.value}</div>
            <div className="text-sm font-bold uppercase">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-3 gap-6">
        {/* Active Goals */}
        <div className="col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold uppercase">Active Goals</h2>
            <Link
              href="/dashboard/goals"
              className="flex items-center gap-2 text-sm font-bold uppercase transition-colors hover:text-primary"
            >
              View All <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="space-y-4">
            {goals.length === 0 ? (
              <div className="card-brutal py-12 text-center">
                <Target className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                <p className="mb-2 font-bold uppercase">No Active Goals</p>
                <p className="mb-4 font-mono text-gray-600">Create your first goal to start tracking</p>
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
                    className="card-brutal flex items-center gap-4"
                  >
                    <div
                      className="h-full min-h-[80px] w-3 border-r-3 border-secondary"
                      style={{ backgroundColor: goal.color }}
                    />

                    <div className="flex-1">
                      <div className="mb-2 flex items-center justify-between">
                        <div>
                          <span className={`badge-brutal ${getCategoryColor(goal.category)} mr-2 text-xs`}>
                            {goal.category}
                          </span>
                          <span className="font-bold uppercase">{goal.title}</span>
                        </div>
                        {goal.deadline && (
                          <span className="badge-brutal bg-secondary text-xs text-white">
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
            <h2 className="mb-4 text-xl font-bold uppercase">Recent Activity</h2>
            <div className="card-brutal">
              {recentActivity.length === 0 ? (
                <div className="py-8 text-center">
                  <Clock className="mx-auto mb-3 h-10 w-10 text-gray-400" />
                  <p className="font-mono text-sm text-gray-600">No activity yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentActivity.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center gap-3 border-2 border-secondary bg-brutalist-bg p-3"
                    >
                      <div
                        className="flex h-10 w-10 items-center justify-center border-2 border-secondary font-mono text-sm font-bold"
                        style={{ backgroundColor: entry.goal?.color || '#FFD700' }}
                      >
                        {formatDuration(entry.duration).replace(' ', '')}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold">{entry.taskName}</p>
                        <p className="font-mono text-xs text-gray-600">{entry.goal?.title || 'No Goal'}</p>
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
              <Calendar className="mb-2 h-8 w-8" />
              <span className="font-bold uppercase">View Schedule</span>
              <p className="font-mono text-sm">Plan your week</p>
            </div>
            <ArrowRight className="h-6 w-6 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </div>
  )
}
