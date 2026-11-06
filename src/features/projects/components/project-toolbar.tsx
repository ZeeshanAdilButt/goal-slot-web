'use client'

import { UserPlus } from 'lucide-react'

import { cn } from '@/lib/utils'

import type { TasksScope } from '../utils/space'
import type { AssigneeFilter } from '../utils/task-fields'
import type { ProjectMember } from '../utils/types'
import { AvatarStack } from './member-avatar'

const segment = (active: boolean) =>
  cn(
    'rounded px-2.5 py-1 text-[11px] font-semibold tracking-wider transition-colors',
    active ? 'bg-[#f2cc0d] text-zinc-900' : 'text-zinc-500 hover:text-zinc-900',
  )

/** My tasks: "Mine + assigned" (scope=mine) or "Personal only" (scope=personal). */
export function ScopeToggle({ value, onChange }: { value: TasksScope; onChange: (scope: TasksScope) => void }) {
  return (
    <div className="inline-flex rounded-md border border-zinc-200 bg-white p-0.5 shadow-sm" role="group" aria-label="Include">
      <button type="button" aria-pressed={value === 'mine'} onClick={() => onChange('mine')} className={segment(value === 'mine')}>
        Mine + assigned
      </button>
      <button
        type="button"
        aria-pressed={value === 'personal'}
        onClick={() => onChange('personal')}
        className={segment(value === 'personal')}
      >
        Personal only
      </button>
    </div>
  )
}

/** Project mode: member stack and, for admins, the Invite button. */
export function ProjectHeaderActions({
  members,
  canInvite,
  onInvite,
  onOpenMembers,
}: {
  members: ProjectMember[]
  canInvite: boolean
  onInvite: () => void
  onOpenMembers: () => void
}) {
  return (
    <>
      {members.length > 0 ? (
        <button
          type="button"
          onClick={onOpenMembers}
          className="rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f2cc0d]"
          aria-label={`${members.length} ${members.length === 1 ? 'member' : 'members'}, open project settings`}
        >
          <AvatarStack members={members} />
        </button>
      ) : null}
      {canInvite ? (
        <button
          type="button"
          onClick={onInvite}
          className="inline-flex h-8 items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-2.5 text-xs font-semibold text-zinc-900 shadow-sm transition-colors hover:bg-zinc-50"
        >
          <UserPlus className="h-3.5 w-3.5" aria-hidden />
          Invite
        </button>
      ) : null}
    </>
  )
}

const chip = (active: boolean) =>
  cn(
    'h-8 rounded-full border px-2.5 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f2cc0d]',
    active ? 'border-zinc-900 bg-zinc-900 font-semibold text-white' : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300',
  )

/** Everyone / Assigned to me / Unassigned / Due this week. */
export function ProjectFilterChips({
  assignee,
  onAssigneeChange,
  dueThisWeek,
  onDueThisWeekChange,
  isGuest,
}: {
  assignee: AssigneeFilter
  onAssigneeChange: (filter: AssigneeFilter) => void
  dueThisWeek: boolean
  onDueThisWeekChange: (value: boolean) => void
  isGuest: boolean
}) {
  return (
    <div className="mb-3 flex flex-wrap items-center gap-2" role="group" aria-label="Filter project tasks">
      <button type="button" aria-pressed={assignee === 'all'} onClick={() => onAssigneeChange('all')} className={chip(assignee === 'all')}>
        Everyone
      </button>
      {isGuest ? null : (
        <button type="button" aria-pressed={assignee === 'me'} onClick={() => onAssigneeChange('me')} className={chip(assignee === 'me')}>
          Assigned to me
        </button>
      )}
      <button
        type="button"
        aria-pressed={assignee === 'unassigned'}
        onClick={() => onAssigneeChange('unassigned')}
        className={chip(assignee === 'unassigned')}
      >
        Unassigned
      </button>
      <button type="button" aria-pressed={dueThisWeek} onClick={() => onDueThisWeekChange(!dueThisWeek)} className={chip(dueThisWeek)}>
        Due this week
      </button>
      {isGuest ? <span className="text-xs text-zinc-500">You are a guest here: view only.</span> : null}
    </div>
  )
}
