'use client'

import { KeyboardEvent, useState, useRef, useEffect } from 'react'

import { ListBlock, ListItem, createBlock } from '../types'
import { useBlockEditorStore } from '../store'

import { cn } from '@/lib/utils'

interface ListBlockComponentProps {
  block: ListBlock
  isSelected: boolean
  onSelect: () => void
}

export function ListBlockComponent({ block, isSelected, onSelect }: ListBlockComponentProps) {
  const { updateBlock, deleteBlock } = useBlockEditorStore()
  const [focusedItemId, setFocusedItemId] = useState<string | null>(null)
  const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map())

  const updateItem = (itemId: string, content: string) => {
    const newItems = block.items.map((item) =>
      item.id === itemId ? { ...item, content } : item
    )
    updateBlock(block.id, { items: newItems })
  }

  const addItem = (afterItemId: string) => {
    const index = block.items.findIndex((item) => item.id === afterItemId)
    const newItem: ListItem = { id: crypto.randomUUID(), content: '' }
    const newItems = [...block.items]
    newItems.splice(index + 1, 0, newItem)
    updateBlock(block.id, { items: newItems })
    setFocusedItemId(newItem.id)
  }

  const deleteItem = (itemId: string) => {
    if (block.items.length === 1) {
      // Delete entire block if only one item
      deleteBlock(block.id)
      return
    }
    const index = block.items.findIndex((item) => item.id === itemId)
    const newItems = block.items.filter((item) => item.id !== itemId)
    updateBlock(block.id, { items: newItems })
    // Focus previous item
    if (index > 0) {
      setFocusedItemId(newItems[index - 1].id)
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>, item: ListItem) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      addItem(item.id)
      return
    }

    if (e.key === 'Backspace' && item.content === '') {
      e.preventDefault()
      deleteItem(item.id)
      return
    }

    // Handle slash command
    if (e.key === '/' && item.content === '') {
      e.preventDefault()
      const rect = (e.target as HTMLElement).getBoundingClientRect()
      useBlockEditorStore.getState().openSlashMenu({ x: rect.left, y: rect.bottom })
      return
    }
  }

  useEffect(() => {
    if (focusedItemId) {
      const el = itemRefs.current.get(focusedItemId)
      if (el) {
        el.focus()
        // Move cursor to end
        const range = document.createRange()
        const selection = window.getSelection()
        range.selectNodeContents(el)
        range.collapse(false)
        selection?.removeAllRanges()
        selection?.addRange(range)
      }
      setFocusedItemId(null)
    }
  }, [focusedItemId, block.items])

  const ListWrapper = block.type === 'numberedList' ? 'ol' : 'ul'

  return (
    <div
      className={cn(
        'group relative rounded-lg py-1 transition-colors',
        isSelected && 'bg-muted/50'
      )}
      onClick={onSelect}
    >
      <ListWrapper
        className={cn(
          'ml-4 space-y-1',
          block.type === 'bulletList' && 'list-disc',
          block.type === 'numberedList' && 'list-decimal'
        )}
      >
        {block.items.map((item) => (
          <li key={item.id} className="marker:text-primary">
            <div
              ref={(el) => {
                if (el) itemRefs.current.set(item.id, el)
              }}
              contentEditable
              suppressContentEditableWarning
              onInput={(e) => updateItem(item.id, e.currentTarget.textContent || '')}
              onKeyDown={(e) => handleKeyDown(e, item)}
              data-placeholder="List item"
              className={cn(
                'outline-none focus:outline-none',
                'empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground empty:before:pointer-events-none'
              )}
            >
              {item.content}
            </div>
          </li>
        ))}
      </ListWrapper>
    </div>
  )
}
