'use client'

import { useMemo, useState } from 'react'
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths } from 'date-fns'

import { useSharedUserGoalsQuery, useSharedUserTimeEntriesQuery } from '@/features/sharing/hooks/use-sharing-queries'
import { calculateStatistics } from '@/features/sharing/utils/helpers'
import { SharedGoal, SharedTimeEntry, SharedWithMeUser } from '@/features/sharing/utils/types'
import { motion } from 'framer-motion'
import { BarChart3, Calendar, ChevronDown, Clock, Download, FileSpreadsheet, Target, TrendingUp, User, Users } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { cn, formatDuration } from '@/lib/utils'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

interface SharedReportsViewProps {
  sharedWithMe: SharedWithMeUser[]
}

type DatePreset = 'this-week' | 'last-week' | 'this-month' | 'last-month' | 'last-30-days'

const DATE_PRESETS: Array<{ value: DatePreset; label: string }> = [
  { value: 'this-week', label: 'This Week' },
  { value: 'last-week', label: 'Last Week' },
  { value: 'this-month', label: 'This Month' },
  { value: 'last-month', label: 'Last Month' },
  { value: 'last-30-days', label: 'Last 30 Days' },
]

const COLORS = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8']

function getDateRange(preset: DatePreset): { startDate: string; endDate: string; label: string } {
  const today = new Date()
  const formatDate = (d: Date) => format(d, 'yyyy-MM-dd')
  const formatLabel = (start: Date, end: Date) => `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`

  switch (preset) {
    case 'this-week': {
      const start = startOfWeek(today, { weekStartsOn: 1 })
      const end = endOfWeek(today, { weekStartsOn: 1 })
      return { startDate: formatDate(start), endDate: formatDate(end), label: formatLabel(start, end) }
    }
    case 'last-week': {
      const lastWeekStart = subDays(startOfWeek(today, { weekStartsOn: 1 }), 7)
      const lastWeekEnd = subDays(startOfWeek(today, { weekStartsOn: 1 }), 1)
      return { startDate: formatDate(lastWeekStart), endDate: formatDate(lastWeekEnd), label: formatLabel(lastWeekStart, lastWeekEnd) }
    }
    case 'this-month': {
      const start = startOfMonth(today)
      const end = endOfMonth(today)
      return { startDate: formatDate(start), endDate: formatDate(end), label: formatLabel(start, end) }
    }
    case 'last-month': {
      const lastMonth = subMonths(today, 1)
      const start = startOfMonth(lastMonth)
      const end = endOfMonth(lastMonth)
      return { startDate: formatDate(start), endDate: formatDate(end), label: formatLabel(start, end) }
    }
    case 'last-30-days': {
      const start = subDays(today, 30)
      return { startDate: formatDate(start), endDate: formatDate(today), label: formatLabel(start, today) }
    }
    default: {
      const start = startOfWeek(today, { weekStartsOn: 1 })
      const end = endOfWeek(today, { weekStartsOn: 1 })
      return { startDate: formatDate(start), endDate: formatDate(end), label: formatLabel(start, end) }
    }
  }
}

