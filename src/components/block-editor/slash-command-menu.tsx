'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import {
  Type,
  Heading1,
  Heading2,
  Heading3,
  CheckSquare,
  List,
  ListOrdered,
  ChevronRight,
  Quote,
  AlertCircle,
  Code,
  Minus,
  Table,
  Columns,
} from 'lucide-react'

import { SLASH_COMMANDS, BlockType, SlashCommand } from './types'
import { useBlockEditorStore, useAddNewBlock } from './store'

import { cn } from '@/lib/utils'

const ICONS: Record<string, React.ElementType> = {
  Type,
  Heading1,
  Heading2,
  Heading3,
  CheckSquare,
  List,
  ListOrdered,
  ChevronRight,
  Quote,
  AlertCircle,
  Code,
  Minus,
  Table,
  Columns,
}

export function SlashCommandMenu() {
  const {
    isSlashMenuOpen,
    slashMenuPosition,
    slashMenuFilter,
    closeSlashMenu,
    setSlashMenuFilter,
  } = useBlockEditorStore()
  const addNewBlock = useAddNewBlock()
  const [selectedIndex, setSelectedIndex] = useState(0)
  const menuRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Filter commands based on search
  const filteredCommands = SLASH_COMMANDS.filter((cmd) => {
    const searchTerm = slashMenuFilter.toLowerCase()
    return (
      cmd.label.toLowerCase().includes(searchTerm) ||
      cmd.description.toLowerCase().includes(searchTerm) ||
      cmd.keywords.some((k) => k.toLowerCase().includes(searchTerm))
    )
  })

  const handleSelectCommand = useCallback((command: SlashCommand) => {
    addNewBlock(command.type)
  }, [addNewBlock])

  // Reset selected index when filter changes
  useEffect(() => {
    setSelectedIndex(0)
  }, [slashMenuFilter])

  // Focus input when menu opens
  useEffect(() => {
    if (isSlashMenuOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isSlashMenuOpen])

  // Handle keyboard navigation
  useEffect(() => {
    if (!isSlashMenuOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex((prev) => Math.min(prev + 1, filteredCommands.length - 1))
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex((prev) => Math.max(prev - 1, 0))
          break
        case 'Enter':
          e.preventDefault()
          if (filteredCommands[selectedIndex]) {
            handleSelectCommand(filteredCommands[selectedIndex])
          }
          break
        case 'Escape':
          e.preventDefault()
          closeSlashMenu()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isSlashMenuOpen, selectedIndex, filteredCommands, closeSlashMenu, handleSelectCommand])

  // Close menu when clicking outside
  useEffect(() => {
    if (!isSlashMenuOpen) return

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        closeSlashMenu()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isSlashMenuOpen, closeSlashMenu])

  if (!isSlashMenuOpen || !slashMenuPosition) return null

  return (
    <div
      ref={menuRef}
      className="fixed z-50 w-80 overflow-hidden rounded-lg border-2 border-border bg-card shadow-brutal"
      style={{
        left: slashMenuPosition.x,
        top: slashMenuPosition.y + 8,
        maxHeight: '400px',
      }}
    >
      {/* Search input */}
      <div className="border-b-2 border-border p-2">
        <input
          ref={inputRef}
          type="text"
          value={slashMenuFilter}
          onChange={(e) => setSlashMenuFilter(e.target.value)}
          placeholder="Search blocks..."
          className="w-full bg-transparent px-2 py-1 text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>

      {/* Commands list */}
      <div className="max-h-[320px] overflow-y-auto p-1">
        {filteredCommands.length === 0 ? (
          <div className="px-3 py-6 text-center text-sm text-muted-foreground">
            No blocks found
          </div>
        ) : (
          <>
            <div className="px-2 py-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Basic Blocks
            </div>
            {filteredCommands.map((command, index) => {
              const IconComponent = ICONS[command.icon] || Type
              return (
                <button
                  key={command.id}
                  onClick={() => handleSelectCommand(command)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-md px-2 py-2 text-left transition-colors',
                    index === selectedIndex
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted'
                  )}
                >
                  <div
                    className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-md border-2',
                      index === selectedIndex
                        ? 'border-primary-foreground/30 bg-primary-foreground/10'
                        : 'border-border bg-muted'
                    )}
                  >
                    <IconComponent className="h-5 w-5" />
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{command.label}</span>
                      {command.shortcut && (
                        <code
                          className={cn(
                            'rounded px-1 text-xs',
                            index === selectedIndex
                              ? 'bg-primary-foreground/20'
                              : 'bg-muted'
                          )}
                        >
                          {command.shortcut}
                        </code>
                      )}
                    </div>
                    <p
                      className={cn(
                        'truncate text-xs',
                        index === selectedIndex
                          ? 'text-primary-foreground/70'
                          : 'text-muted-foreground'
                      )}
                    >
                      {command.description}
                    </p>
                  </div>
                </button>
              )
            })}
          </>
        )}
      </div>
    </div>
  )
}
