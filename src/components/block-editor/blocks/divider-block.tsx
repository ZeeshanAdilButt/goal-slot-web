'use client'

import { cn } from '@/lib/utils'

interface DividerBlockComponentProps {
  isSelected: boolean
  onSelect: () => void
}

export function DividerBlockComponent({ isSelected, onSelect }: DividerBlockComponentProps) {
  return (
    <div
      className={cn(
        'group relative py-2 transition-colors',
        isSelected && 'bg-muted/50'
      )}
      onClick={onSelect}
    >
      <hr className="border-t-2 border-border" />
    </div>
  )
}
