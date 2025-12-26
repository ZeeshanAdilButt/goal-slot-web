'use client'

import { useState } from 'react'

import { AlertCircle, Info, Lightbulb, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'

import { CalloutBlock, CalloutColor } from '../types'
import { useBlockEditorStore } from '../store'
import { EditableContent } from './editable-content'

import { cn } from '@/lib/utils'

interface CalloutBlockComponentProps {
  block: CalloutBlock
  isSelected: boolean
  onSelect: () => void
}

const CALLOUT_STYLES: Record<CalloutColor, { bg: string; border: string; icon: string }> = {
  default: { bg: 'bg-muted', border: 'border-border', icon: 'text-muted-foreground' },
  blue: { bg: 'bg-blue-50 dark:bg-blue-950', border: 'border-blue-200 dark:border-blue-800', icon: 'text-blue-600 dark:text-blue-400' },
  green: { bg: 'bg-green-50 dark:bg-green-950', border: 'border-green-200 dark:border-green-800', icon: 'text-green-600 dark:text-green-400' },
  yellow: { bg: 'bg-yellow-50 dark:bg-yellow-950', border: 'border-yellow-200 dark:border-yellow-800', icon: 'text-yellow-600 dark:text-yellow-400' },
  red: { bg: 'bg-red-50 dark:bg-red-950', border: 'border-red-200 dark:border-red-800', icon: 'text-red-600 dark:text-red-400' },
  purple: { bg: 'bg-purple-50 dark:bg-purple-950', border: 'border-purple-200 dark:border-purple-800', icon: 'text-purple-600 dark:text-purple-400' },
  pink: { bg: 'bg-pink-50 dark:bg-pink-950', border: 'border-pink-200 dark:border-pink-800', icon: 'text-pink-600 dark:text-pink-400' },
  orange: { bg: 'bg-orange-50 dark:bg-orange-950', border: 'border-orange-200 dark:border-orange-800', icon: 'text-orange-600 dark:text-orange-400' },
}

const CALLOUT_ICONS: { emoji: string; label: string }[] = [
  { emoji: '💡', label: 'Lightbulb' },
  { emoji: 'ℹ️', label: 'Info' },
  { emoji: '⚠️', label: 'Warning' },
  { emoji: '✅', label: 'Success' },
  { emoji: '❌', label: 'Error' },
  { emoji: '📝', label: 'Note' },
  { emoji: '🚀', label: 'Rocket' },
  { emoji: '⭐', label: 'Star' },
]

export function CalloutBlockComponent({ block, isSelected, onSelect }: CalloutBlockComponentProps) {
  const { updateBlock } = useBlockEditorStore()
  const [showIconPicker, setShowIconPicker] = useState(false)
  const [showColorPicker, setShowColorPicker] = useState(false)

  const handleContentChange = (content: string) => {
    updateBlock(block.id, { content })
  }

  const handleIconChange = (icon: string) => {
    updateBlock(block.id, { icon })
    setShowIconPicker(false)
  }

  const handleColorChange = (color: CalloutColor) => {
    updateBlock(block.id, { color })
    setShowColorPicker(false)
  }

  const styles = CALLOUT_STYLES[block.color]

  return (
    <div
      className={cn(
        'group relative rounded-lg transition-colors',
        isSelected && 'ring-2 ring-primary ring-offset-2'
      )}
      onClick={onSelect}
    >
      <div
        className={cn(
          'flex gap-3 rounded-lg border-2 p-4',
          styles.bg,
          styles.border
        )}
      >
        {/* Icon button */}
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation()
              setShowIconPicker(!showIconPicker)
              setShowColorPicker(false)
            }}
            className="flex h-8 w-8 items-center justify-center rounded text-xl hover:bg-black/5 dark:hover:bg-white/5"
          >
            {block.icon}
          </button>

          {showIconPicker && (
            <div className="absolute left-0 top-full z-10 mt-1 rounded-lg border-2 border-border bg-card p-2 shadow-brutal">
              <div className="grid grid-cols-4 gap-1">
                {CALLOUT_ICONS.map(({ emoji, label }) => (
                  <button
                    key={emoji}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleIconChange(emoji)
                    }}
                    className="flex h-8 w-8 items-center justify-center rounded text-lg hover:bg-muted"
                    title={label}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex-1">
          <EditableContent
            value={block.content}
            onChange={handleContentChange}
            placeholder="Type something..."
            className="w-full"
          />
        </div>

        {/* Color picker button */}
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation()
              setShowColorPicker(!showColorPicker)
              setShowIconPicker(false)
            }}
            className="h-6 w-6 rounded-full border-2 border-border"
            style={{
              background: block.color === 'default' ? '#e5e7eb' : `var(--${block.color}-200)`,
            }}
          />

          {showColorPicker && (
            <div className="absolute right-0 top-full z-10 mt-1 rounded-lg border-2 border-border bg-card p-2 shadow-brutal">
              <div className="grid grid-cols-4 gap-1">
                {(Object.keys(CALLOUT_STYLES) as CalloutColor[]).map((color) => (
                  <button
                    key={color}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleColorChange(color)
                    }}
                    className={cn(
                      'flex h-6 w-6 items-center justify-center rounded-full border-2',
                      CALLOUT_STYLES[color].bg,
                      CALLOUT_STYLES[color].border,
                      block.color === color && 'ring-2 ring-primary ring-offset-1'
                    )}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
