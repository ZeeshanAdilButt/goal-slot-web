'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight, Users } from 'lucide-react'

import { useSharedWhiteboardsQuery } from '@/features/whiteboards/hooks/use-whiteboards'
import type { SharedWithMeItem } from '@/features/whiteboards/types'
import { cn } from '@/lib/utils'

interface SharedWhiteboardsPanelProps {
  selectedShareId: string | null
  onSelectShared: (summary: SharedWithMeItem) => void
  className?: string
}

export function SharedWhiteboardsPanel({
  selectedShareId,
  onSelectShared,
  className,
}: SharedWhiteboardsPanelProps) {
  const { data: shares = [], isLoading } = useSharedWhiteboardsQuery()
  const [open, setOpen] = useState(true)

  if (!isLoading && shares.length === 0) return null

  return (
    <div className={cn('border-t border-zinc-200 bg-white', className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-500 transition-colors hover:bg-zinc-50"
        aria-expanded={open}
      >
        <span className="flex items-center gap-1.5">
          <Users className="h-3 w-3" />
          Shared with me
          {shares.length > 0 && (
            <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-bold text-zinc-700">
              {shares.length}
            </span>
          )}
        </span>
        {open ? (
          <ChevronDown className="h-3 w-3 text-zinc-400" />
        ) : (
          <ChevronRight className="h-3 w-3 text-zinc-400" />
        )}
      </button>
      {open && (
        <ul className="max-h-64 overflow-y-auto pb-2">
          {isLoading ? (
            <li className="px-3 py-2 text-[11px] text-zinc-400">Loading...</li>
          ) : (
            shares.map((s) => {
              const isSelected = selectedShareId === s.shareId
              return (
                <li key={s.shareId}>
                  <button
                    type="button"
                    onClick={() => onSelectShared(s)}
                    title={`${s.whiteboard.title || 'Untitled'} — shared by ${s.owner.name}`}
                    className={cn(
                      'flex w-full items-start gap-2 px-3 py-1.5 text-left text-xs transition-colors',
                      isSelected
                        ? 'bg-[#f2cc0d]/20 text-zinc-900'
                        : 'text-zinc-700 hover:bg-zinc-50',
                    )}
                  >
                    <span aria-hidden className="mt-0.5 text-sm leading-none">
                      {s.whiteboard.icon || '⬜'}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">
                        {s.whiteboard.title || 'Untitled'}
                      </span>
                      <span className="block truncate text-[10px] text-zinc-500">
                        {s.owner.name}
                      </span>
                    </span>
                  </button>
                </li>
              )
            })
          )}
        </ul>
      )}
    </div>
  )
}
