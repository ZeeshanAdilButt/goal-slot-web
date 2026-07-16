'use client'

import { Sparkles, Sparkle, Wrench } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

export interface ChangelogEntry {
  date: string // YYYY-MM-DD
  title: string
  body: string
  tag: 'feature' | 'fix' | 'polish'
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    date: '2026-06-02',
    title: 'Journal Prompts Untangled',
    body: 'You can now write and reflect in your journal with complete freedom. We simplified the prompts layout so it quietly guides your reflection rather than crowding your workspace. Tilt your phone or desktop sidebar to see the brand-new glowing journal pen nudging you to write.',
    tag: 'polish',
  },
  {
    date: '2026-06-01',
    title: 'Free Gemini Tier Trial',
    body: 'We introduced a built-in shared trial tier for Google Gemini Flash! Now you can chat with the Coach for up to 20 messages per day without bringing your own API keys. It resets automatically every day at midnight UTC.',
    tag: 'feature',
  },
  {
    date: '2026-05-28',
    title: 'Introducing the Command Palette',
    body: 'Press Cmd+K or Ctrl+K anywhere in GoalSlot to launch our supercharged search drawer. Instantly search across your active tasks, open goals, quick action timers, and administrative screens without lifting your hands off the keyboard.',
    tag: 'feature',
  },
  {
    date: '2026-05-20',
    title: 'Task Timer Synchronization',
    body: 'Fixed a bug where starting or stopping a timer in one tab would occasionally cause temporary state desynchronization in other active windows. Your tracking is now perfectly synchronized in real time.',
    tag: 'fix',
  },
]

interface ChangelogModalProps {
  isOpen: boolean
  onClose: () => void
  lastSeenChangelogAt?: string | null
}

const TAG_STYLES = {
  feature: {
    bg: 'bg-amber-50 border-amber-200/60 text-[#8a7307]',
    icon: Sparkles,
    label: 'Feature',
  },
  fix: {
    bg: 'bg-blue-50 border-blue-200/60 text-blue-700',
    icon: Wrench,
    label: 'Fix',
  },
  polish: {
    bg: 'bg-emerald-50 border-emerald-200/60 text-emerald-700',
    icon: Sparkle,
    label: 'Polish',
  },
}

function formatDate(dateStr: string): string {
  try {
    const [year, month, day] = dateStr.split('-').map(Number)
    const date = new Date(year, month - 1, day)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return dateStr
  }
}

export function ChangelogModal({ isOpen, onClose, lastSeenChangelogAt }: ChangelogModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex max-h-[85vh] flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white/95 p-0 shadow-2xl backdrop-blur-md sm:max-w-xl">
        <DialogHeader className="shrink-0 border-b border-zinc-100 px-6 pb-4 pt-6">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#f2cc0d]/30 bg-[#fffbea] text-[#8a7307]">
              <Sparkles className="h-4 w-4 animate-pulse" />
            </span>
            <DialogTitle className="text-xl font-bold tracking-tight text-zinc-900">
              What&apos;s New in GoalSlot
            </DialogTitle>
          </div>
          <DialogDescription className="mt-1 text-xs text-zinc-500">
            Discover the latest features, improvements, and fixes we shipped to boost your productivity.
          </DialogDescription>
        </DialogHeader>

        {/* Scrollable Container with elegant vertical flow */}
        <div className="scrollbar-thin max-h-[60vh] flex-1 space-y-4 overflow-y-auto px-6 py-4">
          {CHANGELOG.map((entry) => {
            // An entry is "new" if the user has never seen it or if its date is after lastSeenChangelogAt.
            const isNew = !lastSeenChangelogAt || entry.date > lastSeenChangelogAt
            const tagStyle = TAG_STYLES[entry.tag]
            const TagIcon = tagStyle.icon

            return (
              <div
                key={entry.date}
                className={cn(
                  'group relative rounded-xl border p-4 transition-all duration-300',
                  isNew
                    ? 'bg-amber-50/25 border-[#f2cc0d]/30 hover:border-[#f2cc0d]/50 hover:bg-amber-50/40 shadow-[0_0_12px_rgba(242,204,13,0.03)]'
                    : 'bg-zinc-50/30 border-zinc-200/70 hover:border-zinc-300 hover:bg-zinc-50/75',
                )}
              >
                {/* Visual New Glow Strip */}
                {isNew && (
                  <div className="absolute bottom-0 left-0 top-0 w-[3px] rounded-l-xl bg-[#f2cc0d] [filter:drop-shadow(0_0_4px_rgba(242,204,13,0.8))]" />
                )}

                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border',
                        tagStyle.bg,
                      )}
                    >
                      <TagIcon className="h-2.5 w-2.5 shrink-0" />
                      {tagStyle.label}
                    </span>
                    {isNew && (
                      <span className="inline-flex h-1.5 w-1.5 animate-ping rounded-full bg-[#f2cc0d]" />
                    )}
                  </div>
                  <time className="text-[11px] font-medium text-zinc-400 transition-colors group-hover:text-zinc-500">
                    {formatDate(entry.date)}
                  </time>
                </div>

                <h3
                  className={cn(
                    'text-sm font-bold tracking-tight mb-1.5 transition-colors',
                    isNew ? 'text-[#8a7307]' : 'text-zinc-800 group-hover:text-zinc-900',
                  )}
                >
                  {entry.title}
                </h3>
                <p className="text-xs leading-relaxed text-zinc-600 transition-colors group-hover:text-zinc-700">
                  {entry.body}
                </p>
              </div>
            )
          })}
        </div>

        {/* Premium footer */}
        <div className="flex shrink-0 items-center justify-between border-t border-zinc-100 bg-zinc-50/80 px-6 py-4">
          <span className="text-[10px] font-medium text-zinc-400">
            GoalSlot is updated constantly. Keep growing!
          </span>
          <button
            onClick={onClose}
            className="rounded-lg bg-zinc-900 px-4 py-1.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-[#f2cc0d] focus:ring-offset-2"
          >
            Awesome, thanks!
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
