import Link from 'next/link'

import { format } from 'date-fns'
import { Clock, Plus, Tag } from 'lucide-react'

export function DashboardHeader() {
  const today = format(new Date(), 'EEEE, MMMM d, yyyy')

  return (
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
  )
}
