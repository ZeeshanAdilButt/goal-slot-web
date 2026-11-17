import type { ScheduleBlock } from '@/features/schedule/utils/types'

export type BlockFormFields = {
  title: string
  startTime: string
  endTime: string
  category: string
  color: string
  goalId: string
  isPrivate: boolean
}

/**
 * True when the form differs from the stored block in anything other than the
 * day set. Only then does Save need to ask "only this block, or all of them":
 * a pure day-set change applies to the series by nature.
 */
export function hasFieldChanges(block: ScheduleBlock, form: BlockFormFields): boolean {
  return (
    form.title.trim() !== block.title.trim() ||
    form.startTime !== block.startTime ||
    form.endTime !== block.endTime ||
    form.category !== block.category ||
    form.color !== block.color ||
    (form.goalId || '') !== (block.goalId || '') ||
    form.isPrivate !== Boolean(block.isPrivate)
  )
}
