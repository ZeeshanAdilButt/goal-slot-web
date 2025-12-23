import { TaskStatus } from '@/features/tasks/utils/types'

export const taskStatusStyles: Record<
  TaskStatus,
  { badge: string; dot: string; fill: string; glow: string; text: string }
> = {
  PENDING: {
    badge: 'bg-white text-gray-700 border-gray-300',
    dot: 'bg-gray-400',
    fill: 'bg-secondary',
    glow: 'from-gray-50 via-white to-white',
    text: 'text-secondary',
  },
  IN_PROGRESS: {
    badge: 'bg-accent-blue text-white border-secondary',
    dot: 'bg-accent-blue',
    fill: 'bg-accent-blue',
    glow: 'from-accent-blue/10 via-white to-white',
    text: 'text-secondary',
  },
  COMPLETED: {
    badge: 'bg-accent-green text-secondary border-secondary',
    dot: 'bg-accent-green',
    fill: 'bg-accent-green',
    glow: 'from-green-50 via-white to-white',
    text: 'text-secondary',
  },
}
