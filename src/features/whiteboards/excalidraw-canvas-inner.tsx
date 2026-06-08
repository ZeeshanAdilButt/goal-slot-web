'use client'

// @ts-ignore: CSS module side-effect import
import '@excalidraw/excalidraw/index.css'
// @ts-ignore: CSS module side-effect import
import './whiteboard-excalidraw.css'

import { useCallback, useEffect, useMemo, useRef, useState, type ComponentProps } from 'react'

import { Excalidraw, loadLibraryFromBlob } from '@excalidraw/excalidraw'

import {
  clearAddLibraryFromUrl,
  parseAddLibraryFromUrl,
  PENDING_LIBRARY_KEY,
  stashPendingLibraryFromUrl,
  takePendingLibrary,
} from './excalidraw-library-url'
import { prepareExcalidrawScene } from './excalidraw-scene-utils'
import type { ExcalidrawScene } from './types'

if (typeof window !== 'undefined') {
  stashPendingLibraryFromUrl()
}

type ExcalidrawProps = ComponentProps<typeof Excalidraw>

interface ExcalidrawCanvasInnerProps extends Omit<ExcalidrawProps, 'initialData'> {
  scene: ExcalidrawScene | null
}

const LIBRARY_STORAGE_KEY = 'goalslot-excalidraw-library'

type LibraryTokens = { libraryUrl: string; idToken: string | null }

function loadLibraryItems() {
  if (typeof window === 'undefined') return []
  try {
    const saved = localStorage.getItem(LIBRARY_STORAGE_KEY)
    return saved ? JSON.parse(saved) : []
  } catch {
    return []
  }
}

function saveLibraryItems(items: readonly any[]) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(LIBRARY_STORAGE_KEY, JSON.stringify(items))
  } catch {
    // quota exceeded or private mode
  }
}

async function fetchLibraryItems(libraryUrl: string) {
  const response = await fetch(libraryUrl)
  if (!response.ok) {
    throw new Error(`Failed to fetch library: ${response.status}`)
  }

  const contentType = response.headers.get('content-type') ?? ''
  if (contentType.includes('application/json')) {
    const data = await response.json()
    return data.libraryItems ?? data.library ?? data
  }

  const blob = await response.blob()
  return loadLibraryFromBlob(blob, 'published')
}

function resolveLibraryTokens(): LibraryTokens | null {
  const fromUrl = parseAddLibraryFromUrl()
  if (fromUrl) {
    sessionStorage.removeItem(PENDING_LIBRARY_KEY)
    return fromUrl
  }

  return takePendingLibrary()
}

export function ExcalidrawCanvasInner({
  scene,
  excalidrawAPI: parentExcalidrawAPI,
  onLibraryChange: parentOnLibraryChange,
  libraryReturnUrl: _parentLibraryReturnUrl,
  ...excalidrawProps
}: ExcalidrawCanvasInnerProps) {
  const [excalidrawAPI, setExcalidrawAPI] = useState<any>(null)
  const importInFlightRef = useRef(false)

  const initialData = useMemo(() => {
    const prepared = prepareExcalidrawScene(scene)
    return {
      ...prepared,
      libraryItems: loadLibraryItems(),
    }
  }, [scene])

  const libraryReturnUrl =
    typeof window !== 'undefined' ? window.location.origin + window.location.pathname + window.location.search : ''

  const importLibrary = useCallback(
    async (tokens: LibraryTokens, source: 'url' | 'sessionStorage') => {
      if (!excalidrawAPI || importInFlightRef.current) return

      // importInFlightRef.current = true
      console.log(`[Excalidraw] addLibrary param found in ${source}:`, tokens.libraryUrl)

      try {
        const libraryUrl = decodeURIComponent(tokens.libraryUrl)
        const libraryItems = await fetchLibraryItems(libraryUrl)

        console.log('[Excalidraw] fetched library data:', libraryItems)
        console.log('[Excalidraw] calling updateLibrary with', libraryItems.length, 'items')

        await excalidrawAPI.updateLibrary({
          libraryItems,
          merge: true,
          defaultStatus: 'published',
          openLibraryMenu: true,
        })

        clearAddLibraryFromUrl()
        sessionStorage.removeItem(PENDING_LIBRARY_KEY)
      } catch (err) {
        console.error('[Excalidraw] Failed to load library:', err)
        importInFlightRef.current = false
        try {
          sessionStorage.setItem(PENDING_LIBRARY_KEY, JSON.stringify(tokens))
        } catch {
          // ignore
        } finally {
          importInFlightRef.current = false
        }
      }
    },
    [excalidrawAPI],
  )

  useEffect(() => {
    if (!excalidrawAPI) return

    const tokens = resolveLibraryTokens()
    if (tokens) {
      const source = parseAddLibraryFromUrl() ? 'url' : 'sessionStorage'
      void importLibrary(tokens, source)
    }
  }, [excalidrawAPI, importLibrary])

  useEffect(() => {
    if (!excalidrawAPI) return

    const onHashChange = () => {
      const tokens = parseAddLibraryFromUrl()
      if (tokens) {
        void importLibrary(tokens, 'url')
      }
    }

    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [excalidrawAPI, importLibrary])

  return (
    <Excalidraw
      {...excalidrawProps}
      initialData={initialData}
      excalidrawAPI={(api: any) => {
        setExcalidrawAPI(api)
        if (typeof parentExcalidrawAPI === 'function') {
          parentExcalidrawAPI(api)
        }
      }}
      libraryReturnUrl={libraryReturnUrl}
      onLibraryChange={(libraryItems) => {
        saveLibraryItems(libraryItems)
        parentOnLibraryChange?.(libraryItems)
      }}
    />
  )
}
