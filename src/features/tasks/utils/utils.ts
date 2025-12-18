import { DAYS_OF_WEEK_FULL } from '@/lib/utils'

import { GroupBy, GroupedTasks, Task } from './types'

export function groupTasksByStatus(tasks: Task[]): GroupedTasks {
  const groups = {
    IN_PROGRESS: [] as Task[],
    PENDING: [] as Task[],
    COMPLETED: [] as Task[],
  }

  tasks.forEach((task) => {
    if (groups[task.status]) {
      groups[task.status].push(task)
    }
  })

  return Object.entries(groups).filter(([_, tasks]) => tasks.length > 0)
}

export function groupTasksByDay(tasks: Task[]): GroupedTasks {
  const groups: Record<string, Task[]> = {}

  tasks.forEach((task) => {
    let key = 'Unscheduled'
    if (task.scheduleBlock) {
      key = DAYS_OF_WEEK_FULL[task.scheduleBlock.dayOfWeek]
    }
    if (!groups[key]) {
      groups[key] = []
    }
    groups[key].push(task)
  })

  const sortedGroups = Object.entries(groups).sort((a, b) => {
    const dayA = DAYS_OF_WEEK_FULL.indexOf(a[0])
    const dayB = DAYS_OF_WEEK_FULL.indexOf(b[0])

    if (dayA === -1 && dayB === -1) return 0
    if (dayA === -1) return 1
    if (dayB === -1) return -1

    return dayA - dayB
  })

  return sortedGroups
}

export function groupTasksBySchedule(tasks: Task[]): GroupedTasks {
  const groups: Record<string, Task[]> = {}

  tasks.forEach((task) => {
    let key = 'Unscheduled'
    if (task.scheduleBlock) {
      key = task.scheduleBlock.title
    }
    if (!groups[key]) {
      groups[key] = []
    }
    groups[key].push(task)
  })

  const sortedGroups = Object.entries(groups).sort((a, b) => {
    if (a[0] === 'Unscheduled') return 1
    if (b[0] === 'Unscheduled') return -1
    return a[0].localeCompare(b[0])
  })

  return sortedGroups
}

export function groupTasks(tasks: Task[], groupBy: GroupBy): GroupedTasks {
  if (groupBy === 'status') {
    return groupTasksByStatus(tasks)
  } else if (groupBy === 'day') {
    return groupTasksByDay(tasks)
  } else {
    return groupTasksBySchedule(tasks)
  }
}
