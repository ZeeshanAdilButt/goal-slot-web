'use client'

import { KeyboardEvent } from 'react'

import { Check, Square } from 'lucide-react'

import { TodoBlock, createBlock } from '../types'
import { useBlockEditorStore } from '../store'
import { EditableContent } from './editable-content'

import { cn } from '@/lib/utils'

interface TodoBlockComponentProps {
  block: TodoBlock
  isSelected: boolean
  onSelect: () => void
}

export function TodoBlockComponent({ block, isSelected, onSelect }: TodoBlockComponentProps) {
  const { updateBlock, addBlock, deleteBlock } = useBlockEditorStore()

  const handleChange = (content: string) => {
    updateBlock(block.id, { content })
  }

  const handleToggle = () => {
    updateBlock(block.id, { checked: !block.checked })
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    // Handle slash command
    if (e.key === '/' && block.content === '') {
      e.preventDefault()
      const rect = (e.target as HTMLElement).getBoundingClientRect()
      useBlockEditorStore.getState().openSlashMenu({ x: rect.left, y: rect.bottom })
      return
    }

    // Handle Enter to create new todo
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      const newBlock = createBlock('todo')
      addBlock(newBlock, block.id)
      return
    }

    // Handle Backspace on empty block to delete
    if (e.key === 'Backspace' && block.content === '') {
      e.preventDefault()
      deleteBlock(block.id)
      return
    }
  }

  return (
    <div
      className={cn(
        'group relative flex items-start gap-3 rounded-lg py-1 transition-colors',
        isSelected && 'bg-muted/50'
      )}
      onClick={onSelect}
    >
      <button
        onClick={(e) => {
          e.stopPropagation()
          handleToggle()
        }}
        className={cn(
          'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-all',
          block.checked
            ? 'border-primary bg-primary text-primary-foreground'
            : 'border-border hover:border-primary'
        )}
      >
        {block.checked && <Check className="h-3.5 w-3.5" />}
      </button>

      <EditableContent
        value={block.content}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="To-do"
        className={cn(
          'flex-1 text-base',
          block.checked && 'text-muted-foreground line-through'
        )}
        autoFocus={isSelected && block.content === ''}
      />
    </div>
  )
}
