'use client'

import { useMemo } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import { format, parseISO } from 'date-fns'
import { TrendingUp, Clock, Target, Layers } from 'lucide-react'

import type { SummaryItem, DateBreakdownItem, ReportGroupBy } from '@/features/reports/utils/types'
import { formatDuration } from '@/lib/utils'

interface SummaryReportViewProps {
  items: SummaryItem[]
  dateBreakdown: DateBreakdownItem[]
  groupBy: ReportGroupBy
  summary: {
    totalMinutes: number
    totalFormatted: string
    totalHours: number
    totalEntries: number
    uniqueDays: number
  }
  billable?: {
    hourlyRate: number
    totalHours: number
    totalAmount: number
    currency: string
  } | null
  showBillable?: boolean
}

const GROUP_BY_LABELS: Record<ReportGroupBy, string> = {
  goal: 'Goals',
  task: 'Tasks',
  date: 'Dates',
  category: 'Categories',
}

const GROUP_BY_ICONS: Record<ReportGroupBy, typeof Target> = {
  goal: Target,
  task: Layers,
  date: Clock,
  category: TrendingUp,
}

// Default colors for items without a color
const DEFAULT_COLORS = [
  '#FFD700', '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
  '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16', '#F97316',
]

export function SummaryReportView({
  items,
  dateBreakdown,
  groupBy,
  summary,
  billable,
  showBillable = false,
}: SummaryReportViewProps) {
  const GroupIcon = GROUP_BY_ICONS[groupBy]

  const pieData = useMemo(() => {
    return items.slice(0, 8).map((item, index) => ({
      name: item.name,
      value: item.totalMinutes,
      color: item.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length],
      percentage: item.percentage,
    }))
  }, [items])

  const barData = useMemo(() => {
    return dateBreakdown.map((d) => ({
      date: format(parseISO(d.date), 'MMM d'),
      fullDate: d.date,
      minutes: d.minutes,
      hours: (d.minutes / 60).toFixed(1),
    }))
  }, [dateBreakdown])

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <GroupIcon className="mb-4 h-12 w-12 text-gray-400" />
        <h3 className="text-lg font-semibold text-gray-600">No data found</h3>
        <p className="text-sm text-gray-500">Try adjusting your date range or filters</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg border-2 border-secondary bg-white p-3">
          <div className="text-xs font-medium uppercase text-gray-500">Total Time</div>
          <div className="text-xl font-bold">{summary.totalFormatted}</div>
          <div className="text-xs text-gray-500">{summary.totalHours.toFixed(1)} hours</div>
        </div>
        <div className="rounded-lg border-2 border-secondary bg-white p-3">
          <div className="text-xs font-medium uppercase text-gray-500">Entries</div>
          <div className="text-xl font-bold">{summary.totalEntries}</div>
          <div className="text-xs text-gray-500">{summary.uniqueDays} unique days</div>
        </div>
        <div className="rounded-lg border-2 border-secondary bg-white p-3">
          <div className="text-xs font-medium uppercase text-gray-500">{GROUP_BY_LABELS[groupBy]}</div>
          <div className="text-xl font-bold">{items.length}</div>
        </div>
        {showBillable && billable && (
          <div className="rounded-lg border-2 border-green-500 bg-green-50 p-3">
            <div className="text-xs font-medium uppercase text-green-700">Billable</div>
            <div className="text-xl font-bold text-green-700">
              ${billable.totalAmount.toFixed(2)}
            </div>
            <div className="text-xs text-green-600">@ ${billable.hourlyRate}/hr</div>
          </div>
        )}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Pie Chart */}
        <div className="rounded-lg border-3 border-secondary bg-white p-4">
          <h3 className="mb-4 font-bold uppercase">By {GROUP_BY_LABELS[groupBy]}</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="#18181b" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => [formatDuration(value), 'Duration']}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '2px solid #18181b',
                    borderRadius: '8px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Legend */}
          <div className="mt-4 grid grid-cols-2 gap-2">
            {pieData.slice(0, 6).map((item) => (
              <div key={item.name} className="flex items-center gap-2 text-sm">
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="truncate">{item.name}</span>
                <span className="ml-auto font-mono text-gray-500">{item.percentage}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bar Chart - Date Trend */}
        <div className="rounded-lg border-3 border-secondary bg-white p-4">
          <h3 className="mb-4 font-bold uppercase">Daily Activity</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10 }}
                  axisLine={{ stroke: '#18181b', strokeWidth: 2 }}
                />
                <YAxis
                  tickFormatter={(value) => `${(value / 60).toFixed(0)}h`}
                  tick={{ fontSize: 10 }}
                  axisLine={{ stroke: '#18181b', strokeWidth: 2 }}
                />
                <Tooltip
                  formatter={(value: number) => [formatDuration(value), 'Duration']}
                  labelFormatter={(label) => `Date: ${label}`}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '2px solid #18181b',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="minutes" fill="#FFD700" stroke="#18181b" strokeWidth={2} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="rounded-lg border-3 border-secondary bg-white">
        <div className="border-b-2 border-secondary bg-gray-50 px-4 py-3">
          <h3 className="font-bold uppercase">
            <GroupIcon className="mr-2 inline-block h-4 w-4" />
            {GROUP_BY_LABELS[groupBy]} Breakdown
          </h3>
        </div>
        
        {/* Table Header */}
        <div className="hidden border-b-2 border-secondary bg-gray-100 px-4 py-2 font-mono text-xs font-semibold uppercase sm:grid sm:grid-cols-12">
          <div className="col-span-5">{groupBy === 'goal' ? 'Goal' : groupBy === 'task' ? 'Task' : 'Item'}</div>
          <div className="col-span-2 text-right">Hours</div>
          <div className="col-span-2 text-right">Entries</div>
          <div className="col-span-2 text-right">Percentage</div>
          {showBillable && billable && <div className="col-span-1 text-right">Amount</div>}
        </div>

        {/* Table Body */}
        <div className="divide-y divide-gray-100">
          {items.map((item, index) => (
            <div
              key={item.id}
              className="grid grid-cols-1 gap-2 px-4 py-3 transition-colors hover:bg-gray-50 sm:grid-cols-12 sm:items-center sm:gap-0"
            >
              {/* Name */}
              <div className="col-span-5 flex items-center gap-2">
                <span
                  className="h-4 w-4 rounded-full"
                  style={{
                    backgroundColor: item.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length],
                  }}
                />
                <span className="font-medium">{item.name}</span>
              </div>

              {/* Hours */}
              <div className="col-span-2 text-right font-mono">
                <span className="text-sm text-gray-500 sm:hidden">Hours: </span>
                {item.totalFormatted}
              </div>

              {/* Entries */}
              <div className="col-span-2 text-right text-gray-600">
                <span className="text-sm text-gray-500 sm:hidden">Entries: </span>
                {item.entriesCount}
              </div>

              {/* Percentage Bar */}
              <div className="col-span-2 flex items-center gap-2">
                <div className="flex-1">
                  <div className="h-2 overflow-hidden rounded-full bg-gray-200">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${item.percentage}%`,
                        backgroundColor: item.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length],
                      }}
                    />
                  </div>
                </div>
                <span className="w-12 text-right font-mono text-sm">{item.percentage}%</span>
              </div>

              {/* Billable Amount */}
              {showBillable && billable && (
                <div className="col-span-1 text-right font-mono text-green-600">
                  ${item.billableAmount?.toFixed(2)}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Grand Total */}
        <div className="flex items-center justify-between border-t-3 border-secondary bg-secondary px-4 py-3 text-white">
          <span className="font-semibold uppercase">Total</span>
          <div className="flex items-center gap-6">
            <span className="text-xl font-bold">{summary.totalFormatted}</span>
            {showBillable && billable && (
              <span className="rounded bg-white/20 px-2 py-1 text-sm">
                ${billable.totalAmount.toFixed(2)}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
