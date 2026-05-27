import { TabType } from '@/features/sharing/utils/types'
import { Share2, Users } from 'lucide-react'

import { cn } from '@/lib/utils'

interface SharingTabsProps {
  activeTab: TabType
  onTabChange: (tab: TabType) => void
  activeSharesCount: number
  sharedWithMeCount: number
}

export function SharingTabs({ activeTab, onTabChange, activeSharesCount, sharedWithMeCount }: SharingTabsProps) {
  return (
    <div className="inline-flex items-center gap-1 rounded-lg bg-zinc-100 p-1">
      <button
        onClick={() => onTabChange('my')}
        className={cn(
          'flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-all sm:px-4',
          activeTab === 'my'
            ? 'bg-white text-zinc-900 shadow-sm'
            : 'text-zinc-500 hover:text-zinc-900',
        )}
      >
        <Share2 className="h-4 w-4" />
        <span>My</span>
        {activeSharesCount > 0 && (
          <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-zinc-900 px-1.5 text-[10px] font-semibold text-white">
            {activeSharesCount}
          </span>
        )}
      </button>
      <button
        onClick={() => onTabChange('shared-with-me')}
        className={cn(
          'flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-all sm:px-4',
          activeTab === 'shared-with-me'
            ? 'bg-white text-zinc-900 shadow-sm'
            : 'text-zinc-500 hover:text-zinc-900',
        )}
      >
        <Users className="h-4 w-4" />
        <span>Shared with me</span>
        {sharedWithMeCount > 0 && (
          <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-zinc-900 px-1.5 text-[10px] font-semibold text-white">
            {sharedWithMeCount}
          </span>
        )}
      </button>
    </div>
  )
}
