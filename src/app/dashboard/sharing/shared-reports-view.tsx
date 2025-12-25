'use client'

import { useMemo, useState } from 'react'

import { motion } from 'framer-motion'
import { BarChart3, Calendar, Clock, Target, TrendingUp, User, Users } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { sharingApi } from '@/lib/api'
import { cn, formatDate, formatDuration } from '@/lib/utils'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface SharedWithMeUser {
  id: string
  ownerId: string
  owner: {
    id: string
    name: string
    email: string
    avatar?: string
  }
  createdAt: string
}

interface SharedReportsViewProps {
  sharedWithMe: SharedWithMeUser[]
}

interface SharedGoal {
  id: string
  title: string
  color: string
  category: string
  targetHours: number
  loggedHours: number
  status: string
}

interface SharedTimeEntry {
  id: string
  taskName: string
  duration: number
  date: string
  goal?: {
    id: string
    title: string
    color: string
    category?: string
  }
}

// Rolling range for date selection
function getRollingWeekRange(offset: number = 0) {
  const now = new Date()
  const dayOfWeek = now.getDay()
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1) + offset * 7)
  startOfWeek.setHours(0, 0, 0, 0)

  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setDate(startOfWeek.getDate() + 6)
  endOfWeek.setHours(23, 59, 59, 999)

  return {
    startDate: startOfWeek.toISOString().split('T')[0],
    endDate: endOfWeek.toISOString().split('T')[0],
    label: `${formatDate(startOfWeek, 'MMM d')} - ${formatDate(endOfWeek, 'MMM d, yyyy')}`,
  }
}

const COLORS = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8']

