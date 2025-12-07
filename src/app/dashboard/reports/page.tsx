'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  Calendar,
  Clock,
  Target,
  Download,
  ChevronLeft,
  ChevronRight,
  Activity
} from 'lucide-react'
import { reportsApi } from '@/lib/api'
import { toast } from 'react-hot-toast'
import { cn, formatDuration, TASK_CATEGORIES, getCategoryColor } from '@/lib/utils'

interface DailySummary {
  date: string
  totalMinutes: number
  entriesCount: number
  categories: Record<string, number>
}

interface WeeklySummary {
  totalMinutes: number
  avgMinutesPerDay: number
  totalEntries: number
  mostProductiveDay: string
  byCategory: Record<string, number>
  byGoal: Array<{ goalId: string; goalTitle: string; minutes: number }>
  dailyBreakdown: DailySummary[]
}

interface GoalProgress {
  id: string
  title: string
  targetHours: number
  loggedHours: number
  progressPercent: number
}

export default function ReportsPage() {
  const [weeklyReport, setWeeklyReport] = useState<WeeklySummary | null>(null)
  const [goalProgress, setGoalProgress] = useState<GoalProgress[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedWeek, setSelectedWeek] = useState(0) // 0 = current week, -1 = last week, etc.

  useEffect(() => {
    loadReports()
  }, [selectedWeek])

  const loadReports = async () => {
    setIsLoading(true)
    try {
      const [weeklyRes, goalsRes] = await Promise.all([
        reportsApi.getWeeklySummary(selectedWeek),
        reportsApi.getGoalProgress(),
      ])
      setWeeklyReport(weeklyRes.data)
      setGoalProgress(goalsRes.data)
    } catch (error) {
      toast.error('Failed to load reports')
    } finally {
      setIsLoading(false)
    }
  }

  const getWeekDateRange = (offset: number) => {
    const now = new Date()
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - now.getDay() + 1 + offset * 7)
    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 6)
    
    return `${startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
  }

  const maxDailyMinutes = weeklyReport?.dailyBreakdown
    ? Math.max(...weeklyReport.dailyBreakdown.map(d => d.totalMinutes), 1)
    : 1

  const categoryTotals = weeklyReport?.byCategory || {}
  const totalCategoryMinutes = Object.values(categoryTotals).reduce((a, b) => a + b, 0) || 1

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-display font-bold uppercase">Reports</h1>
          <p className="font-mono text-gray-600 uppercase">Analyze your productivity</p>
        </div>

        <button className="btn-brutal flex items-center gap-2">
          <Download className="w-5 h-5" />
          Export
        </button>
      </div>

      {/* Week Selector */}
      <div className="card-brutal">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setSelectedWeek(w => w - 1)}
            className="w-10 h-10 border-3 border-secondary flex items-center justify-center hover:bg-gray-100"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <div className="text-center">
            <div className="text-2xl font-bold uppercase">
              {selectedWeek === 0 ? 'This Week' : selectedWeek === -1 ? 'Last Week' : `${Math.abs(selectedWeek)} Weeks Ago`}
            </div>
            <div className="font-mono text-gray-600">{getWeekDateRange(selectedWeek)}</div>
          </div>

          <button
            onClick={() => setSelectedWeek(w => Math.min(w + 1, 0))}
            disabled={selectedWeek >= 0}
            className="w-10 h-10 border-3 border-secondary flex items-center justify-center hover:bg-gray-100 disabled:opacity-50"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="h-96 flex items-center justify-center">
          <div className="animate-spin w-12 h-12 border-4 border-secondary border-t-primary" />
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card-brutal-colored bg-primary"
            >
              <Clock className="w-8 h-8 mb-2" />
              <div className="text-3xl font-bold font-mono">
                {formatDuration(weeklyReport?.totalMinutes || 0)}
              </div>
              <div className="font-mono text-sm uppercase">Total Time</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="card-brutal"
            >
              <Activity className="w-8 h-8 mb-2" />
              <div className="text-3xl font-bold font-mono">
                {formatDuration(weeklyReport?.avgMinutesPerDay || 0)}
              </div>
              <div className="font-mono text-sm uppercase text-gray-600">Daily Average</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="card-brutal"
            >
              <Target className="w-8 h-8 mb-2" />
              <div className="text-3xl font-bold font-mono">
                {weeklyReport?.totalEntries || 0}
              </div>
              <div className="font-mono text-sm uppercase text-gray-600">Tasks Completed</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="card-brutal-colored bg-accent-green text-white"
            >
              <TrendingUp className="w-8 h-8 mb-2" />
              <div className="text-2xl font-bold uppercase">
                {weeklyReport?.mostProductiveDay || '-'}
              </div>
              <div className="font-mono text-sm uppercase">Best Day</div>
            </motion.div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daily Activity Bar Chart */}
            <div className="card-brutal">
              <h2 className="text-xl font-bold uppercase mb-6 flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Daily Activity
              </h2>

              <div className="flex items-end justify-between h-48 gap-2">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => {
                  const dayData = weeklyReport?.dailyBreakdown?.[i]
                  const minutes = dayData?.totalMinutes || 0
                  const heightPercent = (minutes / maxDailyMinutes) * 100
                  
                  return (
                    <div key={day} className="flex-1 flex flex-col items-center">
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${Math.max(heightPercent, 5)}%` }}
                        transition={{ duration: 0.5, delay: i * 0.05 }}
                        className="w-full bg-primary border-3 border-secondary relative group"
                        style={{ minHeight: '8px' }}
                      >
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-secondary text-white text-xs px-2 py-1 font-mono opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          {formatDuration(minutes)}
                        </div>
                      </motion.div>
                      <div className="mt-2 font-mono text-sm font-bold">{day}</div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Category Distribution Pie Chart */}
            <div className="card-brutal">
              <h2 className="text-xl font-bold uppercase mb-6 flex items-center gap-2">
                <PieChart className="w-5 h-5" />
                Time by Category
              </h2>

              <div className="flex items-center gap-8">
                {/* Pseudo Pie Chart using stacked bars */}
                <div className="w-32 h-32 relative">
                  <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                    {(() => {
                      let accumulatedPercent = 0
                      return Object.entries(categoryTotals).map(([category, minutes], i) => {
                        const percent = (minutes / totalCategoryMinutes) * 100
                        const dashArray = `${percent} ${100 - percent}`
                        const dashOffset = -accumulatedPercent
                        accumulatedPercent += percent

                        const colors: Record<string, string> = {
                          DEEP_WORK: '#FACC15',
                          LEARNING: '#22C55E',
                          MEETING: '#F97316',
                          CREATIVE: '#EC4899',
                          ADMIN: '#9CA3AF',
                          BREAK: '#8B5CF6',
                          OTHER: '#D1D5DB',
                        }

                        return (
                          <circle
                            key={category}
                            cx="50"
                            cy="50"
                            r="40"
                            fill="none"
                            stroke={colors[category] || '#D1D5DB'}
                            strokeWidth="20"
                            strokeDasharray={dashArray}
                            strokeDashoffset={dashOffset}
                            className="transition-all duration-500"
                          />
                        )
                      })
                    })()}
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-lg font-bold font-mono">
                        {formatDuration(totalCategoryMinutes)}
                      </div>
                      <div className="text-xs font-mono text-gray-500">Total</div>
                    </div>
                  </div>
                </div>

                {/* Legend */}
                <div className="flex-1 space-y-2">
                  {Object.entries(categoryTotals)
                    .sort(([, a], [, b]) => b - a)
                    .map(([category, minutes]) => {
                      const cat = TASK_CATEGORIES.find(c => c.value === category)
                      return (
                        <div key={category} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={cn('w-3 h-3 border border-secondary', getCategoryColor(category))} />
                            <span className="font-mono text-sm uppercase">{cat?.label || category}</span>
                          </div>
                          <span className="font-mono text-sm font-bold">{formatDuration(minutes)}</span>
                        </div>
                      )
                    })}
                </div>
              </div>
            </div>
          </div>

          {/* Goal Progress */}
          <div className="card-brutal">
            <h2 className="text-xl font-bold uppercase mb-6 flex items-center gap-2">
              <Target className="w-5 h-5" />
              Goal Progress
            </h2>

            {goalProgress.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="font-mono uppercase">No active goals</p>
                <p className="text-sm">Create goals to track progress</p>
              </div>
            ) : (
              <div className="space-y-4">
                {goalProgress.map((goal, i) => (
                  <motion.div
                    key={goal.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="p-4 border-2 border-secondary"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-bold uppercase">{goal.title}</div>
                      <div className="font-mono text-sm">
                        <span className="font-bold">{goal.loggedHours.toFixed(1)}</span>
                        <span className="text-gray-500"> / {goal.targetHours}h</span>
                      </div>
                    </div>
                    <div className="h-4 bg-gray-200 border-2 border-secondary overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(goal.progressPercent, 100)}%` }}
                        transition={{ duration: 0.5, delay: i * 0.1 }}
                        className={cn(
                          'h-full',
                          goal.progressPercent >= 100 ? 'bg-accent-green' : 'bg-primary'
                        )}
                      />
                    </div>
                    <div className="mt-1 font-mono text-xs text-right text-gray-600">
                      {goal.progressPercent.toFixed(0)}% complete
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Time by Goal */}
          {weeklyReport?.byGoal && weeklyReport.byGoal.length > 0 && (
            <div className="card-brutal">
              <h2 className="text-xl font-bold uppercase mb-6">Time by Goal</h2>

              <div className="space-y-3">
                {weeklyReport.byGoal.map((item, i) => {
                  const percent = (item.minutes / (weeklyReport?.totalMinutes || 1)) * 100
                  return (
                    <motion.div
                      key={item.goalId}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-center gap-4"
                    >
                      <div className="flex-1">
                        <div className="flex justify-between mb-1">
                          <span className="font-bold uppercase">{item.goalTitle}</span>
                          <span className="font-mono">{formatDuration(item.minutes)}</span>
                        </div>
                        <div className="h-3 bg-gray-200 border border-secondary overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${percent}%` }}
                            transition={{ duration: 0.5, delay: i * 0.05 }}
                            className="h-full bg-primary"
                          />
                        </div>
                      </div>
                      <div className="w-12 text-right font-mono text-sm text-gray-600">
                        {percent.toFixed(0)}%
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Insights */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card-brutal-colored bg-accent-purple text-white">
              <h3 className="text-lg font-bold uppercase mb-4">💡 Insight</h3>
              <p className="font-mono">
                {weeklyReport?.avgMinutesPerDay && weeklyReport.avgMinutesPerDay >= 120
                  ? "Great consistency! You're averaging over 2 hours of focused work daily."
                  : "Tip: Try to aim for at least 2 hours of focused work each day for optimal productivity."}
              </p>
            </div>

            <div className="card-brutal-colored bg-accent-orange text-white">
              <h3 className="text-lg font-bold uppercase mb-4">🎯 Next Steps</h3>
              <p className="font-mono">
                {goalProgress.some(g => g.progressPercent >= 80)
                  ? "You're close to completing a goal! Keep pushing to finish strong."
                  : "Set specific time blocks for your most important goals to make steady progress."}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
