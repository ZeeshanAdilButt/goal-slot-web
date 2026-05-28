import { TaskStatus } from '@/features/tasks/utils/types'

// Uses real Tailwind tokens that exist in the v2 design system.
// (The previous version referenced `bg-accent-*` aliases that were removed
// when the brutalist tokens were dropped, leaving badges with no bg and
// the card "glow" overlay invisible while still dimming text contrast.)

export const taskStatusStyles: Record<
  TaskStatus,
  {
    badge: string
    dot: string
    fill: string
    /** Left-border accent class applied to the task card */
    border: string
    text: string
  }
> = {
  BACKLOG: {
    badge: 'bg-zinc-100 text-zinc-700 border-zinc-200',
    dot: 'bg-zinc-400',
    fill: 'bg-zinc-300',
    border: 'border-l-zinc-300',
    text: 'text-zinc-900',
  },
  TODO: {
    badge: 'bg-blue-50 text-blue-700 border-blue-200',
    dot: 'bg-blue-500',
    fill: 'bg-blue-500',
    border: 'border-l-blue-400',
    text: 'text-zinc-900',
  },
  DOING: {
    badge: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    dot: 'bg-[#f2cc0d]',
    fill: 'bg-[#f2cc0d]',
    border: 'border-l-[#f2cc0d]',
    text: 'text-zinc-900',
  },
  DONE: {
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-500',
    fill: 'bg-emerald-500',
    border: 'border-l-emerald-400',
    text: 'text-zinc-900',
  },
}
