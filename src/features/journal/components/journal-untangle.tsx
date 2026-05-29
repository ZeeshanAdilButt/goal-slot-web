'use client'

import { useState } from 'react'

import { Sparkles, X } from 'lucide-react'

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
 * to ask) and offers a set of starter prompts they can drop into today's
 * entry with a click.
 *
 * The prompts are deliberately written in universal, secular language so
 * that anyone can use them — but each one is anchored in a classical
 * Islamic principle (tawakkul, sabr, niyyah, shukr, muhasabah, qadar,
 * tawba, rida, ihsan, dhikr) that the user doesn't have to know about
 * to benefit from. The internal `principle` field is for our own
 * bookkeeping; only `title` and `body` reach the UI.
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

function promptToHtml(p: UntanglePrompt): string {
  // Insert as a heading with the prompt title + a blockquote with the
  // body + an empty paragraph for the user to start writing in. The
  // empty paragraph at the end is critical — without it the cursor
  // lands inside the blockquote and the user types into the prompt
  // text itself.
  const safeTitle = p.title.replace(/</g, '&lt;')
  const safeBody = p.body.replace(/</g, '&lt;')
  return `<h3>${safeTitle}</h3><blockquote><p><em>${safeBody}</em></p></blockquote><p></p>`
}

interface JournalUntangleProps {
  onInsertPrompt: (html: string) => void
}

export function JournalUntangle({ onInsertPrompt }: JournalUntangleProps) {
  const [open, setOpen] = useState(false)
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  const handlePick = (p: UntanglePrompt) => {
    onInsertPrompt(promptToHtml(p))
    setOpen(false)
  }

  return (
    <>
      {/* Inline tip above the editor. Whispers the framing without
          taking up much vertical space. Clicking opens the prompts
          dialog. The "Untangle" label is the primary affordance. */}
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[88vh] w-[95vw] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg">
              A feeling is a question your mind is trying to ask
            </DialogTitle>
            <DialogDescription className="text-sm leading-relaxed text-zinc-600">
              When something tangles inside, the way out usually isn’t to
              push it down — it’s to untangle it by turning it into a
              question you can actually sit with and answer. Pick a
              starting prompt; it’ll drop straight into today’s entry.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {PROMPTS.map((p) => {
              const isHovered = hoveredId === p.id
              return (
                <button
                  key={p.id}
                  type="button"
                  onMouseEnter={() => setHoveredId(p.id)}
                  onMouseLeave={() => setHoveredId((cur) => (cur === p.id ? null : cur))}
                  onClick={() => handlePick(p)}
                  className={cn(
                    'group flex flex-col gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-left transition-all hover:border-[#f2cc0d] hover:bg-[#fffbea] hover:shadow-sm',
                    isHovered && 'border-[#f2cc0d] bg-[#fffbea]',
                  )}
                >
                  <span className="text-[13px] font-semibold leading-snug text-zinc-900">
                    {p.title}
                  </span>
                  <span className="text-[11.5px] leading-snug text-zinc-600">
                    {p.body}
                  </span>
                  <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-[#8a7307] opacity-0 transition-opacity group-hover:opacity-100">
                    Insert into today's entry →
                  </span>
                </button>
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
              onClick={() => setOpen(false)}
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
