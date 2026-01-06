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
          'px-6 py-3 font-bold uppercase transition-colors border-b-4 -mb-[3px]',
          activeTab === 'my' ? 'border-primary bg-primary text-secondary' : 'border-transparent hover:bg-gray-100',
        )}
      >
        <div className="flex items-center gap-2">
          <Share2 className="h-5 w-5" />
          My
          {activeSharesCount > 0 && (
            <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-white">{activeSharesCount}</span>
          )}
        </div>
      </button>
      <button
        onClick={() => onTabChange('shared-with-me')}
        className={cn(
          'px-6 py-3 font-bold uppercase transition-colors border-b-4 -mb-[3px]',
          activeTab === 'shared-with-me'
            ? 'border-primary bg-primary text-secondary'
            : 'border-transparent hover:bg-gray-100',
        )}
      >
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Shared with me
          {sharedWithMeCount > 0 && (
            <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-white">{sharedWithMeCount}</span>
          )}
        </div>
      </button>
    </div>
  )
}
