'use client'

import { useCallback, useEffect, useState } from 'react'

import { useUpdateScheduleBlock } from '@/features/schedule/hooks/use-schedule-mutations'
import { DAY_END_MIN, DAY_START_MIN, MIN_DURATION, PX_PER_MIN } from '@/features/schedule/utils/constants'
import { DraftSelection, ScheduleBlock, WeekSchedule } from '@/features/schedule/utils/types'
import { hasOverlap, snapMinutes } from '@/features/schedule/utils/utils'
import { DragEndEvent, DragMoveEvent, DragStartEvent } from '@dnd-kit/core'
import { toast } from 'react-hot-toast'

import { minutesToTime, timeToMinutes } from '@/lib/utils'

type UseScheduleDragArgs = {
  weekSchedule: WeekSchedule
  draftKey: number
}

export function useScheduleDrag({ weekSchedule, draftKey }: UseScheduleDragArgs) {
  const { mutate: updateBlock } = useUpdateScheduleBlock()
  const [activeId, setActiveId] = useState<string | null>(null)
  const [preview, setPreview] = useState<DraftSelection | null>(null)
  const [pendingDraft, setPendingDraft] = useState<DraftSelection | null>(null)

  useEffect(() => {
    setPendingDraft(null)
  }, [draftKey])

  const commitUpdate = useCallback(
    async (block: ScheduleBlock, day: number, start: number, end: number) => {
      const payload = {
        title: block.title,
        category: block.category,
        color: block.color,
        goalId: block.goalId,
        dayOfWeek: day,
        startTime: minutesToTime(start),
        endTime: minutesToTime(end),
      }

      updateBlock(
        { id: block.id, data: payload },
        {
          onSuccess: () => toast.success('Schedule updated'),
          onError: () => toast.error('Failed to update schedule'),
        },
      )
    },
    [updateBlock],
  )

  const handleDragStart = (event: DragStartEvent) => {
    const block: ScheduleBlock | undefined = event.active.data.current?.block
    if (block) {
      setActiveId(block.id)
      // initialize preview to current block position so resize shows immediate feedback
      setPreview({
        dayOfWeek: block.dayOfWeek,
        start: timeToMinutes(block.startTime),
        end: timeToMinutes(block.endTime),
      })
      return
    }
    if (typeof event.active.id === 'string') {
      setActiveId(event.active.id)
    }
  }

  const handleDragMove = (event: DragMoveEvent) => {
    const type = event.active.data.current?.type
    if (!type) return
    const block: ScheduleBlock | undefined = event.active.data.current?.block
    if (!block) return

    const overDay: number | undefined = event.over?.data?.current?.day
    const day = overDay ?? block.dayOfWeek
    const duration = timeToMinutes(block.endTime) - timeToMinutes(block.startTime)
    const deltaMinutes = (event.delta.y || 0) / PX_PER_MIN

    if (type === 'block') {
      const newStart = snapMinutes(timeToMinutes(block.startTime) + deltaMinutes)
      const newEnd = snapMinutes(newStart + duration)
      setPreview({ dayOfWeek: day, start: newStart, end: newEnd })
    }

    if (type === 'resize-start') {
      const newStart = snapMinutes(timeToMinutes(block.startTime) + deltaMinutes)
      const end = timeToMinutes(block.endTime)
      if (end - newStart >= MIN_DURATION) {
        setPreview({ dayOfWeek: day, start: newStart, end })
      }
    }

    if (type === 'resize-end') {
      const start = timeToMinutes(block.startTime)
      const newEnd = snapMinutes(timeToMinutes(block.endTime) + deltaMinutes)
      if (newEnd - start >= MIN_DURATION) {
        setPreview({ dayOfWeek: day, start, end: newEnd })
      }
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const type = event.active.data.current?.type
    const block: ScheduleBlock | undefined = event.active.data.current?.block
    if (!block || !type) {
      setActiveId(null)
      setPreview(null)
      return
    }

    const overDay: number | undefined = event.over?.data?.current?.day
    const day = overDay ?? block.dayOfWeek
    const deltaMinutes = (event.delta.y || 0) / PX_PER_MIN
    const originalStart = timeToMinutes(block.startTime)
    const originalEnd = timeToMinutes(block.endTime)
    let nextStart = originalStart
    let nextEnd = originalEnd

    if (type === 'block') {
      nextStart = snapMinutes(originalStart + deltaMinutes)
      const duration = originalEnd - originalStart
      nextStart = Math.min(nextStart, DAY_END_MIN - duration)
      nextEnd = nextStart + duration
    }

    if (type === 'resize-start') {
      nextStart = snapMinutes(originalStart + deltaMinutes)
      if (nextEnd - nextStart < MIN_DURATION) nextStart = nextEnd - MIN_DURATION
    }

    if (type === 'resize-end') {
      nextEnd = snapMinutes(originalEnd + deltaMinutes)
      if (nextEnd - nextStart < MIN_DURATION) nextEnd = nextStart + MIN_DURATION
    }

    nextStart = Math.max(DAY_START_MIN, nextStart)
    nextEnd = Math.min(DAY_END_MIN, nextEnd)
    if (nextEnd - nextStart < MIN_DURATION) {
      if (type === 'resize-start') {
        nextStart = Math.max(DAY_START_MIN, nextEnd - MIN_DURATION)
      } else {
        nextEnd = Math.min(DAY_END_MIN, nextStart + MIN_DURATION)
      }
    }

    if (hasOverlap(weekSchedule, day, nextStart, nextEnd, block.id)) {
      toast.error('Time overlaps with another block')
    } else {
      await commitUpdate(block, day, nextStart, nextEnd)
    }

    setActiveId(null)
    setPreview(null)
  }

  return {
    activeId,
    preview,
    pendingDraft,
    setPendingDraft,
    handleDragStart,
    handleDragMove,
    handleDragEnd,
  }
}
