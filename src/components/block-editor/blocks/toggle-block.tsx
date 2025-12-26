'use client'

import { useState } from 'react'

import { ChevronDown, ChevronRight } from 'lucide-react'

import { ToggleBlock } from '../types'
import { useBlockEditorStore } from '../store'
import { EditableContent } from './editable-content'

import { cn } from '@/lib/utils'

interface ToggleBlockComponentProps {
  block: ToggleBlock
  isSelected: boolean
  onSelect: () => void
}

export function ToggleBlockComponent({ block, isSelected, onSelect }: ToggleBlockComponentProps) {
  const { updateBlock } = useBlockEditorStore()

  const handleTitleChange = (title: string) => {
    updateBlock(block.id, { title })
  }

  const handleContentChange = (content: string) => {
    updateBlock(block.id, { content })
  }

  const handleToggle = () => {
    updateBlock(block.id, { isOpen: !block.isOpen })
  }

  return (
    <div
      className={cn(
        'group relative rounded-lg transition-colors',
        isSelected && 'bg-muted/50'
      )}
      onClick={onSelect}
    >
      <div className="flex items-start gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation()
            handleToggle()
          }}
          className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded transition-colors hover:bg-muted"
        >
          {block.isOpen ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>

        <div className="flex-1">
          <EditableContent
            value={block.title}
            onChange={handleTitleChange}
            placeholder="Toggle title..."
            className="w-full py-1 font-medium"
          />

          {block.isOpen && (
            <div className="mt-2 border-l-2 border-border pl-4">
              <EditableContent
                value={block.content}
                onChange={handleContentChange}
                placeholder="Toggle content..."
                className="w-full text-muted-foreground"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
