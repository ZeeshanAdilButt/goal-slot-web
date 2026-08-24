'use client'

import { useMemo, useState } from 'react'

import { BookOpen, Loader2, Search, Sparkles } from 'lucide-react'

import { useTemplates } from '../hooks'
import { CATEGORY_LABEL, type TemplateCategory } from '../types'
import { TemplateCard } from './template-card'

type CategoryFilter = 'all' | TemplateCategory

const CATEGORY_TABS: { id: CategoryFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'schedule', label: CATEGORY_LABEL.schedule },
  { id: 'habits', label: CATEGORY_LABEL.habits },
  { id: 'goals', label: CATEGORY_LABEL.goals },
  { id: 'notes', label: CATEGORY_LABEL.notes },
  { id: 'journal', label: CATEGORY_LABEL.journal },
]

export function LibraryPage() {
  const { data: templates, isLoading } = useTemplates()
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('all')
  const [query, setQuery] = useState('')

  const featured = useMemo(() => {
    if (!templates) return []
    return templates.filter((t) => t.featured)
  }, [templates])

  const filtered = useMemo(() => {
    if (!templates) return []
    const q = query.trim().toLowerCase()
    return templates.filter((t) => {
      const inCategory =
        activeCategory === 'all' || t.categories.includes(activeCategory)
      if (!inCategory) return false
      if (!q) return true
      return (
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.source.toLowerCase().includes(q)
      )
    })
  }, [templates, activeCategory, query])

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
      <header className="space-y-2">
        <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
          <BookOpen className="h-3.5 w-3.5" />
          Library
        </div>
        <h1 className="text-2xl font-bold uppercase tracking-tight text-zinc-900 sm:text-3xl">
          Community templates
        </h1>
        <p className="max-w-2xl text-sm text-zinc-600">
          Hand-picked schedules, habit packs, and goal frameworks from the GoalSlot
          community. Each one ships with the option to import the schedule, the
          implicit goals it points at, and starter tasks. Pick what you want, skip
          what you do not.
        </p>
      </header>

      {featured.length > 0 && activeCategory === 'all' && !query && (
        <section className="space-y-3">
          <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-amber-700">
            <Sparkles className="h-3.5 w-3.5" />
            Featured
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {featured.map((t) => (
              <TemplateCard key={t.id} template={t} variant="featured" />
            ))}
          </div>
        </section>
      )}

      <section className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-1.5">
            {CATEGORY_TABS.map((tab) => {
              const isActive = activeCategory === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveCategory(tab.id)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                    isActive
                      ? 'bg-zinc-900 text-white'
                      : 'bg-white text-zinc-700 ring-1 ring-zinc-200 hover:bg-zinc-50'
                  }`}
                >
                  {tab.label}
                </button>
              )
            })}
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search templates..."
              className="h-9 w-full rounded-md border border-zinc-200 bg-white pl-8 pr-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-[#f2cc0d] focus:outline-none focus:ring-1 focus:ring-[#f2cc0d]"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-zinc-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading templates...
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-200 bg-white px-4 py-12 text-center text-sm text-zinc-500">
            No templates match.{' '}
            {query ? (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="text-zinc-900 underline hover:no-underline"
              >
                Clear search
              </button>
            ) : (
              <>Try a different category.</>
            )}
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((t) => (
              <TemplateCard key={t.id} template={t} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
