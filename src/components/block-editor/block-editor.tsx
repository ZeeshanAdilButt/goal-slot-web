'use client'

import { useEffect, useState, useCallback, useRef } from 'react'

import {
  Plus,
  GripVertical,
  Trash2,
  ArrowUp,
  ArrowDown,
  Copy,
  FileText,
  Check,
} from 'lucide-react'

import {
  Block,
  TextBlock,
  TodoBlock,
  ListBlock,
  ToggleBlock,
  CalloutBlock,
  CodeBlock,
  DividerBlock,
  TableBlock,
  KanbanBlock,
  createBlock,
  blocksToMarkdown,
  blocksToPlainText,
} from './types'
import { useBlockEditorStore } from './store'
import { SlashCommandMenu } from './slash-command-menu'
import {
  TextBlockComponent,
  TodoBlockComponent,
  ListBlockComponent,
  ToggleBlockComponent,
  CalloutBlockComponent,
  CodeBlockComponent,
  DividerBlockComponent,
  TableBlockComponent,
  KanbanBlockComponent,
} from './blocks'

import { cn } from '@/lib/utils'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

interface BlockEditorProps {
  initialBlocks?: Block[]
  onChange?: (blocks: Block[]) => void
  placeholder?: string
  className?: string
  readOnly?: boolean
  showToolbar?: boolean
}

