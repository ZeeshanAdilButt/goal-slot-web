'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'

import { ArrowLeft, CalendarDays, CheckSquare, Flag, Loader2, RefreshCw, Sparkles } from 'lucide-react'
import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { toast } from 'react-hot-toast'

import { useSyncTemplate, useTemplate } from '../hooks'
import {
  CATEGORY_LABEL,
  type TemplateGoal,
  type TemplateScheduleBlock,
  type TemplateTask,
} from '../types'
import { ImportDialog } from './import-dialog'

// Markdown styling tuned to match the rest of the app's typography. Lifted
// from the Coach markdown renderer so the long-description for a template
// reads the same as Coach narrative output.
const markdownComponents: Components = {
  p: ({ children }) => (
    <p className="my-2 leading-relaxed first:mt-0 last:mb-0">{children}</p>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-zinc-900">{children}</strong>
  ),
  em: ({ children }) => <em className="italic">{children}</em>,
  ul: ({ children }) => (
    <ul className="my-2 list-disc space-y-1 pl-5 marker:text-zinc-400 first:mt-0 last:mb-0">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="my-2 list-decimal space-y-1 pl-5 marker:text-zinc-400 first:mt-0 last:mb-0">
      {children}
    </ol>
  ),
  li: ({ children }) => (
    <li className="leading-relaxed [&>p]:my-0">{children}</li>
  ),
  h1: ({ children }) => (
    <h3 className="mb-2 mt-3 text-base font-semibold text-zinc-900 first:mt-0">
      {children}
    </h3>
  ),
  h2: ({ children }) => (
    <h3 className="mb-2 mt-3 text-base font-semibold text-zinc-900 first:mt-0">
      {children}
    </h3>
  ),
  h3: ({ children }) => (
    <h4 className="mb-1.5 mt-3 text-sm font-semibold uppercase tracking-wider text-zinc-500 first:mt-0">
      {children}
    </h4>
  ),
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-[#8a7307] underline decoration-[#f2cc0d] decoration-2 underline-offset-2 hover:text-[#6b5905]"
    >
      {children}
    </a>
  ),
}

const DAY_NAME = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// Group tasks by goal, preserving the goal order from the template (so the
// detail page renders sections in the same order the curator wrote them).
// Tasks whose goalRef does not resolve fall into an "unlinked" bucket at the
// end so they are still visible.
function groupTasksByGoal(
  goals: TemplateGoal[],
  tasks: TemplateTask[],
): { goal: TemplateGoal | null; tasks: TemplateTask[] }[] {
  const byRef = new Map<string, TemplateTask[]>()
  const unlinked: TemplateTask[] = []
  for (const t of tasks) {
    if (t.goalRef && goals.some((g) => g.ref === t.goalRef)) {
      const arr = byRef.get(t.goalRef) ?? []
      arr.push(t)
      byRef.set(t.goalRef, arr)
    } else {
      unlinked.push(t)
    }
  }
  const out: { goal: TemplateGoal | null; tasks: TemplateTask[] }[] = []
  for (const g of goals) {
    const arr = byRef.get(g.ref)
    if (arr && arr.length > 0) out.push({ goal: g, tasks: arr })
  }
  if (unlinked.length > 0) out.push({ goal: null, tasks: unlinked })
  return out
}

interface TemplateDetailPageProps {
  templateId: string
}

