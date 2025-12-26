'use client'

import { useState, useEffect } from 'react'

import { FileText, Plus, PanelLeftClose, PanelLeft } from 'lucide-react'

import { Note } from '../utils/types'
import { useNotesQuery, useCreateNoteMutation } from '../hooks/use-notes'
import { NotesSidebar } from './notes-sidebar'
import { NoteEditor } from './note-editor'

import { cn } from '@/lib/utils'

interface NotesPageProps {
  initialNoteId?: string
}

export function NotesPage({ initialNoteId }: NotesPageProps = {}) {
  const { data: notes = [], isLoading } = useNotesQuery()
  const createMutation = useCreateNoteMutation()
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [sidebarWidth, setSidebarWidth] = useState(280)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
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
        },
      }
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
    <div className="flex h-full overflow-hidden rounded-lg border-2 border-border bg-card">
      {/* Sidebar */}
      <div
        className={cn(
          'shrink-0 border-r-2 border-border bg-muted/30 transition-all duration-300',
          isSidebarCollapsed ? 'w-0 overflow-hidden border-r-0' : ''
        )}
        style={{ width: isSidebarCollapsed ? 0 : sidebarWidth }}
      >
        <NotesSidebar
          selectedNoteId={selectedNote?.id || null}
          onSelectNote={handleSelectNote}
          className="h-full"
        />
      </div>

      {/* Resize handle - only show when sidebar is expanded */}
      {!isSidebarCollapsed && (
        <div
          className="group relative w-1 cursor-col-resize bg-transparent hover:bg-primary/20"
          onMouseDown={(e) => {
            e.preventDefault()
            const startX = e.clientX
            const startWidth = sidebarWidth

            const handleMouseMove = (e: MouseEvent) => {
              const diff = e.clientX - startX
              const newWidth = Math.min(Math.max(200, startWidth + diff), 400)
              setSidebarWidth(newWidth)
            }

            const handleMouseUp = () => {
              document.removeEventListener('mousemove', handleMouseMove)
              document.removeEventListener('mouseup', handleMouseUp)
            }

            document.addEventListener('mousemove', handleMouseMove)
            document.addEventListener('mouseup', handleMouseUp)
          }}
        >
          <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-border group-hover:bg-primary" />
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Collapse toggle button bar */}
        <div className="flex h-10 shrink-0 items-center border-b border-border/50 bg-muted/20 px-2">
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className={cn(
              'flex h-7 items-center gap-1.5 rounded-md px-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
            )}
            title={isSidebarCollapsed ? 'Show sidebar' : 'Hide sidebar'}
          >
            {isSidebarCollapsed ? (
              <>
                <PanelLeft className="h-4 w-4" />
                <span className="text-xs">Show Notes</span>
              </>
            ) : (
              <>
                <PanelLeftClose className="h-4 w-4" />
                <span className="text-xs">Hide Sidebar</span>
              </>
            )}
          </button>
          
          {/* Quick create when sidebar is collapsed */}
          {isSidebarCollapsed && (
            <button
              onClick={handleCreateNote}
              className="ml-auto flex h-7 items-center gap-1.5 rounded-md px-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <Plus className="h-4 w-4" />
              <span className="text-xs">New Note</span>
            </button>
          )}
        </div>

        {/* Editor area */}
        <div className="flex-1 overflow-hidden">
          {selectedNote ? (
            <NoteEditor
              key={selectedNote.id}
              note={selectedNote}
              onDelete={handleDeleteNote}
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl border-2 border-border bg-muted">
                <FileText className="h-10 w-10 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-xl font-bold">No note selected</h3>
                <p className="mt-1 text-muted-foreground">
                  Select a note from the sidebar or create a new one
                </p>
              </div>
              <button
                onClick={handleCreateNote}
                className="mt-4 flex items-center gap-2 rounded-lg border-2 border-border bg-primary px-4 py-2 font-bold text-primary-foreground shadow-brutal transition-all hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none"
              >
                <Plus className="h-5 w-5" />
                Create Note
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
