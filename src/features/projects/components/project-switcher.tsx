'use client'

import { useMemo, useRef, useState, type KeyboardEvent } from 'react'

import { Check, ChevronDown, Plus, Search, Settings } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

import type { ProjectSummary } from '../utils/types'
import { MemberAvatar, ProjectSwatch } from './member-avatar'

interface ProjectSwitcherProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projects: ProjectSummary[]
  /** The project being shown, or null for My tasks. */
  currentProject: ProjectSummary | null
  userName?: string | null
  userAvatar?: string | null
  /** Open tasks in My tasks, when known. */
  myOpenCount?: number
  onSelect: (projectId: string | null) => void
  onNewProject: () => void
  onOpenSettings: () => void
}

const itemClass =
  'flex w-full items-center gap-2.5 rounded-md px-2.5 text-left text-sm text-zinc-900 outline-none transition-colors hover:bg-zinc-100 focus-visible:bg-zinc-100 focus-visible:ring-2 focus-visible:ring-[#f2cc0d]'

export function ProjectSwitcher({
  open,
  onOpenChange,
  projects,
  currentProject,
  userName,
  userAvatar,
  myOpenCount,
  onSelect,
  onNewProject,
  onOpenSettings,
}: ProjectSwitcherProps) {
  const [query, setQuery] = useState('')
  const menuRef = useRef<HTMLDivElement>(null)
  const hasProjects = projects.length > 0

  const q = query.trim().toLowerCase()
  const visibleProjects = useMemo(
    () => (q ? projects.filter((p) => p.name.toLowerCase().includes(q)) : projects),
    [projects, q],
  )
  const showMyTasks = !q || 'my tasks'.includes(q) || 'personal'.includes(q)

  const handleOpenChange = (next: boolean) => {
    if (!next) setQuery('')
    onOpenChange(next)
  }

  const choose = (projectId: string | null) => {
    handleOpenChange(false)
    onSelect(projectId)
  }

  const items = () => Array.from(menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [])

  const handleMenuKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const list = items()
    if (list.length === 0) return
    const index = list.indexOf(document.activeElement as HTMLElement)
    let next = -1
    if (event.key === 'ArrowDown') next = index < 0 ? 0 : (index + 1) % list.length
    else if (event.key === 'ArrowUp') next = index <= 0 ? list.length - 1 : index - 1
    else if (event.key === 'Home') next = 0
    else if (event.key === 'End') next = list.length - 1
    if (next >= 0) {
      event.preventDefault()
      list[next].focus()
    }
  }

  const handleSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      items()[0]?.focus()
    } else if (event.key === 'Enter') {
      event.preventDefault()
      if (visibleProjects.length > 0 && q) choose(visibleProjects[0].id)
      else if (showMyTasks) choose(null)
    }
  }

  // With no projects the title still reads "Tasks", exactly as before; the
  // chevron is the only new thing on the page.
  const triggerLabel = currentProject ? currentProject.name : hasProjects ? 'My tasks' : 'Tasks'

  return (
    <div className="min-w-0">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
        {currentProject ? 'Tasks · Project' : hasProjects ? 'Tasks' : 'Execute'}
      </div>
      <Popover open={open} onOpenChange={handleOpenChange}>
        <h1 className="text-lg font-bold leading-tight tracking-tight text-zinc-900 sm:text-xl">
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-haspopup="menu"
              aria-expanded={open}
              aria-keyshortcuts="P"
              title="Switch tasks space (P)"
              className={cn(
                '-ml-1.5 inline-flex max-w-full items-center gap-2 rounded-md border px-1.5 py-0.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f2cc0d]',
                open ? 'border-zinc-900' : 'border-transparent hover:border-zinc-200',
              )}
            >
              {currentProject ? (
                <ProjectSwatch color={currentProject.color} className="h-4 w-4 rounded" />
              ) : hasProjects ? (
                <MemberAvatar name={userName} avatar={userAvatar} size="sm" decorative />
              ) : null}
              <span className="truncate">{triggerLabel}</span>
              <ChevronDown className="h-4 w-4 shrink-0 text-zinc-500" aria-hidden />
            </button>
          </PopoverTrigger>
        </h1>
        <PopoverContent
          align="start"
          sideOffset={8}
          collisionPadding={8}
          className="max-h-[var(--radix-popover-content-available-height)] w-[min(340px,calc(100vw-2rem))] overflow-y-auto p-2"
        >
          <label className="flex h-10 items-center gap-2 rounded-md bg-zinc-100 px-2.5">
            <Search className="h-3.5 w-3.5 text-zinc-500" aria-hidden />
            <span className="sr-only">Find a project</span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Find a project"
              className="min-w-0 flex-1 bg-transparent text-[13px] text-zinc-900 outline-none placeholder:text-zinc-500"
            />
            <kbd className="rounded border border-zinc-300 px-1.5 text-[11px] font-medium text-zinc-600">P</kbd>
          </label>

          <div ref={menuRef} role="menu" aria-label="Switch tasks space" onKeyDown={handleMenuKeyDown} className="mt-1">
            {showMyTasks ? (
              <>
                <div className="px-2.5 pb-0.5 pt-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                  Personal
                </div>
                <button type="button" role="menuitem" onClick={() => choose(null)} className={cn(itemClass, 'min-h-11')}>
                  <MemberAvatar name={userName} avatar={userAvatar} size="md" decorative />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="font-semibold">My tasks</span>
                    <span className="truncate text-xs text-zinc-600">Only you, plus anything assigned to you</span>
                  </span>
                  {typeof myOpenCount === 'number' ? (
                    <span className="text-xs tabular-nums text-zinc-600">{myOpenCount}</span>
                  ) : null}
                  {!currentProject ? <Check className="h-4 w-4 text-zinc-900" aria-label="Current" /> : null}
                </button>
              </>
            ) : null}

            {hasProjects ? (
              <>
                <div className="my-1 h-px bg-zinc-100" role="separator" />
                <div className="px-2.5 pb-0.5 pt-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                  Projects
                </div>
                {visibleProjects.length === 0 ? (
                  <p className="px-2.5 py-2 text-xs text-zinc-500">No project matches &ldquo;{query}&rdquo;</p>
                ) : (
                  visibleProjects.map((p) => {
                    const isCurrent = currentProject?.id === p.id
                    return (
                      <button
                        key={p.id}
                        type="button"
                        role="menuitem"
                        onClick={() => choose(p.id)}
                        className={cn(itemClass, 'min-h-10', isCurrent && 'bg-zinc-100')}
                      >
                        <ProjectSwatch color={p.color} className="h-3 w-3" />
                        <span className={cn('min-w-0 flex-1 truncate', isCurrent ? 'font-semibold' : 'font-medium')}>
                          {p.name}
                        </span>
                        {p.role === 'GUEST' ? (
                          <span className="rounded bg-zinc-100 px-1.5 py-px text-[11px] font-semibold text-zinc-700">
                            Guest
                          </span>
                        ) : null}
                        <span className="text-xs tabular-nums text-zinc-600" aria-label={`${p.openTaskCount} open`}>
                          {p.openTaskCount}
                        </span>
                        {isCurrent ? <Check className="h-4 w-4 text-zinc-900" aria-label="Current" /> : null}
                      </button>
                    )
                  })
                )}
              </>
            ) : null}

            <div className="my-1 h-px bg-zinc-100" role="separator" />
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                handleOpenChange(false)
                onNewProject()
              }}
              className={cn(itemClass, 'min-h-10 font-semibold')}
            >
              <Plus className="h-4 w-4" aria-hidden />
              New project
            </button>
            {currentProject ? (
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  handleOpenChange(false)
                  onOpenSettings()
                }}
                className={cn(itemClass, 'min-h-10 text-zinc-700')}
              >
                <Settings className="h-4 w-4" aria-hidden />
                Project settings and members
              </button>
            ) : null}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
