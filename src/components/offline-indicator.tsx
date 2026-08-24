'use client'

import { CloudOff } from 'lucide-react'

import { useOnlineStatus } from '@/hooks/use-online-status'
import { useOfflineQueueStore } from '@/lib/use-offline-queue-store'
import { cn } from '@/lib/utils'

interface OfflineIndicatorProps {
  className?: string
}

// Invisible while online; shows offline state + pending write count when the connection drops.
export function OfflineIndicator({ className }: OfflineIndicatorProps) {
  const isOnline = useOnlineStatus()
  const pendingCount = useOfflineQueueStore((s) => s.pendingCount)

  if (isOnline) return null

  const pendingLabel =
    pendingCount > 0
      ? `${pendingCount} ${pendingCount === 1 ? 'change' : 'changes'} will sync when you're back online`
      : 'Changes will sync when you reconnect'

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'flex items-center gap-2 border-2 border-black bg-[#f2cc0d] px-3 py-1 text-xs font-bold uppercase tracking-wide text-black',
        className,
      )}
    >
      <CloudOff className="h-4 w-4 shrink-0" />
      <span>Offline</span>
      <span className="hidden font-semibold normal-case tracking-normal sm:inline">— {pendingLabel}</span>
      {pendingCount > 0 && (
        <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-black bg-black px-1 text-[10px] font-bold text-[#f2cc0d]">
          {pendingCount}
        </span>
      )}
    </div>
  )
}
