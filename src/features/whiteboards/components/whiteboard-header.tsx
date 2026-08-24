'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Eye } from 'lucide-react'

import { useUpdateWhiteboardMutation } from '@/features/whiteboards/hooks/use-whiteboards'
import type { Whiteboard } from '@/features/whiteboards/types'

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

  return (
    <div className="shrink-0 border-b border-zinc-200 bg-white">
      <div className="flex items-center gap-2 px-3 py-2 md:px-4">
        {whiteboard.icon && <span className="text-xl">{whiteboard.icon}</span>}
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
    </div>
  )
}
