'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'

import { useNotesSelection } from '@/features/notes/hooks/use-notes-selection'
import { FileText, PanelLeft, PanelLeftClose, Plus, X } from 'lucide-react'

import { useIsMobile } from '@/hooks/use-mobile'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Loading } from '@/components/ui/loading'

import { NoteEditor } from './note-editor'
import { NotesSidebar } from './notes-sidebar'

interface NotesPageProps {
  initialNoteId?: string
}

const SIDEBAR_MIN = 240
const SIDEBAR_MAX = 420
const SIDEBAR_DEFAULT = 288

/**
 * Single responsive Notes shell.
 * - Desktop (md+): persistent resizable sidebar on the left, editor on the right.
 *   Sidebar collapses to zero width via the chrome toggle.
 * - Mobile (<md): sidebar is a slide-in overlay over the editor; opening a note
 *   auto-closes it.
 */
export function NotesPage({ initialNoteId }: NotesPageProps = {}) {
  const isMobile = useIsMobile()
  const { selectedNote, selectNote, createNote, isCreating, deleteSelectedNote } = useNotesSelection({ initialNoteId })

  const [sidebarWidth, setSidebarWidth] = useState(SIDEBAR_DEFAULT)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

  // Auto-close the mobile sheet when a note is selected
  useEffect(() => {
    if (isMobile && isMobileSidebarOpen && selectedNote) setIsMobileSidebarOpen(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedNote?.id])

  // Auto-create a new note when arriving with ?action=new (from the persistent
  // header "+ Note" shortcut). Fires once per param, then strips the param so
  // refreshing the page doesn't keep spawning notes.
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const handledActionRef = useRef(false)
  useEffect(() => {
    if (handledActionRef.current) return
    if (searchParams?.get('action') !== 'new') return
    handledActionRef.current = true
    createNote()
    // Strip the param so the user can refresh without spawning more notes.
    const params = new URLSearchParams(searchParams.toString())
    params.delete('action')
    const next = params.toString()
    router.replace(next ? `${pathname}?${next}` : pathname)
  }, [createNote, pathname, router, searchParams])

  const handleSelectNote = (note: Parameters<typeof selectNote>[0]) => {
    selectNote(note)
  }

  const handleStartResize = (e: React.MouseEvent) => {
    e.preventDefault()
    const startX = e.clientX
    const startWidth = sidebarWidth

    const onMove = (event: MouseEvent) => {
      const next = Math.min(Math.max(SIDEBAR_MIN, startWidth + (event.clientX - startX)), SIDEBAR_MAX)
      setSidebarWidth(next)
    }
    const onUp = () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-zinc-200 bg-white">
      {/* Chrome row (toolbar), adapts to mobile/desktop */}
      <div className="flex h-12 shrink-0 items-center justify-between border-b border-zinc-200 bg-white px-2 sm:h-10">
        <div className="flex min-w-0 items-center gap-2">
          {isMobile ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileSidebarOpen((o) => !o)}
              aria-label={isMobileSidebarOpen ? 'Close notes list' : 'Open notes list'}
            >
              {isMobileSidebarOpen ? <X className="h-4 w-4" /> : <PanelLeft className="h-4 w-4" />}
              <span className="text-xs">{isMobileSidebarOpen ? 'Close' : 'Notes'}</span>
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsSidebarCollapsed((c) => !c)}
              aria-label={isSidebarCollapsed ? 'Show sidebar' : 'Hide sidebar'}
            >
              {isSidebarCollapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
              <span className="text-xs">{isSidebarCollapsed ? 'Show notes' : 'Hide sidebar'}</span>
            </Button>
          )}
          {isMobile && !isMobileSidebarOpen && selectedNote && (
            <span className="truncate text-sm font-medium text-zinc-700">
              {selectedNote.title || 'Untitled'}
            </span>
          )}
        </div>

        <Button variant="ghost" size="sm" onClick={createNote} disabled={isCreating}>
          {isCreating ? <Loading size="sm" /> : <Plus className="h-4 w-4" />}
          <span className="text-xs">{isCreating ? 'Creating...' : 'New note'}</span>
        </Button>
      </div>

      {/* Body */}
      <div className="relative flex flex-1 overflow-hidden">
        {isMobile ? (
          <>
            {/* Slide-over sidebar */}
            <div
              className={cn(
                'absolute inset-y-0 left-0 z-20 flex w-[min(85vw,320px)] flex-col border-r border-zinc-200 bg-white transition-transform duration-200',
                isMobileSidebarOpen ? 'translate-x-0 shadow-xl' : '-translate-x-full',
              )}
            >
              <NotesSidebar
                selectedNoteId={selectedNote?.id ?? null}
                onSelectNote={handleSelectNote}
                className="h-full"
              />
            </div>
            {/* Tap-out scrim */}
            {isMobileSidebarOpen && (
              <button
                aria-label="Close sidebar"
                onClick={() => setIsMobileSidebarOpen(false)}
                className="absolute inset-0 z-10 bg-zinc-950/30 backdrop-blur-[2px]"
              />
            )}
          </>
        ) : (
          <>
            <div
              className={cn(
                'shrink-0 border-r border-zinc-200 bg-white transition-[width] duration-200',
                isSidebarCollapsed && 'overflow-hidden border-r-0',
              )}
              style={{ width: isSidebarCollapsed ? 0 : sidebarWidth }}
            >
              <NotesSidebar
                selectedNoteId={selectedNote?.id ?? null}
                onSelectNote={handleSelectNote}
                className="h-full"
              />
            </div>
            {!isSidebarCollapsed && (
              <div
                role="separator"
                aria-orientation="vertical"
                onMouseDown={handleStartResize}
                className="group relative w-1 cursor-col-resize bg-transparent transition-colors hover:bg-[#f2cc0d]/30"
              >
                <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-zinc-200 transition-colors group-hover:bg-[#f2cc0d]" />
              </div>
            )}
          </>
        )}

        {/* Editor */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {selectedNote ? (
            <NoteEditor key={selectedNote.id} note={selectedNote} onDelete={deleteSelectedNote} />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-4 px-4 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-zinc-200 bg-zinc-50">
                <FileText className="h-10 w-10 text-zinc-400" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-zinc-900">No note selected</h3>
                <p className="mt-1 text-sm text-zinc-500">
                  {isMobile ? 'Tap the menu to pick a note or create a new one.' : 'Pick a note from the sidebar or create a new one.'}
                </p>
              </div>
              <Button variant="brand" onClick={createNote} disabled={isCreating}>
                {isCreating ? <Loading size="sm" /> : <Plus className="h-4 w-4" />}
                {isCreating ? 'Creating...' : 'Create note'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
