import Link from 'next/link'

import { ArrowRight, Calendar } from 'lucide-react'

import { GlassCard } from '@/components/ui/glass-card'

export function DashboardScheduleCTA() {
  return (
    <Link href="/dashboard/schedule" className="block">
      <GlassCard className="group flex cursor-pointer items-center justify-between border-yellow-200 bg-yellow-50">
        <div>
          <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg border border-yellow-200 bg-white text-yellow-700">
            <Calendar className="h-5 w-5" />
          </div>
          <div className="text-base font-semibold text-zinc-900">View Schedule</div>
          <p className="mt-0.5 text-xs text-zinc-500">Plan your week</p>
        </div>
        <ArrowRight className="h-5 w-5 text-zinc-400 transition-transform group-hover:translate-x-1" />
      </GlassCard>
    </Link>
  )
}
