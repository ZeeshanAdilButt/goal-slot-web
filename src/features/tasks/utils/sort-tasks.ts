import { Task, TaskStatus } from '@/features/tasks/utils/types'

export type TaskSort = 'newest' | 'oldest' | 'dueDate' | 'goal' | 'status'

export const TASK_SORT_OPTIONS: ReadonlyArray<{ value: TaskSort; label: string }> = [
    { value: 'newest', label: 'Newest first' },
    { value: 'oldest', label: 'Oldest first' },
    { value: 'dueDate', label: 'Due date' },
    { value: 'goal', label: 'Goal' },
    { value: 'status', label: 'Status' },
]

export function isTaskSort(value: unknown): value is TaskSort {
    return TASK_SORT_OPTIONS.some((o) => o.value === value)
}

const STATUS_ORDER: Record<TaskStatus, number> = { BACKLOG: 0, TODO: 1, DOING: 2, DONE: 3 }

const createdTime = (t: Task) => (t.createdAt ? new Date(t.createdAt).getTime() : 0)
const dueTime = (t: Task) => (t.dueDate ? new Date(t.dueDate).getTime() : null)
const goalTitle = (t: Task) => t.goal?.title?.trim() ?? ''

export function sortTasks(tasks: Task[], sort: TaskSort = 'newest'): Task[] {
    const sorted = [...tasks]
    switch (sort) {
        case 'oldest':
            sorted.sort((a, b) => createdTime(a) - createdTime(b))
            break
        case 'dueDate':
            sorted.sort((a, b) => {
                const aDue = dueTime(a)
                const bDue = dueTime(b)
                if (aDue === null && bDue === null) return 0
                if (aDue === null) return 1   // a has no date → push down
                if (bDue === null) return -1  // b has no date → push down
                return aDue - bDue            // earliest first
            })
            break
        case 'goal':
            sorted.sort((a, b) => {
                const aGoal = goalTitle(a)
                const bGoal = goalTitle(b)
                if (!aGoal && !bGoal) return 0
                if (!aGoal) return 1          // untagged → end
                if (!bGoal) return -1
                return aGoal.localeCompare(bGoal)
            })
            break
        case 'status':
            sorted.sort((a, b) => (STATUS_ORDER[a.status] ?? 99) - (STATUS_ORDER[b.status] ?? 99))
            break
        case 'newest':
        default:
            sorted.sort((a, b) => createdTime(b) - createdTime(a))
            break
    }
    return sorted
}
