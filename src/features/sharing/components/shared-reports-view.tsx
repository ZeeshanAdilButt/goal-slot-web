'use client'

import { useMemo, useState } from 'react'

import { useSharedUserGoalsQuery, useSharedUserTimeEntriesQuery } from '@/features/sharing/hooks/use-sharing-queries'
import { calculateStatistics, getRollingWeekRange } from '@/features/sharing/utils/helpers'
import { SharedGoal, SharedTimeEntry, SharedWithMeUser } from '@/features/sharing/utils/types'
import { motion } from 'framer-motion'
import { BarChart3, Calendar, Clock, Target, TrendingUp, User, Users } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { cn, formatDuration } from '@/lib/utils'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface SharedReportsViewProps {
  sharedWithMe: SharedWithMeUser[]
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
  const entriesQuery = useSharedUserTimeEntriesQuery(selectedUserId, range.startDate, range.endDate)

  // Fetch goals for selected user
  const goalsQuery = useSharedUserGoalsQuery(selectedUserId)

  const entries = useMemo(() => (entriesQuery.data ?? []) as SharedTimeEntry[], [entriesQuery.data])
  const goals = (goalsQuery.data ?? []) as SharedGoal[]

  // Calculate statistics
  const stats = useMemo(() => calculateStatistics(entries), [entries])

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
              <button onClick={() => setWeekOffset((o) => o - 1)} className="btn-brutal-secondary px-3 py-2 text-xs">
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
                      <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${Math.floor(v / 60)}h`} />
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
                            <div className="h-3 w-3 border border-secondary" style={{ backgroundColor: goal.color }} />
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
