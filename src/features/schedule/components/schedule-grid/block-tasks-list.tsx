'use client'

import { useLayoutEffect, useRef, useState } from 'react'

import { ScheduleBlock } from '@/features/schedule/utils/types'

type BlockTasksListProps = {
  tasks: ScheduleBlock['tasks']
  blockHeight: number
  headerRef: React.RefObject<HTMLDivElement | null>
}

export function BlockTasksList({ tasks, blockHeight, headerRef }: BlockTasksListProps) {
  const [visibleTasksCount, setVisibleTasksCount] = useState<number | null>(null)

  useLayoutEffect(() => {
    if (!tasks || tasks.length === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVisibleTasksCount(0)
      return
    }

    if (!headerRef?.current) {
      // On first render, show all tasks, then recalculate
      setVisibleTasksCount(tasks.length)
      return
    }

    const headerHeight = headerRef.current.offsetHeight
    const padding = 16 // p-2 = 8px top + 8px bottom
    const tasksMarginTop = 4 // mt-1 = 4px
    const availableHeight = blockHeight - headerHeight - padding - tasksMarginTop

    // Each task is text-[10px] with leading-[1.3] ≈ 13px, plus gap-[1px] ≈ 1px
    // So approximately 14px per task
    const taskHeightWithGap = 14
    const maxTasks = Math.floor(availableHeight / taskHeightWithGap)

    setVisibleTasksCount(Math.max(0, Math.min(maxTasks, tasks.length)))
  }, [blockHeight, tasks, headerRef])

  if (!tasks || tasks.length === 0 || visibleTasksCount === null) {
    return null
  }

  return (
    <div className="mt-1 flex min-h-0 flex-1 flex-col gap-[1px]">
      {tasks.slice(0, visibleTasksCount).map((task) => (
        <div key={task.id} className="shrink-0 truncate font-mono text-[10px] leading-[1.3] opacity-80">
          • {task.title}
        </div>
      ))}
    </div>
  )
}
