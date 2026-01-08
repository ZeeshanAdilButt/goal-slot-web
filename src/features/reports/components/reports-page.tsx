'use client'

import { FocusBreakdownCard } from '@/features/reports/components/focus-breakdown-card'
import { FocusCategoryPieCard } from '@/features/reports/components/focus-category-pie-card'
import { FocusHourlyCard } from '@/features/reports/components/focus-hourly-card'
import { FocusTimeGridCard } from '@/features/reports/components/focus-time-grid-card'
import { FocusTrendCard } from '@/features/reports/components/focus-trend-card'

export function FocusPage() {
  return (
    <div className="space-y-8 p-2 sm:p-6">
      <div>
        <h1 className="font-display text-4xl font-bold uppercase">Focus</h1>
        <p className="font-mono uppercase text-gray-600">Visualize your focused time</p>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <FocusBreakdownCard />
        <FocusTrendCard />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <FocusHourlyCard />
        <FocusCategoryPieCard />
      </div>

      <div className="grid grid-cols-1 gap-6">
        <FocusTimeGridCard />
      </div>
    </div>
  )
}
