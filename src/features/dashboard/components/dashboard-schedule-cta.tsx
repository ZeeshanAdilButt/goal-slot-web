import Link from 'next/link'

import { ArrowRight, Calendar } from 'lucide-react'

import { GlassCard } from '@/components/ui/glass-card'

export function DashboardScheduleCTA() {
  return (
    <Link href="/dashboard/schedule" className="block">
      <GlassCard className="group flex cursor-pointer items-center justify-between bg-yellow-50 border-yellow-200">
        <div>
          <div className="h-9 w-9 rounded-lg bg-white border border-yellow-200 flex items-center justify-center mb-3 text-yellow-700">
            <Calendar className="h-5 w-5" />
          </div>
          <div className="text-base font-semibold text-zinc-900">View Schedule</div>
          <p className="text-xs text-zinc-500 mt-0.5">Plan your week</p>
        </div>
        <ArrowRight className="h-5 w-5 text-zinc-400 transition-transform group-hover:translate-x-1" />
      </GlassCard>
    </Link>
  )
}
