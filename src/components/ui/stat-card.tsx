import * as React from 'react'

import { cn } from '@/lib/utils'
import { GlassCard } from '@/components/ui/glass-card'

export interface StatCardProps {
  icon?: React.ReactNode
  label: React.ReactNode
  value: React.ReactNode
  delta?: React.ReactNode
  accent?: 'brand' | 'success' | 'warning' | 'danger' | 'neutral'
  className?: string
}

const accentRing: Record<NonNullable<StatCardProps['accent']>, string> = {
  brand: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  warning: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  danger: 'bg-rose-50 text-rose-700 border-rose-200',
  neutral: 'bg-zinc-50 text-zinc-700 border-zinc-200',
}

function StatCard({ icon, label, value, delta, accent = 'neutral', className }: StatCardProps) {
  return (
    <GlassCard padded={false} className={cn('flex flex-col gap-2 p-4', className)}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
          {label}
        </span>
        {icon && (
          <span
            className={cn(
              'inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border [&_svg]:h-3.5 [&_svg]:w-3.5 [&_svg]:shrink-0',
              accentRing[accent],
            )}
          >
            {icon}
          </span>
        )}
      </div>
      <div className="text-2xl font-bold tabular-nums text-zinc-900">{value}</div>
      {delta && <div className="text-xs text-zinc-500">{delta}</div>}
    </GlassCard>
  )
}

export { StatCard }
