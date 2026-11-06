'use client'

import { useMemo } from 'react'

import type { Task } from '@/features/tasks/utils/types'
import { PanelLeft, Users } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Loading } from '@/components/ui/loading'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

import { assigneeIdOf, type AssigneeFilter } from '../utils/task-fields'
import { ROLE_LABELS, type ProjectMember } from '../utils/types'
import { MemberAvatar } from './member-avatar'

interface MembersFilterProps {
  members: ProjectMember[]
  tasks: Task[]
  selected: AssigneeFilter
  onSelect: (filter: AssigneeFilter) => void
  meId?: string | null
}

function useCounts(tasks: Task[]) {
  return useMemo(() => {
    const byUser = new Map<string, number>()
    let unassigned = 0
    tasks.forEach((t) => {
      const id = assigneeIdOf(t)
      if (id) byUser.set(id, (byUser.get(id) ?? 0) + 1)
      else unassigned += 1
    })
    return { byUser, unassigned, total: tasks.length }
  }, [tasks])
}

function isSelected(selected: AssigneeFilter, userId: string, meId?: string | null) {
  return selected === `user:${userId}` || (selected === 'me' && !!meId && userId === meId)
}

/** Left sidebar in project mode: filter the board by member instead of goal. */
export function MembersSidebarDesktop({
  members,
  tasks,
  selected,
  onSelect,
  meId,
  isLoading,
  onToggleCollapse,
}: MembersFilterProps & { isLoading: boolean; onToggleCollapse?: () => void }) {
  const counts = useCounts(tasks)
  const row = (active: boolean) =>
    cn(
      'flex min-h-9 w-full items-center gap-2 rounded-md border px-2 py-1.5 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f2cc0d]',
      active ? 'border-zinc-200 bg-white font-semibold text-zinc-900 shadow-sm' : 'border-transparent text-zinc-700 hover:bg-white',
    )

  return (
    <aside
      aria-label="Project members"
      className="hidden h-full w-full min-w-0 flex-shrink-0 flex-col border-r border-zinc-200 bg-[#fafafa] md:flex"
    >
      <div className="flex-shrink-0 border-b border-zinc-200 px-2 py-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" aria-hidden />
            <span className="text-lg font-bold uppercase">Members</span>
          </div>
          {onToggleCollapse ? (
            <button
              type="button"
              onClick={onToggleCollapse}
              className="flex h-8 w-8 items-center justify-center border border-zinc-200 bg-primary text-zinc-900 shadow-sm transition-all hover:-translate-x-0.5 hover:-translate-y-0.5"
              aria-label="Collapse members sidebar"
              title="Collapse members sidebar"
            >
              <PanelLeft className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-2 py-4">
        {isLoading ? (
          <div className="flex min-h-[200px] items-center justify-center">
            <Loading size="sm" />
          </div>
        ) : (
          <ul className="space-y-1">
            <li>
              <button
                type="button"
                className={row(selected === 'all')}
                aria-pressed={selected === 'all'}
                onClick={() => onSelect('all')}
              >
                <span className="flex-1">All tasks</span>
                <span className="text-xs tabular-nums text-zinc-500">{counts.total}</span>
              </button>
            </li>
            {members.map((m) => {
              const active = isSelected(selected, m.userId, meId)
              return (
                <li key={m.userId}>
                  <button
                    type="button"
                    className={row(active)}
                    aria-pressed={active}
                    onClick={() => onSelect(`user:${m.userId}`)}
                  >
                    <MemberAvatar name={m.name} avatar={m.avatar} size="sm" decorative />
                    <span className="min-w-0 flex-1 truncate">
                      {m.name}
                      {m.userId === meId ? <span className="ml-1 text-xs font-normal text-zinc-500">(you)</span> : null}
                    </span>
                    {m.role !== 'MEMBER' ? (
                      <span className="rounded bg-zinc-100 px-1 text-[10px] font-semibold text-zinc-600">
                        {ROLE_LABELS[m.role]}
                      </span>
                    ) : null}
                    <span className="text-xs tabular-nums text-zinc-500">{counts.byUser.get(m.userId) ?? 0}</span>
                  </button>
                </li>
              )
            })}
            <li>
              <button
                type="button"
                className={row(selected === 'unassigned')}
                aria-pressed={selected === 'unassigned'}
                onClick={() => onSelect('unassigned')}
              >
                <span className="flex-1">Unassigned</span>
                <span className="text-xs tabular-nums text-zinc-500">{counts.unassigned}</span>
              </button>
            </li>
          </ul>
        )}
      </div>
    </aside>
  )
}

/** Mobile: the same filter as a select under the header. */
export function MembersFilterMobile({ members, tasks, selected, onSelect, meId }: MembersFilterProps) {
  const counts = useCounts(tasks)
  const value = selected === 'me' && meId ? `user:${meId}` : selected
  return (
    <Select value={value} onValueChange={(v) => onSelect(v as AssigneeFilter)}>
      <SelectTrigger className="h-9 w-full bg-white text-xs" aria-label="Filter by member">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All tasks ({counts.total})</SelectItem>
        {members.map((m) => (
          <SelectItem key={m.userId} value={`user:${m.userId}`}>
            {m.name}
            {m.userId === meId ? ' (you)' : ''} ({counts.byUser.get(m.userId) ?? 0})
          </SelectItem>
        ))}
        <SelectItem value="unassigned">Unassigned ({counts.unassigned})</SelectItem>
      </SelectContent>
    </Select>
  )
}
