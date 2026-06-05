'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import { useCreateWhiteboardMutation, useWhiteboardsQuery } from '@/features/whiteboards/hooks/use-whiteboards'
import type { Whiteboard } from '@/features/whiteboards/types'

const LAST_WHITEBOARD_KEY = 'dw-last-whiteboard-id'

interface UseWhiteboardsSelectionArgs {
  initialWhiteboardId?: string
}

export function useWhiteboardsSelection({ initialWhiteboardId }: UseWhiteboardsSelectionArgs = {}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()

  const { data: whiteboards = [], isLoading } = useWhiteboardsQuery()
  const createMutation = useCreateWhiteboardMutation()
  const [selectedWhiteboardId, setSelectedWhiteboardId] = useState<string | null>(null)
  const [hasInitialized, setHasInitialized] = useState(false)

  useEffect(() => {
    if (isLoading) return

    const paramId = searchParams.get('whiteboardId')
    const hasSelectedWhiteboard =
      !!selectedWhiteboardId && whiteboards.some((w) => w.id === selectedWhiteboardId)

    if (paramId && paramId !== selectedWhiteboardId && whiteboards.some((w) => w.id === paramId)) {
      setSelectedWhiteboardId(paramId)
      if (typeof window !== 'undefined') window.localStorage.setItem(LAST_WHITEBOARD_KEY, paramId)
      if (!hasInitialized) setHasInitialized(true)
      return
    }

    if (hasSelectedWhiteboard) {
      if (!hasInitialized) setHasInitialized(true)
      return
    }

    let idToSelect: string | undefined

    if (paramId && whiteboards.some((w) => w.id === paramId)) idToSelect = paramId
    if (!idToSelect && initialWhiteboardId && whiteboards.some((w) => w.id === initialWhiteboardId)) {
      idToSelect = initialWhiteboardId
    }
    if (!idToSelect && !paramId) {
      const lastId =
        typeof window !== 'undefined' ? window.localStorage.getItem(LAST_WHITEBOARD_KEY) : null
      if (lastId && whiteboards.some((w) => w.id === lastId)) idToSelect = lastId
    }
    if (!idToSelect) idToSelect = whiteboards[0]?.id

    if (idToSelect) {
      setSelectedWhiteboardId(idToSelect)
      if (typeof window !== 'undefined') window.localStorage.setItem(LAST_WHITEBOARD_KEY, idToSelect)
      if (!paramId) {
        const params = new URLSearchParams(searchParams.toString())
        params.set('whiteboardId', idToSelect)
        router.replace(`${pathname}?${params.toString()}`)
      }
    }

    if (!hasInitialized) setHasInitialized(true)
  }, [
    whiteboards,
    isLoading,
    initialWhiteboardId,
    hasInitialized,
    searchParams,
    selectedWhiteboardId,
    router,
    pathname,
  ])

  const selectedWhiteboard = useMemo<Whiteboard | null>(
    () => whiteboards.find((w) => w.id === selectedWhiteboardId) ?? null,
    [whiteboards, selectedWhiteboardId],
  )

  const selectWhiteboard = useCallback(
    (whiteboard: Whiteboard) => {
      setSelectedWhiteboardId(whiteboard.id)
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(LAST_WHITEBOARD_KEY, whiteboard.id)
      }
      const params = new URLSearchParams(searchParams.toString())
      params.set('whiteboardId', whiteboard.id)
      router.push(`${pathname}?${params.toString()}`)
    },
    [pathname, router, searchParams],
  )

  const createWhiteboard = useCallback(() => {
    createMutation.mutate(
      { title: 'Untitled' },
      { onSuccess: (newWhiteboard) => selectWhiteboard(newWhiteboard) },
    )
  }, [createMutation, selectWhiteboard])

  /** Clears selection after the active whiteboard was deleted elsewhere (e.g. sidebar). */
  const deleteSelectedWhiteboard = useCallback(() => {
    const next = whiteboards.find((w) => w.id !== selectedWhiteboardId) ?? null
    if (next) {
      selectWhiteboard(next)
      return
    }
    setSelectedWhiteboardId(null)
    if (typeof window !== 'undefined') window.localStorage.removeItem(LAST_WHITEBOARD_KEY)
    router.replace(pathname)
  }, [whiteboards, pathname, router, selectWhiteboard, selectedWhiteboardId])

  return {
    whiteboards,
    isLoading,
    selectedWhiteboard,
    selectWhiteboard,
    createWhiteboard,
    isCreating: createMutation.isPending,
    deleteSelectedWhiteboard,
  }
}
