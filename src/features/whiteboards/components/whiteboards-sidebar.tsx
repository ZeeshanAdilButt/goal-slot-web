'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { MoreHorizontal, Plus, Search, Trash2 } from 'lucide-react'

import { ConfirmDialog } from '@/components/confirm-dialog'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { Loading } from '@/components/ui/loading'

import {
  useCreateWhiteboardMutation,
  useDeleteWhiteboardMutation,
  useUpdateWhiteboardMutation,
  useWhiteboardsQuery,
} from '../hooks/use-whiteboards'
import type { Whiteboard } from '../types'

interface WhiteboardsSidebarProps {
  selectedWhiteboardId: string | null
  onSelectWhiteboard: (whiteboard: Whiteboard) => void
  /** Called when the currently selected whiteboard was deleted. */
  onAfterDeleteSelected?: () => void
  className?: string
  /** When set, focus title input for this id (e.g. after create). */
  focusTitleId?: string | null
}

export function WhiteboardsSidebar({
  selectedWhiteboardId,
  onSelectWhiteboard,
  onAfterDeleteSelected,
  className,
  focusTitleId,
}: WhiteboardsSidebarProps) {
  const { data: whiteboards = [], isLoading } = useWhiteboardsQuery()
  const createMutation = useCreateWhiteboardMutation()
  const updateMutation = useUpdateWhiteboardMutation()
  const deleteMutation = useDeleteWhiteboardMutation()
  const [searchQuery, setSearchQuery] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null)
  const [deleteConfirmWhiteboardId, setDeleteConfirmWhiteboardId] = useState<string | null>(null)
  const titleInputRef = useRef<HTMLInputElement>(null)

  const filtered = whiteboards.filter((w) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return w.title.toLowerCase().includes(q)
  })

  useEffect(() => {
    if (focusTitleId && focusTitleId === selectedWhiteboardId) {
      const wb = whiteboards.find((w) => w.id === focusTitleId)
      if (wb) {
        setEditingId(focusTitleId)
        setEditTitle(wb.title || 'Untitled')
      }
    }
  }, [focusTitleId, selectedWhiteboardId, whiteboards])

  useEffect(() => {
    if (editingId && titleInputRef.current) {
      titleInputRef.current.focus()
      titleInputRef.current.select()
    }
  }, [editingId])

  const handleCreate = () => {
    createMutation.mutate(
      { title: 'Untitled' },
      { onSuccess: (wb) => onSelectWhiteboard(wb) },
    )
  }

  const commitTitle = useCallback(
    (id: string, title: string) => {
      const trimmed = title.trim() || 'Untitled'
      updateMutation.mutate({ id, data: { title: trimmed } })
      setEditingId(null)
    },
    [updateMutation],
  )

  const startEdit = (wb: Whiteboard, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingId(wb.id)
    setEditTitle(wb.title || 'Untitled')
  }

  const handleDeleteWhiteboard = (whiteboardId: string) => {
    setDeleteConfirmWhiteboardId(whiteboardId)
    setMenuOpenId(null)
  }

  const confirmDeleteWhiteboard = () => {
    if (!deleteConfirmWhiteboardId) return
    const targetId = deleteConfirmWhiteboardId
    const target = whiteboards.find((w) => w.id === targetId)
    if (!target) {
      setDeleteConfirmWhiteboardId(null)
      return
    }

    deleteMutation.mutate(targetId, {
      onSuccess: () => {
        if (selectedWhiteboardId === targetId) {
          const remaining = whiteboards.filter((w) => w.id !== targetId)
          const next = remaining[0]
          if (next) {
            onSelectWhiteboard(next)
          } else {
            onAfterDeleteSelected?.()
          }
        }
      },
    })
    setDeleteConfirmWhiteboardId(null)
  }

  if (isLoading) {
    return (
      <div className={cn('flex h-full flex-col', className)}>
        <div className="flex items-center justify-center py-8">
          <Loading size="sm" />
        </div>
      </div>
    )
  }

  return (
    <div className={cn('flex h-full flex-col', className)}>
      <div className="border-b border-zinc-200 px-3 py-2">
        <h2 className="text-sm font-semibold text-zinc-900">Whiteboards</h2>
      </div>

      <div className="p-3">
        <button
          type="button"
          onClick={handleCreate}
          className="flex w-full items-center justify-center gap-2 rounded-md border-2 border-dashed border-border px-3 py-2 text-sm text-muted-foreground transition-colors hover:border-primary hover:bg-muted hover:text-foreground"
        >
          <Plus className="h-4 w-4" />
          New Whiteboard
        </button>
      </div>

      <div className="px-3 pb-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search whiteboards..."
            className="w-full rounded-md border border-zinc-200 bg-background py-1.5 pl-9 pr-3 text-sm outline-none focus:border-primary"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-2">
        <div className="mb-1 px-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          My whiteboards
        </div>
        {filtered.length === 0 ? (
          <div className="px-2 py-4 text-center text-sm text-muted-foreground">
            {searchQuery ? 'No whiteboards found' : 'No whiteboards yet. Create one!'}
          </div>
        ) : (
          filtered.map((wb) => {
            const isSelected = selectedWhiteboardId === wb.id
            const isEditing = editingId === wb.id
            return (
              <div
                key={wb.id}
                role="button"
                tabIndex={0}
                onClick={() => !isEditing && onSelectWhiteboard(wb)}
                onDoubleClick={(e) => startEdit(wb, e)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !isEditing) onSelectWhiteboard(wb)
                }}
                className={cn(
                  'group mb-0.5 flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors',
                  isSelected ? 'bg-primary text-primary-foreground' : 'hover:bg-zinc-50',
                )}
              >
                {wb.icon && <span className="shrink-0 text-base">{wb.icon}</span>}
                {isEditing ? (
                  <input
                    ref={titleInputRef}
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onBlur={() => commitTitle(wb.id, editTitle)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') commitTitle(wb.id, editTitle)
                      if (e.key === 'Escape') setEditingId(null)
                      e.stopPropagation()
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="min-w-0 flex-1 rounded border border-zinc-300 bg-white px-1 py-0.5 text-sm text-zinc-900 outline-none"
                  />
                ) : (
                  <span className="flex-1 truncate">{wb.title || 'Untitled'}</span>
                )}
                {!isEditing && (
                  <Popover
                    open={menuOpenId === wb.id}
                    onOpenChange={(open) => setMenuOpenId(open ? wb.id : null)}
                  >
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        title="More options"
                        aria-label="More options"
                        onClick={(e) => e.stopPropagation()}
                        onPointerDown={(e) => e.stopPropagation()}
                        className={cn(
                          'flex h-5 w-5 shrink-0 items-center justify-center rounded text-zinc-500 opacity-0 transition-opacity hover:bg-zinc-100 group-hover:pointer-events-auto group-hover:opacity-100 pointer-events-none',
                          isSelected && 'text-primary-foreground hover:bg-black/10',
                        )}
                      >
                        <MoreHorizontal className="h-3.5 w-3.5" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-40 p-1" align="end" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => handleDeleteWhiteboard(wb.id)}
                        className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </button>
                    </PopoverContent>
                  </Popover>
                )}
              </div>
            )
          })
        )}
      </div>

      <ConfirmDialog
        open={!!deleteConfirmWhiteboardId}
        onOpenChange={(open) => !open && setDeleteConfirmWhiteboardId(null)}
        title="Delete Whiteboard"
        description="Are you sure you want to delete this whiteboard? This cannot be undone."
        onConfirm={confirmDeleteWhiteboard}
        confirmButtonText="Delete"
        variant="destructive"
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}