export function SharedReportsView({ sharedWithMe }: SharedReportsViewProps) {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(
    sharedWithMe.length > 0 ? sharedWithMe[0].owner.id : null,
  )
  const [datePreset, setDatePreset] = useState<DatePreset>('this-week')

  const selectedUser = sharedWithMe.find((s) => s.owner.id === selectedUserId)?.owner
  const range = useMemo(() => getDateRange(datePreset), [datePreset])

  // Fetch time entries for selected user
  const entriesQuery = useSharedUserTimeEntriesQuery(selectedUserId, range.startDate, range.endDate)

  // Fetch goals for selected user
  const goalsQuery = useSharedUserGoalsQuery(selectedUserId)

  const entries = useMemo(() => (entriesQuery.data ?? []) as SharedTimeEntry[], [entriesQuery.data])
  const goals = (goalsQuery.data ?? []) as SharedGoal[]

  // Calculate statistics
  const stats = useMemo(() => calculateStatistics(entries), [entries])

  // Export to CSV
  const handleExportCSV = () => {
    if (!selectedUser || entries.length === 0) return
    
    const headers = ['Date', 'Duration', 'Goal', 'Task']
    const rows = entries.map(entry => [
      entry.date,
      formatDuration(entry.duration),
      entry.goal?.title || '',
      entry.taskName || '',
    ])
    
    const csvContent = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${selectedUser.name}-time-report-${range.startDate}-to-${range.endDate}.csv`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

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
    <div className="space-y-4 sm:space-y-6">
      {/* User Selector Card */}
      <div className="card-brutal">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-4">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-bold uppercase sm:text-xl">
              <User className="h-4 w-4 sm:h-5 sm:w-5" />
              Viewing Reports For
            </h2>
            <p className="font-mono text-xs text-gray-600 sm:text-sm">Select a person to view their focus reports</p>
          </div>

          <Select value={selectedUserId || ''} onValueChange={(v) => setSelectedUserId(v)}>
            <SelectTrigger className="w-full border-3 border-secondary bg-white sm:w-[300px]">
              <SelectValue placeholder="Select a person" />
            </SelectTrigger>
            <SelectContent>
              {sharedWithMe.map((share) => (
                <SelectItem key={share.owner.id} value={share.owner.id}>
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center border-2 border-secondary bg-primary text-xs font-bold">
                      {share.owner.name?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div className="flex flex-col items-start">
                      <span className="font-bold">{share.owner.name}</span>
                      <span className="font-mono text-xs text-gray-500">{share.owner.email}</span>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {selectedUser && (
        <>
          {/* Mentee Profile Card */}
          {(() => {
            const share = sharedWithMe.find((s) => s.owner.id === selectedUserId)
            if (!share) return null
            return (
              <div className="card-brutal bg-gradient-to-r from-primary/10 to-transparent">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  {/* Avatar */}
                  <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center border-3 border-secondary bg-primary text-2xl font-black text-white shadow-brutal">
                    {share.owner.avatar ? (
                      <img src={share.owner.avatar} alt={share.owner.name} className="h-full w-full object-cover" />
                    ) : (
                      share.owner.name?.[0]?.toUpperCase() || '?'
                    )}
                  </div>
                  
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-bold">{share.owner.name}</h3>
                    <p className="font-mono text-sm text-gray-600">{share.owner.email}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
                      <span className={cn(
                        "inline-flex items-center gap-1 rounded-full border-2 px-2 py-0.5 font-bold uppercase",
                        share.accessLevel === 'EDIT' 
                          ? "border-green-600 bg-green-100 text-green-700"
                          : "border-blue-600 bg-blue-100 text-blue-700"
                      )}>
                        {share.accessLevel === 'EDIT' ? '✏️ Edit Access' : '👁️ View Only'}
                      </span>
                      <span className="font-mono text-gray-500">
                        Shared {format(new Date(share.createdAt), 'MMM d, yyyy')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })()}

          {/* Controls Bar */}
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            {/* Date Range */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2 font-mono text-sm">
                <Calendar className="h-4 w-4" />
                <span>{range.label}</span>
              </div>
              
              <Popover>
                <PopoverTrigger asChild>
                  <button className="btn-brutal-secondary flex items-center gap-1 px-3 py-2 text-xs">
                    <span>Change</span>
                    <ChevronDown className="h-3 w-3" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-48 border-3 border-secondary p-0" align="start">
                  <div className="flex flex-col">
                    {DATE_PRESETS.map((preset) => (
                      <button
                        key={preset.value}
                        onClick={() => setDatePreset(preset.value)}
                        className={cn(
                          'px-4 py-2 text-left text-sm font-medium transition-colors hover:bg-gray-100',
                          datePreset === preset.value && 'bg-primary font-bold',
                        )}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Export Button */}
            <button
              onClick={handleExportCSV}
              disabled={entries.length === 0}
              className={cn(
                'btn-brutal-secondary flex items-center gap-2 px-4 py-2 text-xs',
                entries.length === 0 && 'cursor-not-allowed opacity-50',
              )}
            >
              <Download className="h-4 w-4" />
              <span>Export CSV</span>
            </button>
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
              className="grid grid-cols-2 gap-2 sm:gap-4 md:grid-cols-4"
            >
              <div className="card-brutal p-3 sm:p-4">
                <div className="flex items-center gap-1 text-gray-600 sm:gap-2">
                  <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="font-mono text-[10px] uppercase sm:text-xs">Total Time</span>
                </div>
                <div className="mt-1 text-lg font-bold sm:mt-2 sm:text-2xl">{stats.totalFormatted}</div>
              </div>

              <div className="card-brutal p-3 sm:p-4">
                <div className="flex items-center gap-1 text-gray-600 sm:gap-2">
                  <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="font-mono text-[10px] uppercase sm:text-xs">Days Active</span>
                </div>
                <div className="mt-1 text-lg font-bold sm:mt-2 sm:text-2xl">{stats.daysActive}</div>
              </div>

              <div className="card-brutal p-3 sm:p-4">
                <div className="flex items-center gap-1 text-gray-600 sm:gap-2">
                  <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="font-mono text-[10px] uppercase sm:text-xs">Avg/Day</span>
                </div>
                <div className="mt-1 text-lg font-bold sm:mt-2 sm:text-2xl">{stats.avgFormatted}</div>
              </div>

              <div className="card-brutal p-3 sm:p-4">
                <div className="flex items-center gap-1 text-gray-600 sm:gap-2">
                  <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="font-mono text-[10px] uppercase sm:text-xs">Entries</span>
                </div>
                <div className="mt-1 text-lg font-bold sm:mt-2 sm:text-2xl">{stats.entriesCount}</div>
              </div>
            </motion.div>
          )}

          {/* Charts */}
          {!entriesQuery.isLoading && entries.length > 0 && (
            <div className="grid grid-cols-1 gap-4 sm:gap-6 xl:grid-cols-2">
              {/* Daily Breakdown Chart */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="card-brutal"
              >
                <h3 className="mb-3 flex items-center gap-2 text-base font-bold uppercase sm:mb-4 sm:text-lg">
                  <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5" />
                  Daily Focus Time
                </h3>
                <div className="h-48 sm:h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.dailyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${Math.floor(v / 60)}h`} />
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
                <h3 className="mb-3 flex items-center gap-2 text-base font-bold uppercase sm:mb-4 sm:text-lg">
                  <Target className="h-4 w-4 sm:h-5 sm:w-5" />
                  Focus by Goal
                </h3>
                <div className="flex h-48 flex-col items-center gap-2 sm:h-64 sm:flex-row sm:gap-4">
                  <div className="h-40 w-full flex-1 sm:h-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={stats.goalData}
                          dataKey="minutes"
                          nameKey="title"
                          cx="50%"
                          cy="50%"
                          innerRadius={30}
                          outerRadius={60}
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
                  <div className="flex w-full flex-wrap gap-x-3 gap-y-1 sm:w-auto sm:flex-col sm:space-y-2">
                    {stats.goalData.slice(0, 5).map((goal, index) => (
                      <div key={index} className="flex items-center gap-1 sm:gap-2">
                        <div
                          className="h-2 w-2 flex-shrink-0 border border-secondary sm:h-3 sm:w-3"
                          style={{ backgroundColor: goal.color || COLORS[index % COLORS.length] }}
                        />
                        <span className="truncate font-mono text-[10px] sm:text-xs">{goal.title}</span>
                        <span className="font-mono text-[10px] text-gray-500 sm:text-xs">
                          ({formatDuration(goal.minutes)})
                        </span>
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
              <h3 className="mb-3 flex items-center gap-2 text-base font-bold uppercase sm:mb-4 sm:text-lg">
                <Target className="h-4 w-4 sm:h-5 sm:w-5" />
                Goals Progress
              </h3>
              <div className="space-y-3 sm:space-y-4">
                {goals
                  .filter((g) => g.status === 'ACTIVE')
                  .map((goal) => {
                    const progress = goal.targetHours > 0 ? (goal.loggedHours / goal.targetHours) * 100 : 0
                    return (
                      <div key={goal.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1 sm:gap-2">
                            <div
                              className="h-2 w-2 flex-shrink-0 border border-secondary sm:h-3 sm:w-3"
                              style={{ backgroundColor: goal.color }}
                            />
                            <span className="truncate text-sm font-bold sm:text-base">{goal.title}</span>
                          </div>
                          <span className="font-mono text-xs text-gray-600 sm:text-sm">
                            {goal.loggedHours.toFixed(1)}h / {goal.targetHours}h
                          </span>
                        </div>
                        <div className="h-3 w-full border-2 border-secondary bg-gray-100 sm:h-4">
                          <div
                            className="h-full transition-all duration-500"
                            style={{
                              width: `${Math.min(100, progress)}%`,
                              backgroundColor: goal.color,
                            }}
                          />
                        </div>
                        <div className="text-right font-mono text-[10px] text-gray-500 sm:text-xs">
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
