'use client'

import { useState } from 'react'

import { Plus, Trash2, GripVertical, MoreHorizontal } from 'lucide-react'

import { KanbanBlock, KanbanColumn, KanbanCard } from '../types'
import { useBlockEditorStore } from '../store'

import { cn } from '@/lib/utils'

interface KanbanBlockComponentProps {
  block: KanbanBlock
  isSelected: boolean
  onSelect: () => void
}

const COLUMN_COLORS = [
  '#f87171', // red
  '#fb923c', // orange
  '#fbbf24', // amber
  '#a3e635', // lime
  '#4ade80', // green
  '#22d3ee', // cyan
  '#60a5fa', // blue
  '#a78bfa', // purple
  '#f472b6', // pink
]

export function KanbanBlockComponent({ block, isSelected, onSelect }: KanbanBlockComponentProps) {
  const { updateBlock } = useBlockEditorStore()
  const [editingColumnId, setEditingColumnId] = useState<string | null>(null)
  const [newCardColumnId, setNewCardColumnId] = useState<string | null>(null)
  const [newCardContent, setNewCardContent] = useState('')
  const [draggedCard, setDraggedCard] = useState<{ columnId: string; cardId: string } | null>(null)

  const updateColumn = (columnId: string, updates: Partial<KanbanColumn>) => {
    const newColumns = block.columns.map((col) =>
      col.id === columnId ? { ...col, ...updates } : col
    )
    updateBlock(block.id, { columns: newColumns })
  }

  const addColumn = () => {
    const newColumn: KanbanColumn = {
      id: crypto.randomUUID(),
      title: 'New Column',
      color: COLUMN_COLORS[block.columns.length % COLUMN_COLORS.length],
      cards: [],
    }
    updateBlock(block.id, { columns: [...block.columns, newColumn] })
    setEditingColumnId(newColumn.id)
  }

  const deleteColumn = (columnId: string) => {
    if (block.columns.length <= 1) return
    updateBlock(block.id, { columns: block.columns.filter((col) => col.id !== columnId) })
  }

  const addCard = (columnId: string, content: string) => {
    if (!content.trim()) return
    const newCard: KanbanCard = {
      id: crypto.randomUUID(),
      content: content.trim(),
    }
    const newColumns = block.columns.map((col) =>
      col.id === columnId ? { ...col, cards: [...col.cards, newCard] } : col
    )
    updateBlock(block.id, { columns: newColumns })
    setNewCardContent('')
    setNewCardColumnId(null)
  }

  const deleteCard = (columnId: string, cardId: string) => {
    const newColumns = block.columns.map((col) =>
      col.id === columnId
        ? { ...col, cards: col.cards.filter((card) => card.id !== cardId) }
        : col
    )
    updateBlock(block.id, { columns: newColumns })
  }

  const moveCard = (fromColumnId: string, toColumnId: string, cardId: string) => {
    if (fromColumnId === toColumnId) return

    let cardToMove: KanbanCard | null = null

    const newColumns = block.columns.map((col) => {
      if (col.id === fromColumnId) {
        const card = col.cards.find((c) => c.id === cardId)
        if (card) cardToMove = card
        return { ...col, cards: col.cards.filter((c) => c.id !== cardId) }
      }
      return col
    })

    if (cardToMove) {
      const finalColumns = newColumns.map((col) =>
        col.id === toColumnId ? { ...col, cards: [...col.cards, cardToMove!] } : col
      )
      updateBlock(block.id, { columns: finalColumns })
    }
  }

  const handleDragStart = (columnId: string, cardId: string) => {
    setDraggedCard({ columnId, cardId })
  }

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent, toColumnId: string) => {
    e.preventDefault()
    if (draggedCard) {
      moveCard(draggedCard.columnId, toColumnId, draggedCard.cardId)
      setDraggedCard(null)
    }
  }

  return (
    <div
      className={cn(
        'group relative rounded-lg transition-colors',
        isSelected && 'ring-2 ring-primary ring-offset-2'
      )}
      onClick={onSelect}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {block.columns.map((column) => (
          <div
            key={column.id}
            className="w-72 shrink-0 rounded-lg border-2 border-border bg-card"
            onDragOver={(e) => handleDragOver(e, column.id)}
            onDrop={(e) => handleDrop(e, column.id)}
          >
            {/* Column Header */}
            <div
              className="flex items-center justify-between rounded-t-lg border-b-2 border-border p-3"
              style={{ backgroundColor: column.color + '20' }}
            >
              <div className="flex items-center gap-2">
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: column.color }}
                />
                {editingColumnId === column.id ? (
                  <input
                    type="text"
                    value={column.title}
                    onChange={(e) => updateColumn(column.id, { title: e.target.value })}
                    onBlur={() => setEditingColumnId(null)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') setEditingColumnId(null)
                    }}
                    autoFocus
                    className="w-32 bg-transparent font-bold outline-none"
                  />
                ) : (
                  <span
                    className="cursor-pointer font-bold"
                    onClick={(e) => {
                      e.stopPropagation()
                      setEditingColumnId(column.id)
                    }}
                  >
                    {column.title}
                  </span>
                )}
                <span className="rounded bg-muted px-1.5 py-0.5 text-xs font-medium">
                  {column.cards.length}
                </span>
              </div>
              {block.columns.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    deleteColumn(column.id)
                  }}
                  className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Cards */}
            <div className="min-h-[100px] space-y-2 p-3">
              {column.cards.map((card) => (
                <div
                  key={card.id}
                  draggable
                  onDragStart={() => handleDragStart(column.id, card.id)}
                  className={cn(
                    'group/card cursor-grab rounded-lg border-2 border-border bg-background p-3 shadow-brutal-sm transition-all',
                    'hover:shadow-brutal active:cursor-grabbing'
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="flex-1 text-sm">{card.content}</p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteCard(column.id, card.id)
                      }}
                      className="shrink-0 rounded p-1 opacity-0 hover:bg-muted hover:text-destructive group-hover/card:opacity-100"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}

              {/* Add card form */}
              {newCardColumnId === column.id ? (
                <div className="space-y-2">
                  <textarea
                    value={newCardContent}
                    onChange={(e) => setNewCardContent(e.target.value)}
                    placeholder="Enter a title for this card..."
                    autoFocus
                    className="w-full resize-none rounded-lg border-2 border-border p-2 text-sm outline-none focus:border-primary"
                    rows={2}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        addCard(column.id, newCardContent)
                      }
                      if (e.key === 'Escape') {
                        setNewCardColumnId(null)
                        setNewCardContent('')
                      }
                    }}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        addCard(column.id, newCardContent)
                      }}
                      className="rounded bg-primary px-3 py-1 text-sm font-medium text-primary-foreground"
                    >
                      Add
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setNewCardColumnId(null)
                        setNewCardContent('')
                      }}
                      className="rounded px-3 py-1 text-sm font-medium hover:bg-muted"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setNewCardColumnId(column.id)
                  }}
                  className="flex w-full items-center gap-2 rounded-lg p-2 text-sm text-muted-foreground hover:bg-muted"
                >
                  <Plus className="h-4 w-4" />
                  Add a card
                </button>
              )}
            </div>
          </div>
        ))}

        {/* Add Column Button */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            addColumn()
          }}
          className="flex h-12 w-72 shrink-0 items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-muted/50 text-muted-foreground hover:border-primary hover:bg-muted"
        >
          <Plus className="h-4 w-4" />
          Add column
        </button>
      </div>
    </div>
  )
}
