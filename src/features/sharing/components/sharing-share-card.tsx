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
      className="flex items-center justify-between border-2 border-secondary bg-white p-4"
    >
      <div className="flex items-center gap-4">
        <div
          className={cn(
            'w-10 h-10 border-2 border-secondary flex items-center justify-center font-bold text-lg',
            share.accessLevel === 'EDIT' ? 'bg-primary' : 'bg-gray-100',
          )}
        >
          {share.sharedWith?.name?.[0] || share.email[0].toUpperCase()}
        </div>
        <div>
          <div className="font-bold">{share.sharedWith?.name || share.email}</div>
          <div className="font-mono text-sm text-gray-600">{share.email}</div>
          <div className="mt-1 flex items-center gap-2">
            <span
              className={cn(
                'px-2 py-0.5 text-xs font-mono uppercase border border-secondary',
                share.accessLevel === 'EDIT' ? 'bg-primary' : 'bg-gray-100',
              )}
            >
              {share.accessLevel === 'EDIT' ? 'Can Edit' : 'View Only'}
            </span>
            {isPending && (
              <span className="bg-accent-orange px-2 py-0.5 font-mono text-xs uppercase text-white">Pending</span>
            )}
          </div>
        </div>
      </div>

      <button
        onClick={onRevoke}
        className="group flex h-10 w-10 items-center justify-center border-2 border-secondary transition-colors hover:border-red-500 hover:bg-red-50"
      >
        <Trash2 className="h-5 w-5 text-gray-600 group-hover:text-red-500" />
      </button>
    </motion.div>
  )
}
