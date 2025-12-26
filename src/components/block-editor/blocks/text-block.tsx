'use client'

import { KeyboardEvent } from 'react'

import { TextBlock, createBlock } from '../types'
import { useBlockEditorStore } from '../store'
import { EditableContent } from './editable-content'

import { cn } from '@/lib/utils'

interface TextBlockComponentProps {
  block: TextBlock
  isSelected: boolean
  onSelect: () => void
}

export function TextBlockComponent({ block, isSelected, onSelect }: TextBlockComponentProps) {
  const { updateBlock, addBlock, deleteBlock } = useBlockEditorStore()

  const handleChange = (content: string) => {
    updateBlock(block.id, { content })
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    // Handle slash command
    if (e.key === '/' && block.content === '') {
      e.preventDefault()
      const rect = (e.target as HTMLElement).getBoundingClientRect()
      useBlockEditorStore.getState().openSlashMenu({ x: rect.left, y: rect.bottom })
      return
    }

    // Handle Enter to create new block
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      const newBlock = createBlock('paragraph')
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

  const getStyles = () => {
    switch (block.type) {
      case 'heading1':
        return 'text-3xl font-bold tracking-tight'
      case 'heading2':
        return 'text-2xl font-semibold tracking-tight'
      case 'heading3':
        return 'text-xl font-medium tracking-tight'
      case 'quote':
        return 'pl-4 border-l-4 border-primary italic text-muted-foreground'
      default:
        return 'text-base'
    }
  }

  const getPlaceholder = () => {
    switch (block.type) {
      case 'heading1':
        return 'Heading 1'
      case 'heading2':
        return 'Heading 2'
      case 'heading3':
        return 'Heading 3'
      case 'quote':
        return 'Quote...'
      default:
        return "Type '/' for commands..."
    }
  }

  const getComponent = () => {
    switch (block.type) {
      case 'heading1':
        return 'h1'
      case 'heading2':
        return 'h2'
      case 'heading3':
        return 'h3'
      default:
        return 'p'
    }
  }

  return (
    <div
      className={cn(
        'group relative rounded-lg transition-colors',
        isSelected && 'bg-muted/50'
      )}
      onClick={onSelect}
    >
      <EditableContent
        value={block.content}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={getPlaceholder()}
        className={cn('w-full py-1', getStyles())}
        as={getComponent()}
        autoFocus={isSelected && block.content === ''}
      />
    </div>
  )
}
