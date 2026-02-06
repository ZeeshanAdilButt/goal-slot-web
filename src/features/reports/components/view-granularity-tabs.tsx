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
  /** Match height of adjacent controls (e.g. Select h-10). Default true. */
  matchControlHeight?: boolean
  className?: string
}

/**
 * Reusable Daily / Weekly / Monthly view toggle.
 * Styled to align with filter bars and export controls when matchControlHeight is true.
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
        'flex items-center gap-1 rounded-lg border-2 border-secondary bg-background p-1',
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
            'flex items-center justify-center rounded-md px-3 py-1.5 text-sm font-bold transition-all sm:px-4 sm:py-2',
            matchControlHeight && 'h-full flex-1 sm:flex-initial',
            value === tab.value
              ? 'bg-primary text-secondary shadow-sm'
              : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900',
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
