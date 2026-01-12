import { DataShare } from '@/features/sharing/utils/types'
import { motion } from 'framer-motion'
import { Trash2 } from 'lucide-react'

import { cn } from '@/lib/utils'

interface SharingShareCardProps {
  share: DataShare
  onRevoke: () => void
  isPending?: boolean
}

export function SharingShareCard({ share, onRevoke, isPending = false }: SharingShareCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center justify-between border-2 border-secondary bg-white p-3 sm:p-4"
    >
      <div className="flex items-center gap-2 sm:gap-4">
        <div
          className={cn(
            'h-8 w-8 sm:h-10 sm:w-10 border-2 border-secondary flex items-center justify-center font-bold text-sm sm:text-lg flex-shrink-0',
            share.accessLevel === 'EDIT' ? 'bg-primary' : 'bg-gray-100',
          )}
        >
          {share.sharedWith?.name?.[0] || share.email?.[0]?.toUpperCase() || '?'}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-bold sm:text-base">{share.sharedWith?.name || share.email}</div>
          <div className="truncate font-mono text-xs text-gray-600 sm:text-sm">{share.email}</div>
          <div className="mt-1 flex flex-wrap items-center gap-1 sm:gap-2">
            <span
              className={cn(
                'px-1.5 py-0.5 text-[10px] sm:text-xs font-mono uppercase border border-secondary whitespace-nowrap',
                share.accessLevel === 'EDIT' ? 'bg-primary' : 'bg-gray-100',
              )}
            >
              {share.accessLevel === 'EDIT' ? 'Can Edit' : 'View Only'}
            </span>
            {isPending && (
              <span className="whitespace-nowrap bg-accent-orange px-1.5 py-0.5 font-mono text-[10px] uppercase text-white sm:text-xs">
                Pending
              </span>
            )}
          </div>
        </div>
      </div>

      <button
        onClick={onRevoke}
        className="group flex h-8 w-8 flex-shrink-0 items-center justify-center border-2 border-secondary transition-colors hover:border-red-500 hover:bg-red-50 sm:h-10 sm:w-10"
      >
        <Trash2 className="h-4 w-4 text-gray-600 group-hover:text-red-500 sm:h-5 sm:w-5" />
      </button>
    </motion.div>
  )
}
