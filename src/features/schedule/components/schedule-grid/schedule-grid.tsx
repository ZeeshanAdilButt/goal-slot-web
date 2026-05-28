'use client'

import { useRef, useState, type PointerEvent } from 'react'

import { DayColumn } from '@/features/schedule/components/schedule-grid/day-column'
import { DraftBlock } from '@/features/schedule/components/schedule-grid/draft-block'
import { ScheduleGridDragLayer } from '@/features/schedule/components/schedule-grid/drag-layer'
import { DraggableBlock } from '@/features/schedule/components/schedule-grid/draggable-block'
import { useScheduleDrag } from '@/features/schedule/hooks/use-schedule-drag'
import { COLUMN_HEIGHT, DAY_START_MIN, PX_PER_MIN, SLOT_MIN } from '@/features/schedule/utils/constants'
import { DraftSelection, ScheduleBlock, WeekSchedule } from '@/features/schedule/utils/types'
import { snapMinutes } from '@/features/schedule/utils/utils'
import { Plus } from 'lucide-react'

import { DAYS_OF_WEEK_FULL, minutesToTime, timeToMinutes } from '@/lib/utils'
import { Loading } from '@/components/ui/loading'

type ScheduleGridProps = {
  weekSchedule: WeekSchedule
  isPending: boolean
  onAddBlock: (dayOfWeek: number, preset?: { startTime: string; endTime: string }) => void
  onEdit: (block: ScheduleBlock) => void
  onViewDetail: (block: ScheduleBlock) => void
  draftKey: number
}

export function ScheduleGrid({
  weekSchedule,
  isPending,
  onAddBlock,
  onEdit,
  onViewDetail,
  draftKey,
}: ScheduleGridProps) {
  const { activeId, preview, pendingDraft, setPendingDraft, handleDragStart, handleDragMove, handleDragEnd } =
    useScheduleDrag({ weekSchedule, draftKey })
  const [draftSelection, setDraftSelection] = useState<DraftSelection | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const pointerColumnRef = useRef<number | null>(null)
  const draftAnchorRef = useRef<number | null>(null)

  if (isPending) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loading />
      </div>
    )
  }

  const handlePointerDown = (dayOfWeek: number, event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return
    const target = event.target as HTMLElement
    if (target.closest('[data-block]')) return
    setPendingDraft(null)
    const rect = event.currentTarget.getBoundingClientRect()
    const offsetY = event.clientY - rect.top
    const start = snapMinutes(DAY_START_MIN + offsetY / PX_PER_MIN)
    draftAnchorRef.current = start
    const end = snapMinutes(start + SLOT_MIN)
    setDraftSelection({ dayOfWeek, start: Math.min(start, end), end: Math.max(start, end) })
    setIsCreating(true)
    pointerColumnRef.current = dayOfWeek
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!isCreating || pointerColumnRef.current === null || !draftSelection || draftAnchorRef.current === null) return
    const rect = event.currentTarget.getBoundingClientRect()
    const offsetY = event.clientY - rect.top
    const current = snapMinutes(DAY_START_MIN + offsetY / PX_PER_MIN)
    const anchor = draftAnchorRef.current
    const low = Math.min(anchor, current)
    const high = Math.max(anchor + SLOT_MIN, current)
    setDraftSelection((prev) => (prev ? { ...prev, start: low, end: high } : null))
  }

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (!isCreating || pointerColumnRef.current === null || !draftSelection) return
    event.currentTarget.releasePointerCapture(event.pointerId)
    setIsCreating(false)
    pointerColumnRef.current = null
    const start = Math.min(draftSelection.start, draftSelection.end)
    const end = Math.max(draftSelection.start, draftSelection.end)
    onAddBlock(draftSelection.dayOfWeek, {
      startTime: minutesToTime(start),
      endTime: minutesToTime(end),
    })
    setPendingDraft({ ...draftSelection, start, end })
    setDraftSelection(null)
    draftAnchorRef.current = null
  }

  const renderBlock = (block: ScheduleBlock) => {
    // Keep real block at persisted position; draft overlay shows drag intent.
    const startMin = timeToMinutes(block.startTime)
    const endMin = timeToMinutes(block.endTime)
    const top = (startMin - DAY_START_MIN) * PX_PER_MIN
    const height = Math.max((endMin - startMin) * PX_PER_MIN, 32)

    return (
      <DraggableBlock
        key={block.id}
        block={block}
        top={top}
        height={height}
        isActiveDrag={activeId === block.id}
        onEdit={() => onEdit(block)}
        onViewDetail={() => onViewDetail(block)}
      />
    )
  }

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[960px]">
        <div className="grid grid-cols-[4rem_repeat(7,minmax(0,1fr))] border-b border-zinc-200">
          <div className="w-16 bg-zinc-50 p-2 text-center text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Time</div>
          {DAYS_OF_WEEK_FULL.map((day, index) => (
            <div
              key={day}
              className="border-l border-zinc-200 bg-zinc-50 p-3 text-center text-[11px] font-semibold uppercase tracking-wider text-zinc-700"
            >
              {day.slice(0, 3)}
              <button
                onClick={() => onAddBlock(index)}
                className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-md bg-[#f2cc0d] text-zinc-900 transition-transform hover:scale-110"
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>

        <ScheduleGridDragLayer onDragStart={handleDragStart} onDragMove={handleDragMove} onDragEnd={handleDragEnd}>
          <div className="flex overflow-y-hidden border-t border-zinc-200">
            <div className="relative w-16 border-r border-zinc-200" style={{ height: COLUMN_HEIGHT }}>
              {Array.from({ length: 24 }, (_, hour) => {
                const top = (hour * 60 - DAY_START_MIN) * PX_PER_MIN
                const ampm = hour >= 12 ? 'PM' : 'AM'
                const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
                return (
                  <div
                    key={hour}
                    className="absolute left-0 right-0 pr-1 text-right text-xs text-zinc-500"
                    style={{ top }}
                  >
                    <span className="font-medium text-zinc-700">{displayHour}</span>
                    <span className="ml-0.5 text-[10px] uppercase tracking-wider">{ampm}</span>
                  </div>
                )
              })}
            </div>

            <div className="grid flex-1 grid-cols-7">
              {[0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => (
                <DayColumn
                  key={dayOfWeek}
                  dayOfWeek={dayOfWeek}
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                >
                  {(weekSchedule[dayOfWeek] || []).map((block) => renderBlock(block))}
                  {preview && preview.dayOfWeek === dayOfWeek && activeId && <DraftBlock selection={preview} />}
                  {draftSelection && draftSelection.dayOfWeek === dayOfWeek && (
                    <DraftBlock selection={draftSelection} />
                  )}
                  {pendingDraft && pendingDraft.dayOfWeek === dayOfWeek && <DraftBlock selection={pendingDraft} />}
                </DayColumn>
              ))}
            </div>
          </div>
        </ScheduleGridDragLayer>
      </div>
    </div>
  )
}
