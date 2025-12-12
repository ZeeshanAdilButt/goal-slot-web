'use client'

import { type PointerEvent } from 'react'

import { COLUMN_HEIGHT, DAY_START_MIN, HOURS, PX_PER_MIN } from '@/features/schedule/utils/constants'
import { useDroppable } from '@dnd-kit/core'

type DayColumnProps = {
  dayOfWeek: number
  children: React.ReactNode
  onPointerDown: (day: number, event: PointerEvent<HTMLDivElement>) => void
  onPointerMove: (event: PointerEvent<HTMLDivElement>) => void
  onPointerUp: (event: PointerEvent<HTMLDivElement>) => void
}

export function DayColumn({ dayOfWeek, children, onPointerDown, onPointerMove, onPointerUp }: DayColumnProps) {
  const { setNodeRef } = useDroppable({
    id: `day-${dayOfWeek}`,
    data: { day: dayOfWeek },
  })

  return (
    <div
      ref={setNodeRef}
      className="relative border-l border-gray-200"
      style={{ height: COLUMN_HEIGHT }}
      onPointerDown={(event) => onPointerDown(dayOfWeek, event)}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      data-day={dayOfWeek}
    >
      {HOURS.map((hour) => {
        const top = (hour * 60 - DAY_START_MIN) * PX_PER_MIN
        return (
          <div key={hour} className="absolute left-0 right-0 border-t border-dashed border-gray-200" style={{ top }} />
        )
      })}

      {children}
    </div>
  )
}
