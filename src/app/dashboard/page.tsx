'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { 
  Clock, TrendingUp, Target, CheckSquare, 
  ArrowRight, Plus, Calendar
} from 'lucide-react'
import { format } from 'date-fns'
import { reportsApi, goalsApi, timeEntriesApi } from '@/lib/api'
import { formatDuration, getCategoryColor, getProgressColor } from '@/lib/utils'
import { toast } from 'react-hot-toast'

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
        <div className="h-8 bg-gray-200 w-64 rounded" />
        <div className="grid grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-gray-200 rounded" />
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
          <h1 className="text-4xl font-display font-bold uppercase">Dashboard</h1>
          <p className="font-mono text-gray-600 uppercase">{today}</p>
        </div>

        <div className="flex gap-4">
          <Link href="/dashboard/time-tracker" className="btn-brutal-secondary flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Log Time
          </Link>
          <Link href="/dashboard/goals" className="btn-brutal flex items-center gap-2">
            <Plus className="w-5 h-5" />
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
            color: 'bg-accent-pink' 
          },
          { 
            label: 'Weekly Total', 
            value: stats?.weeklyFormatted || '0m', 
            icon: TrendingUp, 
            color: 'bg-accent-blue' 
          },
          { 
            label: 'Active Goals', 
            value: stats?.activeGoals || 0, 
            icon: Target, 
            color: 'bg-accent-green' 
          },
          { 
            label: 'Tasks Logged', 
            value: stats?.tasksLogged || 0, 
            icon: CheckSquare, 
            color: 'bg-primary' 
          },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`${stat.color} border-3 border-secondary shadow-brutal p-6`}
          >
            <stat.icon className="w-8 h-8 mb-4" />
            <div className="text-3xl font-bold font-mono">{stat.value}</div>
            <div className="text-sm font-bold uppercase">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-3 gap-6">
        {/* Active Goals */}
        <div className="col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold uppercase">Active Goals</h2>
            <Link href="/dashboard/goals" className="flex items-center gap-2 font-bold text-sm uppercase hover:text-primary transition-colors">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="space-y-4">
            {goals.length === 0 ? (
              <div className="card-brutal text-center py-12">
                <Target className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="font-bold uppercase mb-2">No Active Goals</p>
                <p className="font-mono text-gray-600 mb-4">Create your first goal to start tracking</p>
                <Link href="/dashboard/goals" className="btn-brutal inline-flex items-center gap-2">
                  <Plus className="w-4 h-4" /> Create Goal
                </Link>
              </div>
            ) : (
              goals.slice(0, 4).map((goal, i) => {
                const progress = goal.targetHours > 0 
                  ? Math.min(100, Math.round((goal.loggedHours / goal.targetHours) * 100))
                  : 0

                return (
                  <motion.div
                    key={goal.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="card-brutal flex items-center gap-4"
                  >
                    <div 
                      className="w-3 h-full min-h-[80px] border-r-3 border-secondary"
                      style={{ backgroundColor: goal.color }}
                    />
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <span className={`badge-brutal ${getCategoryColor(goal.category)} text-xs mr-2`}>
                            {goal.category}
                          </span>
                          <span className="font-bold uppercase">{goal.title}</span>
                        </div>
                        {goal.deadline && (
                          <span className="badge-brutal bg-secondary text-white text-xs">
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
            <h2 className="text-xl font-bold uppercase mb-4">Recent Activity</h2>
            <div className="card-brutal">
              {recentActivity.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="w-10 h-10 mx-auto mb-3 text-gray-400" />
                  <p className="font-mono text-sm text-gray-600">No activity yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentActivity.map((entry) => (
                    <div key={entry.id} className="flex items-center gap-3 p-3 bg-brutalist-bg border-2 border-secondary">
                      <div 
                        className="w-10 h-10 flex items-center justify-center font-bold font-mono text-sm border-2 border-secondary"
                        style={{ backgroundColor: entry.goal?.color || '#FFD700' }}
                      >
                        {formatDuration(entry.duration).replace(' ', '')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm truncate">{entry.taskName}</p>
                        <p className="font-mono text-xs text-gray-600">
                          {entry.goal?.title || 'No Goal'}
                        </p>
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
            className="card-brutal-colored bg-primary flex items-center justify-between group cursor-pointer hover:shadow-brutal-lg transition-shadow"
          >
            <div>
              <Calendar className="w-8 h-8 mb-2" />
              <span className="font-bold uppercase">View Schedule</span>
              <p className="font-mono text-sm">Plan your week</p>
            </div>
            <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  )
}