export function TemplateDetailPage({ templateId }: TemplateDetailPageProps) {
  const { data: template, isLoading, error } = useTemplate(templateId)
  const [importOpen, setImportOpen] = useState(false)
  const syncMutation = useSyncTemplate(templateId)

  const handleSync = async () => {
    try {
      const result = await syncMutation.mutateAsync()
      if (!result.matched) {
        toast.error(
          'Import this template first. The Sync button is for templates you have already imported.',
        )
        return
      }
      if (result.tasksAdded === 0) {
        toast.success('Already up to date. No new tasks.')
        return
      }
      const noun = result.tasksAdded === 1 ? 'task' : 'tasks'
      toast.success(
        `Added ${result.tasksAdded} new ${noun}${result.skipped ? `, skipped ${result.skipped}` : ''}`,
      )
    } catch {
      toast.error('Sync failed. Please try again.')
    }
  }

  const blocksByDay = useMemo(() => {
    const map = new Map<number, TemplateScheduleBlock[]>()
    if (!template?.schedule) return map
    for (const b of template.schedule) {
      const arr = map.get(b.dayOfWeek) ?? []
      arr.push(b)
      map.set(b.dayOfWeek, arr)
    }
    for (const arr of map.values()) {
      arr.sort((a, b) => a.startTime.localeCompare(b.startTime))
    }
    return map
  }, [template])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 px-4 py-24 text-sm text-zinc-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading template...
      </div>
    )
  }

  if (error || !template) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h2 className="text-lg font-bold text-zinc-900">Template not found</h2>
        <p className="mt-2 text-sm text-zinc-600">
          This template may have been removed or never existed.
        </p>
        <Link
          href="/dashboard/library"
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-zinc-900 hover:underline"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Library
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
      <Link
        href="/dashboard/library"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-900"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Library
      </Link>

      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {template.featured && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#f2cc0d] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-zinc-900">
              <Sparkles className="h-3 w-3" />
              Featured
            </span>
          )}
          {template.categories.map((c) => (
            <span
              key={c}
              className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-600"
            >
              {CATEGORY_LABEL[c]}
            </span>
          ))}
        </div>
        <h1 className="text-2xl font-bold uppercase tracking-tight text-zinc-900 sm:text-3xl">
          {template.name}
        </h1>
        <div className="text-sm text-zinc-500">
          by{' '}
          {template.sourceUrl ? (
            <a
              href={template.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-zinc-700 hover:underline"
            >
              {template.source}
            </a>
          ) : (
            <span className="font-semibold text-zinc-700">{template.source}</span>
          )}
        </div>
        <p className="text-sm text-zinc-600">{template.description}</p>
        <div className="flex flex-wrap items-center gap-2 pt-2">
          <button
            type="button"
            onClick={() => setImportOpen(true)}
            className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-[#f2cc0d] px-4 text-sm font-bold text-zinc-900 shadow-sm hover:bg-[#dfb90c]"
          >
            Import to my account
          </button>
          <button
            type="button"
            onClick={handleSync}
            disabled={syncMutation.isPending}
            title={`Pull any new tasks the ${template.source} team has added to this template`}
            className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 text-sm font-semibold text-zinc-800 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {syncMutation.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
            Sync from {template.source}
          </button>
          <div className="flex flex-wrap gap-3 text-[11px] text-zinc-500">
            <span className="inline-flex items-center gap-1">
              <CalendarDays className="h-3 w-3" />
              {template.schedule?.length ?? 0} blocks
            </span>
            <span className="inline-flex items-center gap-1">
              <Flag className="h-3 w-3" />
              {template.goals?.length ?? 0} goals
            </span>
            <span className="inline-flex items-center gap-1">
              <CheckSquare className="h-3 w-3" />
              {template.tasks?.length ?? 0} tasks
            </span>
          </div>
        </div>
      </header>

      {template.longDescription && (
        <section className="rounded-2xl border border-zinc-200 bg-white p-5 text-sm leading-relaxed text-zinc-700 shadow-sm">
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
            About this template
          </div>
          <div className="space-y-2">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
              {template.longDescription}
            </ReactMarkdown>
          </div>
        </section>
      )}

      {template.goals && template.goals.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
            Goals you would get
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {template.goals.map((g) => (
              <div
                key={g.ref}
                className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="h-4 w-4 rounded-full border-2 border-zinc-200"
                    style={{ backgroundColor: g.color }}
                    aria-hidden
                  />
                  <h3 className="text-sm font-bold uppercase text-zinc-900">
                    {g.title}
                  </h3>
                </div>
                {g.description && (
                  <p className="mt-2 text-xs text-zinc-600">{g.description}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {template.schedule && template.schedule.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
            Weekly schedule preview
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6, 0].map((day) => {
              const items = blocksByDay.get(day) ?? []
              if (items.length === 0) return null
              return (
                <div
                  key={day}
                  className="rounded-xl border border-zinc-200 bg-white p-3 shadow-sm"
                >
                  <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                    {DAY_NAME[day]}
                  </div>
                  <ul className="space-y-1.5">
                    {items.map((b, i) => {
                      const goal = template.goals?.find((g) => g.ref === b.goalRef)
                      return (
                        <li
                          key={`${b.startTime}-${i}`}
                          className="flex items-start gap-2 text-[12px]"
                        >
                          <span className="shrink-0 font-mono text-zinc-500">
                            {b.startTime}
                          </span>
                          <span className="min-w-0 flex-1 text-zinc-800">
                            {b.title}
                          </span>
                          {goal && (
                            <span
                              className="h-2 w-2 shrink-0 rounded-full"
                              style={{ backgroundColor: goal.color }}
                              aria-hidden
                              title={goal.title}
                            />
                          )}
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {template.tasks && template.tasks.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
            Starter tasks
          </h2>
          <div className="space-y-3">
            {groupTasksByGoal(template.goals ?? [], template.tasks).map(
              ({ goal, tasks }) => (
                <div
                  key={goal?.ref ?? 'unlinked'}
                  className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm"
                >
                  <header className="flex items-center gap-2 border-b border-zinc-100 bg-zinc-50/60 px-3 py-2">
                    {goal ? (
                      <>
                        <span
                          className="h-3 w-3 shrink-0 rounded-full"
                          style={{ backgroundColor: goal.color }}
                          aria-hidden
                        />
                        <span className="text-[12px] font-bold uppercase tracking-wider text-zinc-800">
                          {goal.title}
                        </span>
                        <span className="text-[11px] text-zinc-500">
                          {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
                        </span>
                      </>
                    ) : (
                      <span className="text-[12px] font-bold uppercase tracking-wider text-zinc-500">
                        Unlinked
                      </span>
                    )}
                  </header>
                  <ul className="divide-y divide-zinc-100">
                    {tasks.map((t, i) => (
                      <li
                        key={`${t.title}-${i}`}
                        className="flex items-start gap-2 px-3 py-2"
                      >
                        <CheckSquare className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-400" />
                        <div className="min-w-0 flex-1">
                          <div className="text-sm text-zinc-800">{t.title}</div>
                          {t.description && (
                            <div className="mt-0.5 break-words text-[11px] leading-relaxed text-zinc-500">
                              {t.description}
                            </div>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ),
            )}
          </div>
        </section>
      )}

      <ImportDialog
        template={template}
        open={importOpen}
        onClose={() => setImportOpen(false)}
      />
    </div>
  )
}
