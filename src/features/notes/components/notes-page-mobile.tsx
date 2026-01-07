'use client'

import { useEffect, useState } from 'react'

import { FileText, Menu, Plus, X } from 'lucide-react'

import { cn } from '@/lib/utils'

import { useCreateNoteMutation, useNotesQuery } from '../hooks/use-notes'
import { Note } from '../utils/types'
import { NoteEditor } from './note-editor'
import { NotesSidebar } from './notes-sidebar'

interface NotesPageMobileProps {
  initialNoteId?: string
}

export function NotesPageMobile({ initialNoteId }: NotesPageMobileProps = {}) {
  const { data: notes = [], isLoading } = useNotesQuery()
  const createMutation = useCreateNoteMutation()
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [hasInitialized, setHasInitialized] = useState(false)

  // Select note based on initialNoteId or first note
  useEffect(() => {
    if (!isLoading && notes.length > 0 && !hasInitialized) {
      if (initialNoteId) {
        const noteToSelect = notes.find((n) => n.id === initialNoteId)
        if (noteToSelect) {
          setSelectedNote(noteToSelect)
        } else {
          setSelectedNote(notes[0])
        }
      } else {
        setSelectedNote(notes[0])
      }
      setHasInitialized(true)
    }
  }, [notes, isLoading, initialNoteId, hasInitialized])

  const handleSelectNote = (note: Note) => {
    setSelectedNote(note)
    setIsSidebarOpen(false) // Close sidebar after selecting
  }

  const handleCreateNote = () => {
    createMutation.mutate(
      {
        title: 'Untitled',
        content: '[]',
      },
      {
        onSuccess: (newNote) => {
          setSelectedNote(newNote)
          setIsSidebarOpen(false)
        },
      },
    )
  }

  const handleDeleteNote = () => {
    if (notes.length > 1) {
      const remainingNotes = notes.filter((n) => n.id !== selectedNote?.id)
      setSelectedNote(remainingNotes[0] || null)
    } else {
      setSelectedNote(null)
    }
  }

  return (
    <div className="flex h-full flex-col overflow-hidden border-2 border-border bg-card">
      {/* Mobile Header with Menu and Create */}
      <div className="flex h-12 shrink-0 items-center justify-between border-b-2 border-border bg-muted/20 px-3">
        <div className="flex items-center gap-2">
          {/* Sidebar Toggle Button */}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="flex h-8 items-center gap-2 rounded-md px-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            <span className="text-xs font-medium">{isSidebarOpen ? 'Close' : 'Notes'}</span>
          </button>

          {/* Current Note Title */}
          {!isSidebarOpen && selectedNote && (
            <span className="truncate text-sm font-medium">{selectedNote.title || 'Untitled'}</span>
          )}
        </div>

        {/* Create Note Button */}
        <button
          onClick={handleCreateNote}
          disabled={createMutation.isPending}
          className="flex h-8 items-center gap-1.5 rounded-md px-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
        >
          {createMutation.isPending ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : (
            <>
              <Plus className="h-4 w-4" />
              <span className="text-xs font-medium">New</span>
            </>
          )}
        </button>
      </div>

      {/* Content area with sliding sidebar */}
      <div className="relative flex flex-1 overflow-hidden">
        {/* Sidebar - slides in from left */}
        <div
          className={cn(
            'absolute inset-y-0 left-0 z-10 flex w-[280px] flex-col border-r-2 border-border bg-background transition-transform duration-300',
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full',
          )}
        >
          <NotesSidebar selectedNoteId={selectedNote?.id || null} onSelectNote={handleSelectNote} className="h-full" />
        </div>

        {/* Main editor area */}
        <div className="flex-1 overflow-hidden">
          {selectedNote ? (
            <NoteEditor key={selectedNote.id} note={selectedNote} onDelete={handleDeleteNote} />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-border bg-muted">
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-bold">No note selected</h3>
                <p className="mt-1 text-sm text-muted-foreground">Tap the menu to select or create a note</p>
              </div>
              <button
                onClick={handleCreateNote}
                disabled={createMutation.isPending}
                className="mt-2 flex items-center gap-2 rounded-lg border-2 border-border bg-primary px-4 py-2 font-bold text-primary-foreground shadow-brutal transition-all hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none disabled:cursor-not-allowed disabled:opacity-50"
              >
                {createMutation.isPending ? (
                  <>
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="h-5 w-5" />
                    Create Note
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
