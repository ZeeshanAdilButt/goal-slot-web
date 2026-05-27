'use client'

import type { FocusGranularity } from '@/features/reports/utils/types'

import { cn } from '@/lib/utils'

const VIEW_TABS: Array<{ value: FocusGranularity; label: string }> = [
  { value: 'day', label: 'Daily' },
  { value: 'week', label: 'Weekly' },
  { value: 'month', label: 'Monthly' },
]

export interface ViewGranularityTabsProps {
  value: FocusGranularity
  onChange: (value: FocusGranularity) => void
  matchControlHeight?: boolean
  className?: string
}

/**
 * Reusable Daily / Weekly / Monthly segmented control.
 */
export function ViewGranularityTabs({
  value,
  onChange,
  matchControlHeight = true,
  className,
}: ViewGranularityTabsProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-1 rounded-lg bg-zinc-100 p-1',
        matchControlHeight && 'h-10',
        className,
      )}
    >
      {VIEW_TABS.map((tab) => (
        <button
          key={tab.value}
          type="button"
          onClick={() => onChange(tab.value)}
          className={cn(
            'flex items-center justify-center rounded-md px-3 text-xs font-semibold uppercase tracking-wider transition-all sm:px-4',
            matchControlHeight && 'h-full flex-1 sm:flex-initial',
            value === tab.value
              ? 'bg-white text-zinc-900 shadow-sm'
              : 'text-zinc-500 hover:text-zinc-900',
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
