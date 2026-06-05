'use client'

import Link from 'next/link'

import { CalendarDays, CheckSquare, Flag, Sparkles } from 'lucide-react'

import { CATEGORY_LABEL, type TemplateSummary } from '../types'

interface TemplateCardProps {
  template: TemplateSummary
  variant?: 'default' | 'featured'
}

export function TemplateCard({ template, variant = 'default' }: TemplateCardProps) {
  const isFeatured = variant === 'featured'
  return (
    <Link
      href={`/dashboard/library/${template.id}`}
      className={`group relative flex flex-col overflow-hidden rounded-2xl border bg-white p-4 transition-shadow hover:shadow-lg ${
        isFeatured
          ? 'border-[#f2cc0d] bg-gradient-to-br from-[#fffbea] to-white shadow-md'
          : 'border-zinc-200 shadow-sm'
      }`}
    >
      {isFeatured && (
        <div className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-[#f2cc0d] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-zinc-900">
          <Sparkles className="h-3 w-3" />
          Featured
        </div>
      )}
      <div className="mb-2 flex flex-wrap gap-1.5">
        {template.categories.map((c) => (
          <span
            key={c}
            className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-600"
          >
            {CATEGORY_LABEL[c]}
          </span>
        ))}
      </div>
      <h3 className="mb-1 text-base font-bold leading-snug text-zinc-900 group-hover:text-zinc-700">
        {template.name}
      </h3>
      <div className="mb-2 text-xs text-zinc-500">by {template.source}</div>
      <p className="mb-3 line-clamp-3 flex-1 text-sm text-zinc-600">
        {template.description}
      </p>
      <div className="flex items-center justify-between border-t border-zinc-100 pt-3 text-[11px] text-zinc-500">
        <span className="inline-flex items-center gap-1">
          <CalendarDays className="h-3 w-3" />
          {template.blockCount} blocks
        </span>
        <span className="inline-flex items-center gap-1">
          <Flag className="h-3 w-3" />
          {template.goalCount} goals
        </span>
        <span className="inline-flex items-center gap-1">
          <CheckSquare className="h-3 w-3" />
          {template.taskCount} tasks
        </span>
      </div>
    </Link>
  )
}
