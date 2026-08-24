'use client'

import { useRef, useState, type PointerEvent } from 'react'

import { ScheduleEmptyState } from '@/features/schedule/components/schedule-empty-state'
import { DayColumn } from '@/features/schedule/components/schedule-grid/day-column'
import { DraftBlock } from '@/features/schedule/components/schedule-grid/draft-block'
import { ScheduleGridDragLayer } from '@/features/schedule/components/schedule-grid/drag-layer'
import { DraggableBlock } from '@/features/schedule/components/schedule-grid/draggable-block'
import { useScheduleDrag } from '@/features/schedule/hooks/use-schedule-drag'
import { DAY_START_MIN, getColumnHeight, getPxPerMin, SLOT_MIN } from '@/features/schedule/utils/constants'
import { DraftSelection, ScheduleBlock, ScheduleDensity, WeekSchedule } from '@/features/schedule/utils/types'
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
  density: ScheduleDensity
}

export function ScheduleGrid({
  weekSchedule,
  isPending,
  onAddBlock,
  onEdit,
  onViewDetail,
  draftKey,
  density,
}: ScheduleGridProps) {
  const { activeId, preview, pendingDraft, setPendingDraft, handleDragStart, handleDragMove, handleDragEnd } =
    useScheduleDrag({ weekSchedule, draftKey, density })
  const [draftSelection, setDraftSelection] = useState<DraftSelection | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const pointerColumnRef = useRef<number | null>(null)
  const draftAnchorRef = useRef<number | null>(null)
  // Computed once per render from the active density; every pixel<->minute
  // conversion in this component (pointer math, block top/height, hour
  // gridlines) reads through these so they always agree with each other
  // and with useScheduleDrag's own density-driven scale.
  const pxPerMin = getPxPerMin(density)
  const columnHeight = getColumnHeight(density)

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
    const start = snapMinutes(DAY_START_MIN + offsetY / pxPerMin)
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
    const current = snapMinutes(DAY_START_MIN + offsetY / pxPerMin)
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
    const top = (startMin - DAY_START_MIN) * pxPerMin
    // Render each block at its true time-proportional height. The previous
    // Math.max(..., 32) floor inflated 15-min blocks to span 32 minutes,
    // which made them overlap any block that started in the next 17
    // minutes. DraggableBlock has its own compact-render path for short
    // heights so short blocks still stay readable without lying about
    // their time span.
    const height = (endMin - startMin) * pxPerMin

    return (
      <DraggableBlock
        key={block.id}
        block={block}
        top={top}
        height={height}
        isActiveDrag={activeId === block.id}
        onEdit={onEdit}
        onViewDetail={onViewDetail}
        density={density}
      />
    )
  }

  const totalBlocks = Object.values(weekSchedule).reduce((sum, blocks) => sum + blocks.length, 0)
  const isEmpty = totalBlocks === 0

  // These are FLOORS, not fixed widths: the day columns are 1fr, so the grid
  // fills whatever width the page gives it and only scrolls once a column
  // would fall below the floor. Both floors are (64px time gutter + 7 cols).
  //
  // 'compact' keeps the original ~128px-per-column floor (960px total), which
  // fits the full week beside the 16rem sidebar from ~1280px viewports up.
  // 'comfortable' uses a ~148px-per-column floor (1100px total) so the week
  // fits from ~1440px up. It used to be a fixed-feeling 1400px floor, which no
  // ordinary desktop could satisfy inside the old max-w-6xl page shell, so
  // comfortable ALWAYS pushed Fri/Sat off behind a horizontal scrollbar. Now
  // that the shell is full-width, comfortable also grows *past* 1400px on
  // viewports over ~1720px instead of being pinned there. overflow-x-auto
  // still catches narrow/tablet/mobile viewports.
  const gridMinWidthClass = density === 'comfortable' ? 'min-w-[1100px]' : 'min-w-[960px]'

  return (
    <div className="overflow-x-auto">
      <div className={`relative ${gridMinWidthClass}`}>
        <div className="grid grid-cols-[4rem_repeat(7,minmax(0,1fr))] border-b border-zinc-200">
          <div className="w-16 bg-zinc-50 p-2 text-center text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            Time
          </div>
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
          <div className="relative flex overflow-y-hidden border-t border-zinc-200">
            {isEmpty && (
              <ScheduleEmptyState onAddBlock={() => onAddBlock(1, { startTime: '09:00', endTime: '10:00' })} />
            )}
            <div className="relative w-16 border-r border-zinc-200" style={{ height: columnHeight }}>
              {Array.from({ length: 24 }, (_, hour) => {
                const top = (hour * 60 - DAY_START_MIN) * pxPerMin
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
                  pxPerMin={pxPerMin}
                  columnHeight={columnHeight}
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                >
                  {(weekSchedule[dayOfWeek] || []).map((block) => renderBlock(block))}
                  {preview && preview.dayOfWeek === dayOfWeek && activeId && (
                    <DraftBlock selection={preview} pxPerMin={pxPerMin} />
                  )}
                  {draftSelection && draftSelection.dayOfWeek === dayOfWeek && (
                    <DraftBlock selection={draftSelection} pxPerMin={pxPerMin} />
                  )}
                  {pendingDraft && pendingDraft.dayOfWeek === dayOfWeek && (
                    <DraftBlock selection={pendingDraft} pxPerMin={pxPerMin} />
                  )}
                </DayColumn>
              ))}
            </div>
          </div>
        </ScheduleGridDragLayer>
      </div>
    </div>
  )
}