export function SharedReportsView({ sharedWithMe }: SharedReportsViewProps) {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(
    sharedWithMe.length > 0 ? sharedWithMe[0].owner.id : null,
  )
  const [weekOffset, setWeekOffset] = useState(0)

  const selectedUser = sharedWithMe.find((s) => s.owner.id === selectedUserId)?.owner
  const range = useMemo(() => getRollingWeekRange(weekOffset), [weekOffset])

  // Fetch time entries for selected user
  const entriesQuery = useQuery({
    queryKey: ['shared-time-entries', selectedUserId, range.startDate, range.endDate],
    queryFn: async () => {
      if (!selectedUserId) return []
      const res = await sharingApi.getSharedUserTimeEntries(selectedUserId, range.startDate, range.endDate)
      return res.data as SharedTimeEntry[]
    },
    enabled: !!selectedUserId,
  })

  // Fetch goals for selected user
  const goalsQuery = useQuery({
    queryKey: ['shared-goals', selectedUserId],
    queryFn: async () => {
      if (!selectedUserId) return []
      const res = await sharingApi.getSharedUserGoals(selectedUserId)
      return res.data as SharedGoal[]
    },
    enabled: !!selectedUserId,
  })

  const entries = useMemo(() => entriesQuery.data ?? [], [entriesQuery.data])
  const goals = goalsQuery.data ?? []

  // Calculate statistics
  const stats = useMemo(() => {
    const totalMinutes = entries.reduce((sum, e) => sum + e.duration, 0)
    const daysWithEntries = new Set(entries.map((e) => e.date)).size
    const avgPerDay = daysWithEntries > 0 ? Math.round(totalMinutes / daysWithEntries) : 0

    // Daily breakdown
    const dailyMinutes: Record<string, number> = {}
    entries.forEach((e) => {
      dailyMinutes[e.date] = (dailyMinutes[e.date] || 0) + e.duration
    })

    // Goal breakdown
    const goalMinutes: Record<string, { title: string; color: string; minutes: number }> = {}
    entries.forEach((e) => {
      const goalId = e.goal?.id || 'other'
      if (!goalMinutes[goalId]) {
        goalMinutes[goalId] = {
          title: e.goal?.title || 'Other',
          color: e.goal?.color || '#94A3B8',
          minutes: 0,
        }
      }
      goalMinutes[goalId].minutes += e.duration
    })

    return {
      totalMinutes,
      totalFormatted: formatDuration(totalMinutes),
      daysActive: daysWithEntries,
      avgPerDay,
      avgFormatted: formatDuration(avgPerDay),
      entriesCount: entries.length,
      dailyData: Object.entries(dailyMinutes)
        .map(([date, minutes]) => ({
          date,
          minutes,
          label: formatDate(date, 'EEE'),
        }))
        .sort((a, b) => a.date.localeCompare(b.date)),
      goalData: Object.values(goalMinutes).sort((a, b) => b.minutes - a.minutes),
    }
  }, [entries])

  if (sharedWithMe.length === 0) {
    return (
      <div className="card-brutal py-16 text-center">
        <Users className="mx-auto mb-4 h-16 w-16 opacity-30" />
        <h3 className="mb-2 text-xl font-bold uppercase">No shared reports</h3>
        <p className="font-mono text-gray-600">
          When someone shares their data with you, you&apos;ll be able to view their reports here.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* User Selector */}
      <div className="card-brutal">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-bold uppercase">
              <User className="h-5 w-5" />
              Viewing Reports For
            </h2>
            <p className="font-mono text-sm text-gray-600">Select a person to view their focus reports</p>
          </div>

          <Select value={selectedUserId || ''} onValueChange={(v) => setSelectedUserId(v)}>
            <SelectTrigger className="w-[280px] border-3 border-secondary">
              <SelectValue placeholder="Select a person" />
            </SelectTrigger>
            <SelectContent>
              {sharedWithMe.map((share) => (
                <SelectItem key={share.owner.id} value={share.owner.id}>
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold">
                      {share.owner.name?.[0]?.toUpperCase() || '?'}
                    </div>
                    <span>{share.owner.name}</span>
                    <span className="text-gray-500">({share.owner.email})</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {selectedUser && (
        <>
          {/* Date Range Selector */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              <span className="font-mono text-sm">{range.label}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setWeekOffset((o) => o - 1)}
                className="btn-brutal-secondary px-3 py-2 text-xs"
              >
                Prev Week
              </button>
              <button
                onClick={() => setWeekOffset((o) => Math.min(o + 1, 0))}
                disabled={weekOffset >= 0}
                className={cn('btn-brutal-secondary px-3 py-2 text-xs', weekOffset >= 0 && 'opacity-50')}
              >
                Next Week
              </button>
              {weekOffset !== 0 && (
                <button onClick={() => setWeekOffset(0)} className="btn-brutal px-3 py-2 text-xs">
                  Today
                </button>
              )}
            </div>
          </div>

          {/* Loading State */}
          {(entriesQuery.isLoading || goalsQuery.isLoading) && (
            <div className="flex h-64 items-center justify-center">
              <div className="h-12 w-12 animate-spin border-4 border-secondary border-t-primary" />
            </div>
          )}

          {/* Stats Overview */}
          {!entriesQuery.isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-2 gap-4 md:grid-cols-4"
            >
              <div className="card-brutal p-4">
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock className="h-4 w-4" />
                  <span className="font-mono text-xs uppercase">Total Time</span>
                </div>
                <div className="mt-2 text-2xl font-bold">{stats.totalFormatted}</div>
              </div>

              <div className="card-brutal p-4">
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="h-4 w-4" />
                  <span className="font-mono text-xs uppercase">Days Active</span>
                </div>
                <div className="mt-2 text-2xl font-bold">{stats.daysActive}</div>
              </div>

              <div className="card-brutal p-4">
                <div className="flex items-center gap-2 text-gray-600">
                  <TrendingUp className="h-4 w-4" />
                  <span className="font-mono text-xs uppercase">Avg/Day</span>
                </div>
                <div className="mt-2 text-2xl font-bold">{stats.avgFormatted}</div>
              </div>

              <div className="card-brutal p-4">
                <div className="flex items-center gap-2 text-gray-600">
                  <BarChart3 className="h-4 w-4" />
                  <span className="font-mono text-xs uppercase">Entries</span>
                </div>
                <div className="mt-2 text-2xl font-bold">{stats.entriesCount}</div>
              </div>
            </motion.div>
          )}

          {/* Charts */}
          {!entriesQuery.isLoading && entries.length > 0 && (
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              {/* Daily Breakdown Chart */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="card-brutal"
              >
                <h3 className="mb-4 flex items-center gap-2 font-bold uppercase">
                  <BarChart3 className="h-5 w-5" />
                  Daily Focus Time
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.dailyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                      <YAxis
                        tick={{ fontSize: 12 }}
                        tickFormatter={(v) => `${Math.floor(v / 60)}h`}
                      />
                      <Tooltip
                        formatter={(value: number) => [formatDuration(value), 'Focus Time']}
                        labelFormatter={(label) => label}
                      />
                      <Bar dataKey="minutes" fill="#FFD700" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>

              {/* Goal Breakdown Pie Chart */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="card-brutal"
              >
                <h3 className="mb-4 flex items-center gap-2 font-bold uppercase">
                  <Target className="h-5 w-5" />
                  Focus by Goal
                </h3>
                <div className="flex h-64 items-center gap-4">
                  <div className="h-full flex-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={stats.goalData}
                          dataKey="minutes"
                          nameKey="title"
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={80}
                          paddingAngle={2}
                        >
                          {stats.goalData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => formatDuration(value)} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-2">
                    {stats.goalData.slice(0, 5).map((goal, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div
                          className="h-3 w-3 border border-secondary"
                          style={{ backgroundColor: goal.color || COLORS[index % COLORS.length] }}
                        />
                        <span className="font-mono text-xs">{goal.title}</span>
                        <span className="font-mono text-xs text-gray-500">({formatDuration(goal.minutes)})</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>
          )}

          {/* Goals Progress */}
          {!goalsQuery.isLoading && goals.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="card-brutal"
            >
              <h3 className="mb-4 flex items-center gap-2 font-bold uppercase">
                <Target className="h-5 w-5" />
                Goals Progress
              </h3>
              <div className="space-y-4">
                {goals
                  .filter((g) => g.status === 'ACTIVE')
                  .map((goal) => {
                    const progress = goal.targetHours > 0 ? (goal.loggedHours / goal.targetHours) * 100 : 0
                    return (
                      <div key={goal.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div
                              className="h-3 w-3 border border-secondary"
                              style={{ backgroundColor: goal.color }}
                            />
                            <span className="font-bold">{goal.title}</span>
                          </div>
                          <span className="font-mono text-sm text-gray-600">
                            {goal.loggedHours.toFixed(1)}h / {goal.targetHours}h
                          </span>
                        </div>
                        <div className="h-4 w-full border-2 border-secondary bg-gray-100">
                          <div
                            className="h-full transition-all duration-500"
                            style={{
                              width: `${Math.min(100, progress)}%`,
                              backgroundColor: goal.color,
                            }}
                          />
                        </div>
                        <div className="text-right font-mono text-xs text-gray-500">
                          {Math.round(progress)}% complete
                        </div>
                      </div>
                    )
                  })}
              </div>
            </motion.div>
          )}

          {/* No entries message */}
          {!entriesQuery.isLoading && entries.length === 0 && (
            <div className="card-brutal py-12 text-center">
              <Clock className="mx-auto mb-4 h-12 w-12 opacity-30" />
              <h3 className="mb-2 font-bold uppercase">No focus time logged</h3>
              <p className="font-mono text-sm text-gray-600">
                {selectedUser.name} hasn&apos;t logged any focus time for this period.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
