import Link from 'next/link'

import { ArrowRight, Calendar } from 'lucide-react'

export function DashboardScheduleCTA() {
  return (
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
  )
}
