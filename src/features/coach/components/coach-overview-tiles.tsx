'use client'

import { ReactNode, useState } from 'react'

import { useCoachInsights } from '@/features/coach/hooks/use-coach-insights'
import {
  CalendarRange,
  ChevronDown,
  Flame,
  Lightbulb,
  Maximize2,
  ShieldCheck,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

import { ActivePracticeSection } from './active-practice-section'
import { NarrativeSection } from './coach-page'

type TileId = 'capabilities' | 'narrative' | 'practice'

interface TileMeta {
  id: TileId
  title: string
  summary: string
  icon: typeof Lightbulb
  accent: string
}

interface CoachOverviewTilesProps {
  scopeKey: string
}

export function CoachOverviewTiles({ scopeKey }: CoachOverviewTilesProps) {
  const [expanded, setExpanded] = useState<TileId | null>(null)
  const [popped, setPopped] = useState<TileId | null>(null)

  const insights = useCoachInsights('ACTIVE')
  const practiceCount = insights.insights.filter(
    (i) => i.status === 'ACCEPTED' || i.status === 'DOING',
  ).length

  const tiles: TileMeta[] = [
    {
      id: 'capabilities',
      title: 'What Coach can do',
      summary: 'Reads your week, proposes edits, remembers practices.',
      icon: Lightbulb,
      accent: 'text-[#8a7307]',
    },
    {
      id: 'narrative',
      title: 'Your week',
      summary: 'A narrative grounded in your data, refreshed weekly.',
      icon: CalendarRange,
      accent: 'text-sky-700',
    },
    {
      id: 'practice',
      title: 'Active practice',
      summary:
        practiceCount === 0
          ? 'Nothing accepted yet. Open a suggestion and say yes to start.'
          : `${practiceCount} practice${practiceCount === 1 ? '' : 's'} you said yes to.`,
      icon: Flame,
      accent: 'text-emerald-700',
    },
  ]

  const toggle = (id: TileId) => setExpanded((cur) => (cur === id ? null : id))

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {tiles.map((tile) => {
          const Icon = tile.icon
          const isActive = expanded === tile.id
          return (
            <div
              key={tile.id}
              className={cn(
                'group relative overflow-hidden rounded-xl border bg-white p-3 shadow-sm transition-all',
                isActive
                  ? 'border-[#f2cc0d] ring-1 ring-[#f2cc0d]/30'
                  : 'border-zinc-200 hover:border-zinc-300',
              )}
            >
              <button
                type="button"
                onClick={() => toggle(tile.id)}
                className="flex w-full items-start gap-3 text-left"
                aria-expanded={isActive}
              >
                <span className={cn('mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-zinc-50', tile.accent)}>
                  <Icon className="h-4 w-4" />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-semibold text-zinc-900">{tile.title}</span>
                  <span className="mt-0.5 block truncate text-[12px] text-zinc-500">{tile.summary}</span>
                </span>
                <ChevronDown
                  className={cn(
                    'mt-1 h-4 w-4 shrink-0 text-zinc-400 transition-transform',
                    isActive && 'rotate-180',
                  )}
                  aria-hidden
                />
              </button>
              <button
                type="button"
                onClick={() => setPopped(tile.id)}
                className="absolute right-2 top-2 inline-flex h-6 w-6 items-center justify-center rounded-md text-zinc-400 opacity-0 transition-opacity hover:bg-zinc-100 hover:text-zinc-700 group-hover:opacity-100 focus-visible:opacity-100"
                title="Open in popup"
                aria-label={`Open ${tile.title} in popup`}
              >
                <Maximize2 className="h-3.5 w-3.5" />
              </button>
            </div>
          )
        })}
      </div>

      {expanded && (
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <TileBody id={expanded} scopeKey={scopeKey} />
        </div>
      )}

      <Dialog open={popped !== null} onOpenChange={(o) => !o && setPopped(null)}>
        <DialogContent className="max-h-[90vh] w-[95vw] overflow-y-auto sm:max-w-2xl lg:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{popped ? tiles.find((t) => t.id === popped)?.title : ''}</DialogTitle>
          </DialogHeader>
          {popped && <TileBody id={popped} scopeKey={scopeKey} />}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function TileBody({ id, scopeKey }: { id: TileId; scopeKey: string }): ReactNode {
  if (id === 'capabilities') return <CapabilityList />
  if (id === 'narrative') return <NarrativeSection scopeKey={scopeKey} />
  if (id === 'practice') return <ActivePracticeSection />
  return null
}

function CapabilityList() {
  return (
    <ul className="grid grid-cols-1 gap-x-6 gap-y-1.5 text-sm text-zinc-700 sm:grid-cols-2">
      <li className="flex items-start gap-2">
        <span aria-hidden className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#f2cc0d]" />
        <span>Read your week (time entries, schedule, check-ins, journal, goals) and write a plain-English narrative.</span>
      </li>
      <li className="flex items-start gap-2">
        <span aria-hidden className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#f2cc0d]" />
        <span>Surface 1-5 concrete suggestions from each narrative: observations, experiments, media to consume.</span>
      </li>
      <li className="flex items-start gap-2">
        <span aria-hidden className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#f2cc0d]" />
        <span>Remember the suggestions you accept and reference them by name in future narratives + chats.</span>
      </li>
      <li className="flex items-start gap-2">
        <span aria-hidden className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#f2cc0d]" />
        <span>Answer questions with citations from <em>your</em> data, never generic productivity advice.</span>
      </li>
      <li className="flex items-start gap-2">
        <span aria-hidden className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#f2cc0d]" />
        <span>Save any chat reply as a tracked reminder (Bookmark icon in the conversation).</span>
      </li>
      <li className="flex items-start gap-2">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
        <span>
          Runs on <span className="font-medium text-zinc-900">your</span> OpenAI/Anthropic key, AES-256-GCM encrypted at rest, never logged, removable from Settings, Integrations.
        </span>
      </li>
      <li className="flex items-start gap-2">
        <span aria-hidden className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#f2cc0d]" />
        <span>
          <span className="font-medium text-zinc-700">Propose edits to your data</span>: rename a goal, add a schedule block, log time. Approval card per change; nothing applies until you click.
        </span>
      </li>
    </ul>
  )
}
