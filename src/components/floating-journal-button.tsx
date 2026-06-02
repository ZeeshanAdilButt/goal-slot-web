'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowUpRight, BookOpen } from 'lucide-react'
import { toast } from 'react-hot-toast'

import { FeatherPenIcon } from '@/components/icons/feather-pen-icon'

import { coachApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Textarea } from '@/components/ui/textarea'

function todayKey(): string {
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function textToParagraphs(text: string): string {
  return text
    .trim()
    .split(/\n{2,}/)
    .map((para) => `<p>${escapeHtml(para).replace(/\n/g, '<br />')}</p>`)
    .join('')
}

/**
 * Floating "Journal" button. Shown on every dashboard page. Quick-jot popover
 * for capturing a thought without leaving the current page — the snippet is
 * appended (not overwritten) to today's journal entry. "Open journal" expands
 * to the full editor at /dashboard/journal.
 */
export function FloatingJournalButton() {
  const pathname = usePathname() ?? ''
  if (!pathname.startsWith('/dashboard')) return null
  return <FloatingJournalButtonInner />
}

function FloatingJournalButtonInner() {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')

  const appendMutation = useMutation({
    mutationFn: async (snippet: string) => {
      const date = todayKey()
      // Pull today's existing content (if any) so we append rather than
      // overwrite. coachApi.getJournalEntry 404s if there's no entry yet —
      // upsert below will create one in that case.
      let existing = ''
      try {
        const res = await coachApi.getJournalEntry(date)
        existing = res.data?.content ?? ''
      } catch {
        // No entry yet; that's fine.
      }
      const stamp = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
      const newHtml = `${existing}${existing ? '' : ''}<p><strong>${escapeHtml(
        stamp,
      )}</strong></p>${textToParagraphs(snippet)}`
      if (!existing) {
        await coachApi.upsertJournalEntry({ date, content: newHtml })
      } else {
        await coachApi.updateJournalContent(date, newHtml)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coach', 'journal', 'entries'] })
      toast.success('Saved to today’s journal.')
      setText('')
      setOpen(false)
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || err?.message || 'Could not save')
    },
  })

  const canSave = text.trim().length > 0 && !appendMutation.isPending

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          title="Quick journal"
          aria-label="Quick journal"
          className="group relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-zinc-900 bg-zinc-900 text-[#f2cc0d] shadow-lg transition-all hover:-translate-y-0.5 hover:bg-zinc-800"
        >
          <FeatherPenIcon className="h-5 w-5 origin-bottom-left [filter:drop-shadow(0_0_4px_rgba(242,204,13,0.85))_drop-shadow(0_0_10px_rgba(242,204,13,0.45))] motion-safe:animate-[pen-tilt_2.6s_ease-in-out_infinite]" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="end"
        sideOffset={10}
        className="w-[min(380px,calc(100vw-2rem))] border-zinc-200 p-0"
      >
        <div className="flex items-center justify-between gap-2 border-b border-zinc-100 px-3 py-2">
          <div className="flex items-center gap-2">
            <BookOpen className="h-3.5 w-3.5 text-[#8a7307]" />
            <span className="text-[12px] font-semibold text-zinc-900">Jot a thought</span>
          </div>
          <Link
            href="/dashboard/journal"
            onClick={() => setOpen(false)}
            className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold text-[#8a7307] transition-colors hover:bg-[#fff7d1]"
            title="Open the full journal editor"
          >
            Open journal
            <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="space-y-2 p-3">
          <Textarea
            autoFocus
            rows={5}
            placeholder="What's on your mind? It appends to today's journal."
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={appendMutation.isPending}
            className="resize-y text-sm leading-relaxed"
          />
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-zinc-500">Saves to today’s entry.</span>
            <Button
              type="button"
              variant="brand"
              size="sm"
              onClick={() => canSave && appendMutation.mutate(text)}
              disabled={!canSave}
            >
              {appendMutation.isPending ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