export function BlockEditor({
  initialBlocks = [],
  onChange,
  placeholder = "Press '/' for commands, or just start typing...",
  className,
  readOnly = false,
  showToolbar = true,
}: BlockEditorProps) {
  const {
    blocks,
    selectedBlockId,
    setBlocks,
    addBlock,
    deleteBlock,
    moveBlock,
    selectBlock,
  } = useBlockEditorStore()

  const [copiedFormat, setCopiedFormat] = useState<'markdown' | 'text' | null>(null)
  const [hoveredBlockId, setHoveredBlockId] = useState<string | null>(null)
  const editorRef = useRef<HTMLDivElement>(null)

  // Initialize blocks
  useEffect(() => {
    if (initialBlocks.length > 0) {
      setBlocks(initialBlocks)
    } else if (blocks.length === 0) {
      const defaultBlock = createBlock('paragraph')
      setBlocks([defaultBlock])
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Notify parent of changes
  useEffect(() => {
    if (onChange && blocks.length > 0) {
      onChange(blocks)
    }
  }, [blocks, onChange])

  const handleAddBlockAfter = (afterId?: string) => {
    const newBlock = createBlock('paragraph')
    addBlock(newBlock, afterId)
  }

  const handleAddBlockAtEnd = () => {
    const newBlock = createBlock('paragraph')
    addBlock(newBlock, blocks[blocks.length - 1]?.id)
  }

  const handleCopyContent = useCallback((format: 'markdown' | 'text') => {
    const content = format === 'markdown' 
      ? blocksToMarkdown(blocks)
      : blocksToPlainText(blocks)
    
    navigator.clipboard.writeText(content)
    setCopiedFormat(format)
    
    setTimeout(() => setCopiedFormat(null), 2000)
  }, [blocks])

  const handleDeleteBlock = (blockId: string) => {
    if (blocks.length === 1) {
      const newBlock = createBlock('paragraph')
      setBlocks([newBlock])
    } else {
      deleteBlock(blockId)
    }
  }

  const renderBlock = (block: Block) => {
    const isSelected = selectedBlockId === block.id
    const commonProps = {
      isSelected,
      onSelect: () => selectBlock(block.id),
    }

    switch (block.type) {
      case 'paragraph':
      case 'heading1':
      case 'heading2':
      case 'heading3':
      case 'quote':
        return <TextBlockComponent key={block.id} block={block as TextBlock} {...commonProps} />
      case 'todo':
        return <TodoBlockComponent key={block.id} block={block as TodoBlock} {...commonProps} />
      case 'bulletList':
      case 'numberedList':
        return <ListBlockComponent key={block.id} block={block as ListBlock} {...commonProps} />
      case 'toggleList':
        return <ToggleBlockComponent key={block.id} block={block as ToggleBlock} {...commonProps} />
      case 'callout':
        return <CalloutBlockComponent key={block.id} block={block as CalloutBlock} {...commonProps} />
      case 'code':
        return <CodeBlockComponent key={block.id} block={block as CodeBlock} {...commonProps} />
      case 'divider':
        return <DividerBlockComponent key={block.id} {...commonProps} />
      case 'table':
        return <TableBlockComponent key={block.id} block={block as TableBlock} {...commonProps} />
      case 'kanban':
        return <KanbanBlockComponent key={block.id} block={block as KanbanBlock} {...commonProps} />
      default:
        return null
    }
  }

  return (
    <div ref={editorRef} className={cn('relative', className)}>
      {/* Toolbar */}
      {showToolbar && !readOnly && (
        <div className="mb-4 flex items-center justify-between gap-2 rounded-lg border-2 border-border bg-muted/30 px-3 py-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{blocks.length} block{blocks.length !== 1 ? 's' : ''}</span>
            <span className="text-border">•</span>
            <span>Select any text with your mouse</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleCopyContent('markdown')}
              className={cn(
                'flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs transition-colors',
                copiedFormat === 'markdown'
                  ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                  : 'hover:bg-muted text-muted-foreground hover:text-foreground'
              )}
            >
              {copiedFormat === 'markdown' ? <Check className="h-3 w-3" /> : <FileText className="h-3 w-3" />}
              Copy Markdown
            </button>
            <button
              onClick={() => handleCopyContent('text')}
              className={cn(
                'flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs transition-colors',
                copiedFormat === 'text'
                  ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                  : 'hover:bg-muted text-muted-foreground hover:text-foreground'
              )}
            >
              {copiedFormat === 'text' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              Copy Text
            </button>
          </div>
        </div>
      )}

      {/* Blocks container */}
      <div className="space-y-0.5">
        {blocks.map((block, index) => {
          const isHovered = hoveredBlockId === block.id
          const isSelected = selectedBlockId === block.id
          const showControls = isHovered || isSelected

          return (
            <div
              key={block.id}
              className="group relative flex"
              onMouseEnter={() => setHoveredBlockId(block.id)}
              onMouseLeave={() => setHoveredBlockId(null)}
            >
              {/* Left side controls - Notion style */}
              {!readOnly && (
                <div
                  className={cn(
                    'absolute -left-20 top-0 flex w-16 items-center justify-end gap-0.5 pr-2 transition-opacity',
                    showControls ? 'opacity-100' : 'opacity-0'
                  )}
                >
                  {/* Add block button */}
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        className="flex h-6 w-6 items-center justify-center rounded hover:bg-muted"
                        title="Add block"
                      >
                        <Plus className="h-4 w-4 text-muted-foreground" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-48 p-1" side="left" align="start">
                      <button
                        onClick={() => handleAddBlockAfter(block.id)}
                        className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-muted"
                      >
                        <Plus className="h-4 w-4" />
                        Add block below
                      </button>
                      <button
                        onClick={() => {
                          const newBlock = createBlock('paragraph')
                          const prevBlock = blocks[index - 1]
                          if (prevBlock) {
                            addBlock(newBlock, prevBlock.id)
                          } else {
                            setBlocks([newBlock, ...blocks])
                          }
                        }}
                        className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-muted"
                      >
                        <Plus className="h-4 w-4" />
                        Add block above
                      </button>
                    </PopoverContent>
                  </Popover>

                  {/* Drag handle / Block menu */}
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        className="flex h-6 w-6 cursor-grab items-center justify-center rounded hover:bg-muted active:cursor-grabbing"
                        title="Drag to move / Click for options"
                      >
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-44 p-1" side="left" align="start">
                      <button
                        onClick={() => {
                          const content = blocksToPlainText([block])
                          navigator.clipboard.writeText(content)
                        }}
                        className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-muted"
                      >
                        <Copy className="h-4 w-4" />
                        Copy block
                      </button>
                      <hr className="my-1 border-border" />
                      <button
                        onClick={() => moveBlock(block.id, 'up')}
                        disabled={index === 0}
                        className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-muted disabled:opacity-40"
                      >
                        <ArrowUp className="h-4 w-4" />
                        Move up
                      </button>
                      <button
                        onClick={() => moveBlock(block.id, 'down')}
                        disabled={index === blocks.length - 1}
                        className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-muted disabled:opacity-40"
                      >
                        <ArrowDown className="h-4 w-4" />
                        Move down
                      </button>
                      <hr className="my-1 border-border" />
                      <button
                        onClick={() => handleDeleteBlock(block.id)}
                        className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </button>
                    </PopoverContent>
                  </Popover>
                </div>
              )}

              {/* Block content */}
              <div
                className={cn(
                  'min-w-0 flex-1 rounded-md transition-all',
                  isSelected && 'bg-primary/5 ring-1 ring-primary/20',
                  isHovered && !isSelected && 'bg-muted/30'
                )}
              >
                {renderBlock(block)}
              </div>
            </div>
          )
        })}

        {/* Add block at end button */}
        {!readOnly && (
          <button
            onClick={handleAddBlockAtEnd}
            className="mt-3 flex w-full items-center gap-2 rounded-lg border-2 border-dashed border-border/50 px-4 py-3 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:bg-muted/30 hover:text-foreground"
          >
            <Plus className="h-4 w-4" />
            <span>Add a block</span>
            <span className="ml-auto text-xs opacity-60">Type / for commands</span>
          </button>
        )}

        {/* Empty state */}
        {blocks.length === 0 && !readOnly && (
          <button
            onClick={handleAddBlockAtEnd}
            className="flex w-full items-center gap-2 rounded-lg border-2 border-dashed border-border p-4 text-muted-foreground transition-colors hover:border-primary hover:bg-muted/50"
          >
            <Plus className="h-5 w-5" />
            <span>{placeholder}</span>
          </button>
        )}
      </div>

      {/* Slash command menu */}
      {!readOnly && <SlashCommandMenu />}
    </div>
  )
}

// Export everything from the module
export * from './types'
export * from './store'
export { SlashCommandMenu } from './slash-command-menu'
