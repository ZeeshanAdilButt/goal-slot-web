'use client'

/**
 * Dev-only playground for the notes tree drag-and-drop.
 *
 * Mounts the REAL NotesSidebar against an in-memory notes store by
 * swapping the axios adapter, so the full optimistic mutation flow
 * (drag → optimistic cache write → "server" write → refetch) runs
 * without auth or a backend. Visit /dev/notes-dnd with `npm run dev`.
 * Production builds 404 this route.
 */

import { notFound } from 'next/navigation'
import { useMemo, useState } from 'react'

import type { AxiosAdapter, InternalAxiosRequestConfig } from 'axios'
import { useQueryClient } from '@tanstack/react-query'

import { api } from '@/lib/api'
import { NotesSidebar } from '@/features/notes'
import type { Note } from '@/features/notes/utils/types'

const now = new Date()

let seq = 0
const mk = (id: string, title: string, parentId: string | null, order: number, extra?: Partial<Note>): Note => ({
  id,
  title,
  content: `<p>${title} body</p>`,
  parentId,
  order,
  isExpanded: true,
  isFavorite: false,
  createdAt: now,
  updatedAt: now,
  userId: 'dev-user',
  ...extra,
})

const store: { notes: Note[] } = {
  notes: [
    mk('n1', 'Projects', null, 1000, { icon: '🚀' }),
    mk('n1a', 'GoalSlot', 'n1', 1000),
    mk('n1a1', 'API roadmap', 'n1a', 1000),
    mk('n1a2', 'Web polish', 'n1a', 2000),
    mk('n1b', 'Side quests', 'n1', 2000),
    mk('n2', 'Reading list', null, 2000, { icon: '📚', isFavorite: true }),
    mk('n2a', 'Deep Work', 'n2', 1000),
    mk('n2b', 'The Mom Test', 'n2', 2000),
    mk('n3', 'Meeting notes', null, 3000),
    mk('n3a', 'Weekly sync', 'n3', 1000),
    mk('n3a1', 'Action items', 'n3a', 1000),
    mk('n4', 'Scratchpad', null, 4000),
    mk('n5', 'Travel plans', null, 5000, { icon: '✈️' }),
    mk('n6', 'Archive', null, 6000),
  ],
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

const respond = (config: InternalAxiosRequestConfig, data: unknown, status = 200) => ({
  data,
  status,
  statusText: 'OK',
  headers: {},
  config,
})

const devAdapter: AxiosAdapter = async (config) => {
  await delay(120)
  const url = (config.url ?? '').replace(/\/+$/, '')
  const method = (config.method ?? 'get').toLowerCase()
  const body = typeof config.data === 'string' && config.data ? JSON.parse(config.data) : config.data

  if (url === '/notes' && method === 'get') {
    return respond(config, [...store.notes])
  }
  if (url === '/notes/shared-with-me' && method === 'get') {
    return respond(config, [])
  }
  if (url === '/notes/reorder' && method === 'put') {
    const items = body as { noteId: string; parentId: string | null; order: number }[]
    for (const item of items) {
      const note = store.notes.find((n) => n.id === item.noteId)
      if (note) {
        note.parentId = item.parentId
        note.order = item.order
        note.updatedAt = new Date()
      }
    }
    return respond(config, { success: true })
  }
  if (url === '/notes' && method === 'post') {
    const note = mk(body.id ?? `dev-${++seq}`, body.title ?? 'Untitled', body.parentId ?? null, Date.now())
    note.content = body.content ?? ''
    store.notes.push(note)
    return respond(config, note, 201)
  }
  const idMatch = url.match(/^\/notes\/([^/]+)$/)
  if (idMatch && method === 'put') {
    const note = store.notes.find((n) => n.id === idMatch[1])
    if (!note) return respond(config, { message: 'Not found' }, 404)
    Object.assign(note, body.data ?? body, { updatedAt: new Date() })
    return respond(config, note)
  }
  if (idMatch && method === 'delete') {
    const removeIds = new Set([idMatch[1]])
    // Cascade like the server does.
    let grew = true
    while (grew) {
      grew = false
      for (const n of store.notes) {
        if (n.parentId && removeIds.has(n.parentId) && !removeIds.has(n.id)) {
          removeIds.add(n.id)
          grew = true
        }
      }
    }
    store.notes = store.notes.filter((n) => !removeIds.has(n.id))
    return respond(config, { success: true })
  }
  if (idMatch && method === 'get') {
    const note = store.notes.find((n) => n.id === idMatch[1])
    if (!note) return respond(config, { message: 'Not found' }, 404)
    return respond(config, { note, readOnly: false })
  }

  // Anything else (notifications, release notes, …) isn't part of the
  // playground — answer with an empty 200 so unrelated providers stay
  // quiet instead of error-looping.
  return respond(config, Array.isArray(body) ? [] : {})
}

export default function NotesDndPlayground() {
  if (process.env.NODE_ENV !== 'development') {
    notFound()
  }

  return <Playground />
}

function Playground() {
  const queryClient = useQueryClient()
  const [selected, setSelected] = useState<Note | null>(null)

  useMemo(() => {
    // This runs during render, so in dev it also runs on the server, where
    // window and localStorage do not exist and it threw a 500 on every
    // load. Production never reaches this line because NotesDndPlayground
    // calls notFound() first. Everything below is client-only.
    if (typeof window === 'undefined') return
    api.defaults.adapter = devAdapter
    // Purge the offline outbox — queued mutations from real (or
    // earlier playground) sessions replay against whatever adapter is
    // installed and silently mutate the fixture store mid-test. This
    // was the source of "notes teleporting" during manual testing.
    localStorage.removeItem('goalslot-offline-outbox')
    // Drop anything the persisted cache restored so the fixtures win.
    queryClient.removeQueries({ queryKey: ['notes'] })
    // Debug handles for driving/inspecting from the console.
    ;(window as unknown as Record<string, unknown>).__notesDnd = { store, queryClient }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="flex h-screen bg-background text-foreground">
      <div className="w-[320px] shrink-0 border-r border-zinc-200">
        <NotesSidebar
          selectedNoteId={selected?.id ?? null}
          onSelectNote={(n) => setSelected(n)}
        />
      </div>
      <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
        {selected ? `Selected: ${selected.title}` : 'Drag rows in the sidebar. Drag right/left while dragging to nest/un-nest.'}
      </div>
    </div>
  )
}
