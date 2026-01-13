'use client'

import { Loading } from '@/components/ui/loading'

export function FocusUpdatingOverlay({ active }: { active: boolean }) {
  if (!active) return null

  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70">
      <Loading size="md" />
    </div>
  )
}
