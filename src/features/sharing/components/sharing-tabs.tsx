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
    <div className="flex">
      <button
        onClick={() => onTabChange('my')}
        className={cn(
          'relative flex items-center gap-2 border-3 border-secondary px-4 py-3 font-bold uppercase transition-all sm:px-6',
          activeTab === 'my'
            ? 'z-10 bg-primary text-secondary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
            : 'bg-white text-secondary hover:bg-gray-50',
          activeTab === 'shared-with-me' && '-mr-[3px]',
        )}
      >
        <Share2 className="h-4 w-4 sm:h-5 sm:w-5" />
        <span className="text-xs sm:text-sm">My</span>
        {activeSharesCount > 0 && (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-secondary text-[10px] font-bold text-white sm:h-6 sm:w-6 sm:text-xs">
            {activeSharesCount}
          </span>
        )}
      </button>
      <button
        onClick={() => onTabChange('shared-with-me')}
        className={cn(
          'relative flex items-center gap-2 border-3 border-secondary px-4 py-3 font-bold uppercase transition-all sm:px-6',
          activeTab === 'shared-with-me'
            ? 'z-10 bg-primary text-secondary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
            : 'bg-white text-secondary hover:bg-gray-50',
          activeTab === 'my' && '-ml-[3px]',
        )}
      >
        <Users className="h-4 w-4 sm:h-5 sm:w-5" />
        <span className="text-xs sm:text-sm">Shared with me</span>
        {sharedWithMeCount > 0 && (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-secondary text-[10px] font-bold text-white sm:h-6 sm:w-6 sm:text-xs">
            {sharedWithMeCount}
          </span>
        )}
      </button>
    </div>
  )
}
