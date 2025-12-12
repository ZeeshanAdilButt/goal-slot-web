'use client'

import { DAY_START_MIN, PX_PER_MIN } from '@/features/schedule/utils/constants'
import { DraftSelection } from '@/features/schedule/utils/types'

type DraftBlockProps = {
  selection: DraftSelection
}

export function DraftBlock({ selection }: DraftBlockProps) {
  const top = (selection.start - DAY_START_MIN) * PX_PER_MIN
  const height = (selection.end - selection.start) * PX_PER_MIN
  return (
    <div
      className="pointer-events-none absolute left-2 right-2 rounded-sm border-2 border-dashed border-secondary bg-primary/30"
      style={{ top, height }}
    />
  )
}
