'use client'

import { useState } from 'react'

import { ChevronDown, Sparkles, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

/**
 * "Untangle a feeling" — small companion for the journal editor. Pitches
 * the user a single framing (a feeling is a question your mind is trying
 * to ask) and offers a set of starter prompts.
 *
 * UX:
 *   - Each prompt shows as a collapsed card with just the title.
 *   - Clicking the card EXPANDS it to reveal the full body and an
 *     "Insert at cursor" button — no accidental inserts, the user gets
 *     to read the full prompt first.
 *   - "Insert at cursor" drops the prompt into the journal at wherever
 *     the cursor was when the dialog opened (Tiptap's selection is
 *     preserved even when DOM focus moves to the dialog).
 *
 * Prompts are written in universal, secular language but each anchors
 * in a classical Islamic principle (niyyah, sabr, shukr, tawakkul,
 * qadar, muhasabah, tawba, rida, ihsan, dhikr) — bookkeeping, not UI.
 */

type UntanglePrompt = {
  id: string
  title: string
  body: string
  /** Internal-only anchor. Not rendered. */
  principle: string
}

const PROMPTS: UntanglePrompt[] = [
  {
    id: 'name-it',
    title: 'Name the feeling out loud',
    body:
      "Write what you're actually feeling in one or two words — not the story around it, just the feeling. Then ask: what question is this feeling trying to make me answer?",
    principle: 'muhasabah (self-accountability)',
  },
  {
    id: 'in-out',
    title: 'Inside your control, outside your control',
    body:
      'Draw two columns. On the left, list what about this is up to you. On the right, what isn’t. Cross out the right column and look only at the left.',
    principle: 'qadar + tawakkul',
  },
  {
    id: 'real-intention',
    title: 'What was I actually trying to do?',
    body:
      "Forget the outcome for a minute. What was the intention going in? If you could rewind, would you keep it? If yes, the result doesn't define the action. If no, that's the lesson.",
    principle: 'niyyah (intention)',
  },
  {
    id: 'sit-with-it',
    title: "Don't fix it. Sit with it.",
    body:
      "Resist the urge to solve this right now. Describe the feeling like you'd describe weather — without judgement. What does it want you to notice? Three sentences.",
    principle: 'sabr (patient endurance)',
  },
  {
    id: 'friend-mirror',
    title: 'If a friend told you this, what would you say back?',
    body:
      'Write it out in their voice, telling you their version. Then write your reply. Read it back to yourself slowly.',
    principle: 'muhasabah + rahma',
  },
  {
    id: 'tiny-quiet-thing',
    title: "Three quiet things that are still working",
    body:
      "List three things that didn't go wrong today — small ones count. The roof. A hot drink. Someone who text back. Notice what would be missed if it stopped.",
    principle: 'shukr (gratitude)',
  },
  {
    id: 'one-step',
    title: 'One small adjustment for tomorrow',
    body:
      "Not a new self. Not a plan. One small adjustment. What's the next 1% — the kind of change that's still you, just slightly aimed?",
    principle: 'tawba (returning) + ihsan',
  },
  {
    id: 'enough-as-is',
    title: 'What if this is exactly what was supposed to happen?',
    body:
      "Sit with the possibility — without arguing with it — that the moment you're in is the one you were meant to be in. What does it shift, if you let that be true for a minute?",
    principle: 'rida (contentment with what is)',
  },
  {
    id: 'remember-when',
    title: 'A time things felt like this and then changed',
    body:
      "Find a memory where the feeling you have now showed up before — and then passed. Write what eventually shifted. Feelings are weather, not climate.",
    principle: 'sabr + dhikr (remembering)',
  },
  {
    id: 'someone-quiet',
    title: "Who's helping that you haven't thanked?",
    body:
      "Name one person whose small steady presence you've been quietly relying on. What would you write to them if you weren't going to send it?",
    principle: 'shukr + ihsan',
  },
]

/**
 * Render a prompt as plain editor-safe HTML. Uses only paragraphs +
 * inline emphasis so the journal editor's default typography handles
 * it cleanly — earlier versions used h3 + blockquote which collided
 * with the editor's heading/quote spacing and pushed surrounding
 * content out of view.
 */
function promptToHtml(p: UntanglePrompt): string {
  const safeTitle = p.title.replace(/</g, '&lt;')
  const safeBody = p.body.replace(/</g, '&lt;')
  return (
    `<p><strong>${safeTitle}</strong></p>` +
    `<p><em>${safeBody}</em></p>` +
    `<p></p>`
  )
}

interface JournalUntangleProps {
  onInsertPrompt: (html: string) => void
}

export function JournalUntangle({ onInsertPrompt }: JournalUntangleProps) {
  const [open, setOpen] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const handleInsert = (p: UntanglePrompt) => {
    onInsertPrompt(promptToHtml(p))
    setOpen(false)
    setExpandedId(null)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white/80 px-2.5 py-1 text-[11px] font-medium text-zinc-600 transition-all hover:border-[#f2cc0d]/60 hover:bg-[#fffbea] hover:text-zinc-900 hover:shadow-sm"
        title="Examples for untangling a feeling"
      >
        <Sparkles className="h-3 w-3 text-[#8a7307]" />
        <span>Untangle a feeling</span>
        <span aria-hidden className="text-zinc-300 group-hover:text-zinc-400">·</span>
        <span className="hidden text-[10.5px] text-zinc-500 group-hover:text-zinc-700 sm:inline">
          examples
        </span>
      </button>

      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next)
          if (!next) setExpandedId(null)
        }}
      >
        <DialogContent className="max-h-[88vh] w-[95vw] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg">
              A feeling is a question your mind is trying to ask
            </DialogTitle>
            <DialogDescription className="text-sm leading-relaxed text-zinc-600">
              Click a prompt to read it. If it fits, hit{' '}
              <span className="font-semibold text-zinc-700">Insert at cursor</span>{' '}
              and it'll drop into your entry exactly where you were typing.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-2 flex flex-col gap-2">
            {PROMPTS.map((p) => {
              const isExpanded = expandedId === p.id
              return (
                <div
                  key={p.id}
                  className={cn(
                    'overflow-hidden rounded-lg border transition-all',
                    isExpanded
                      ? 'border-[#f2cc0d] bg-[#fffbea] shadow-sm'
                      : 'border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50',
                  )}
                >
                  <button
                    type="button"
                    onClick={() => setExpandedId(isExpanded ? null : p.id)}
                    aria-expanded={isExpanded}
                    className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left"
                  >
                    <span className="flex-1 text-[13px] font-semibold leading-snug text-zinc-900">
                      {p.title}
                    </span>
                    <ChevronDown
                      className={cn(
                        'h-4 w-4 shrink-0 text-zinc-400 transition-transform',
                        isExpanded && 'rotate-180 text-[#8a7307]',
                      )}
                    />
                  </button>

                  {isExpanded && (
                    <div className="flex flex-col gap-3 border-t border-[#f2cc0d]/40 bg-white/60 px-3 py-3">
                      <p className="text-[12.5px] leading-relaxed text-zinc-700">
                        {p.body}
                      </p>
                      <div className="flex justify-end">
                        <Button
                          type="button"
                          variant="brand"
                          size="sm"
                          onClick={() => handleInsert(p)}
                        >
                          Insert at cursor
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <p className="mt-3 text-[11px] leading-relaxed text-zinc-500">
            None of these prompts are wrong answers. Drop one in, write
            until it stops talking, close the tab. Come back tomorrow.
          </p>

          <div className="mt-3 flex justify-end">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => {
                setOpen(false)
                setExpandedId(null)
              }}
            >
              <X className="h-3.5 w-3.5" />
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
