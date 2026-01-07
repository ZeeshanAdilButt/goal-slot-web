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
    <div className="flex border-b-3 border-secondary">
      <button
        onClick={() => onTabChange('my')}
        className={cn(
          'flex-1 px-3 py-2 font-bold uppercase transition-colors border-b-4 -mb-[3px] sm:flex-none sm:px-6 sm:py-3',
          activeTab === 'my' ? 'border-primary bg-primary text-secondary' : 'border-transparent hover:bg-gray-100',
        )}
      >
        <div className="flex items-center justify-center gap-1 sm:gap-2">
          <Share2 className="h-4 w-4 sm:h-5 sm:w-5" />
          <span className="text-xs sm:text-base">My</span>
          {activeSharesCount > 0 && (
            <span className="rounded-full bg-secondary px-1.5 py-0.5 text-[10px] text-white sm:px-2 sm:text-xs">
              {activeSharesCount}
            </span>
          )}
        </div>
      </button>
      <button
        onClick={() => onTabChange('shared-with-me')}
        className={cn(
          'flex-1 px-3 py-2 font-bold uppercase transition-colors border-b-4 -mb-[3px] sm:flex-none sm:px-6 sm:py-3',
          activeTab === 'shared-with-me'
            ? 'border-primary bg-primary text-secondary'
            : 'border-transparent hover:bg-gray-100',
        )}
      >
        <div className="flex items-center justify-center gap-1 sm:gap-2">
          <Users className="h-4 w-4 sm:h-5 sm:w-5" />
          <span className="text-xs sm:text-base">Shared with me</span>
          {sharedWithMeCount > 0 && (
            <span className="rounded-full bg-secondary px-1.5 py-0.5 text-[10px] text-white sm:px-2 sm:text-xs">
              {sharedWithMeCount}
            </span>
          )}
        </div>
      </button>
    </div>
  )
}
