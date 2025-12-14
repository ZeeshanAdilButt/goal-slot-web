'use client'

export function FocusUpdatingOverlay({ active }: { active: boolean }) {
  if (!active) return null

  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70">
      <div className="h-10 w-10 animate-spin border-4 border-secondary border-t-primary" />
    </div>
  )
}

