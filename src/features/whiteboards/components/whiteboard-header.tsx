'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Eye, Plus, Share2, Star, StarOff } from 'lucide-react'

import { NOTE_COLORS, NOTE_ICONS } from '@/features/notes/utils/types'
import { useUpdateWhiteboardMutation } from '@/features/whiteboards/hooks/use-whiteboards'
import type { Whiteboard } from '@/features/whiteboards/types'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

import { ShareWhiteboardDialog } from './share-whiteboard-dialog'

interface WhiteboardHeaderProps {
  whiteboard: Whiteboard
  readOnly?: boolean
  sharedBy?: { name: string; email: string } | null
  autoFocusTitle?: boolean
}

function useDebounce<T extends (...args: any[]) => void>(callback: T, delay: number): T {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const callbackRef = useRef(callback)

  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  return useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args)
      }, delay)
    },
    [delay],
  ) as T
}

export function WhiteboardHeader({
  whiteboard,
  readOnly = false,
  sharedBy = null,
  autoFocusTitle = false,
}: WhiteboardHeaderProps) {
  const updateMutation = useUpdateWhiteboardMutation()
  const [title, setTitle] = useState(whiteboard.title)
  const [showShare, setShowShare] = useState(false)
  const [showIconPicker, setShowIconPicker] = useState(false)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const titleRef = useRef<HTMLInputElement>(null)
  const idRef = useRef(whiteboard.id)

  useEffect(() => {
    setTitle(whiteboard.title)
    idRef.current = whiteboard.id
  }, [whiteboard.id, whiteboard.title])

  useEffect(() => {
    if (autoFocusTitle && titleRef.current && !readOnly) {
      titleRef.current.focus()
      titleRef.current.select()
    }
  }, [autoFocusTitle, readOnly, whiteboard.id])

  const saveTitle = useCallback(
    (newTitle: string, expectedId: string) => {
      if (newTitle !== whiteboard.title && idRef.current === expectedId) {
        updateMutation.mutate({ id: expectedId, data: { title: newTitle } })
      }
    },
    [whiteboard.title, updateMutation],
  )

  const debouncedSaveTitle = useDebounce(saveTitle, 500)

  const handleToggleFavorite = () => {
    updateMutation.mutate({
      id: whiteboard.id,
      data: { isFavorite: !whiteboard.isFavorite },
    })
  }

  const handleIconChange = (icon: string) => {
    updateMutation.mutate({ id: whiteboard.id, data: { icon } })
    setShowIconPicker(false)
  }

  const handleColorChange = (color: string) => {
    updateMutation.mutate({ id: whiteboard.id, data: { color } })
    setShowColorPicker(false)
  }

  const colorConfig =
    NOTE_COLORS.find((c) => c.value === (whiteboard.color || 'default')) || NOTE_COLORS[0]

  return (
    <div className="shrink-0 border-b border-zinc-200">
      <div className="flex items-center gap-2 px-3 py-2 md:px-4">
        {readOnly ? (
          whiteboard.icon ? (
            <span
              aria-hidden
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-white text-xl md:h-9 md:w-9"
            >
              {whiteboard.icon}
            </span>
          ) : null
        ) : (
          <Popover open={showIconPicker} onOpenChange={setShowIconPicker}>
            <PopoverTrigger asChild>
              <button
                type="button"
                title={whiteboard.icon ? 'Change icon' : 'Add an icon'}
                aria-label={whiteboard.icon ? 'Change icon' : 'Add an icon'}
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-xl transition-colors md:h-9 md:w-9',
                  whiteboard.icon
                    ? 'border-zinc-200 bg-white hover:bg-zinc-50'
                    : 'border-dashed border-zinc-200 bg-transparent text-zinc-400 hover:border-zinc-300 hover:text-zinc-600',
                )}
              >
                {whiteboard.icon ?? <Plus className="h-4 w-4" />}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-2" align="start">
              <div className="grid grid-cols-8 gap-1">
                {NOTE_ICONS.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => handleIconChange(icon)}
                    className={cn(
                      'flex h-8 w-8 items-center justify-center rounded text-lg hover:bg-muted',
                      whiteboard.icon === icon && 'bg-primary text-primary-foreground',
                    )}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        )}
        <input
          ref={titleRef}
          type="text"
          value={title}
          onChange={(e) => {
            const next = e.target.value
            setTitle(next)
            debouncedSaveTitle(next, whiteboard.id)
          }}
          placeholder="Untitled"
          readOnly={readOnly}
          className="min-w-0 flex-1 bg-transparent text-lg font-bold outline-none placeholder:text-muted-foreground"
        />
        {readOnly && (
          <span className="inline-flex items-center gap-1 rounded-md bg-zinc-100 px-2 py-1 text-[11px] font-medium text-zinc-600">
            <Eye className="h-3 w-3" />
            View only
          </span>
        )}
        {!readOnly && (
          <>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowShare(true)}
              title="Share this whiteboard"
              aria-label="Share this whiteboard"
              className="h-8 shrink-0 gap-1.5 px-2 text-xs"
            >
              <Share2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Share</span>
            </Button>
            <button
              type="button"
              onClick={handleToggleFavorite}
              className={cn(
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-zinc-200 transition-colors md:h-9 md:w-9',
                whiteboard.isFavorite
                  ? 'bg-yellow-100 text-yellow-600'
                  : 'bg-white hover:bg-zinc-50',
              )}
              title={whiteboard.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              {whiteboard.isFavorite ? (
                <Star className="h-3.5 w-3.5 fill-current md:h-4 md:w-4" />
              ) : (
                <StarOff className="h-3.5 w-3.5 md:h-4 md:w-4" />
              )}
            </button>
            <Popover open={showColorPicker} onOpenChange={setShowColorPicker}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-white transition-colors hover:bg-zinc-50 md:h-9 md:w-9"
                  title="Change color"
                >
                  <div
                    className={cn(
                      'h-4 w-4 rounded-full border-2 md:h-5 md:w-5',
                      colorConfig.border,
                      colorConfig.bg,
                    )}
                  />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-48 p-2" align="end">
                <div className="grid grid-cols-4 gap-2">
                  {NOTE_COLORS.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => handleColorChange(color.value)}
                      className={cn(
                        'flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all',
                        color.border,
                        color.bg,
                        (whiteboard.color || 'default') === color.value &&
                          'ring-2 ring-primary ring-offset-2',
                      )}
                      title={color.label}
                    />
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </>
        )}
      </div>
      {readOnly && sharedBy && (
        <div className="flex items-center gap-2 border-t border-zinc-100 bg-zinc-50 px-3 py-1.5 text-[11px] text-zinc-600 md:px-4">
          <Eye className="h-3 w-3 text-zinc-400" />
          <span>
            Shared with you by <span className="font-semibold text-zinc-900">{sharedBy.name}</span>
            <span className="text-zinc-400"> ({sharedBy.email})</span>
          </span>
        </div>
      )}
      {!readOnly && (
        <ShareWhiteboardDialog
          whiteboard={whiteboard}
          open={showShare}
          onClose={() => setShowShare(false)}
        />
      )}
    </div>
  )
}
