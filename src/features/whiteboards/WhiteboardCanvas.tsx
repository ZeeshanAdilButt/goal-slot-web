'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { usePathname } from 'next/navigation'

import { useQueryClient } from '@tanstack/react-query'

import { updateWhiteboard, updateWhiteboardKeepalive } from '@/lib/api/whiteboards'
import { cn } from '@/lib/utils'
import { useIsMobile } from '@/hooks/use-mobile'

import { WHITEBOARDS_QUERY_KEY } from './hooks/use-whiteboards'
import type { ExcalidrawScene, Whiteboard } from './types'
import { clearWhiteboardDraft, resolveWhiteboardScene, saveWhiteboardDraft } from './whiteboard-draft'

const ExcalidrawCanvasInner = dynamic(
  () => import('./excalidraw-canvas-inner').then((mod) => mod.ExcalidrawCanvasInner),
  {
    ssr: false,
    loading: () => <div className="flex h-full items-center justify-center">Loading canvas...</div>,
  },
)

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export type FlushWhiteboardSave = () => Promise<void>

interface WhiteboardCanvasProps {
  whiteboardId: string
  initialData: ExcalidrawScene | null
  readOnly: boolean
  onRegisterFlush?: (flush: FlushWhiteboardSave | null) => void
}

interface ExcalidrawAppStateSlice {
  editingElement?: unknown
  draggingElement?: unknown
}

function hasEditingElement(appState: unknown): boolean {
  return (
    typeof appState === 'object' &&
    appState !== null &&
    'editingElement' in appState &&
    (appState as ExcalidrawAppStateSlice).editingElement != null
  )
}

function buildScene(
  elements: readonly Record<string, unknown>[],
  appState: Record<string, unknown>,
  files: Record<string, unknown>,
): ExcalidrawScene {
  const {
    collaborators: _c,
    editingElement: _e,
    draggingElement: _d,
    openMenu: _m,
    openPopup: _p,
    contextMenu: _ctx,
    ...persistedAppState
  } = appState

  return {
    elements: elements as Record<string, unknown>[],
    appState: persistedAppState,
    files,
  }
}

function toInitialData(initialData: ExcalidrawScene | null) {
  if (!initialData?.elements?.length) {
    return {
      elements: [],
      appState: {
        ...(initialData?.appState ?? {}),
        collaborators: new Map(),
      },
      files: initialData?.files ?? {},
    }
  }
  return {
    elements: initialData.elements as any,
    appState: {
      ...(initialData.appState ?? {}),
      collaborators: new Map(),
    },
    files: (initialData.files ?? {}) as any,
  }
}

const UI_OPTIONS = {
  canvasActions: {
    loadScene: false,
    saveToActiveFile: false,
  },
} as const

export function WhiteboardCanvas({ whiteboardId, initialData, readOnly, onRegisterFlush }: WhiteboardCanvasProps) {
  const isMobile = useIsMobile()
  const pathname = usePathname()
  const forceViewOnly = isMobile && !readOnly
  const queryClient = useQueryClient()

  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastSaveRef = useRef<number>(0)
  const wasDraggingRef = useRef(false)
  const savedHideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const whiteboardIdRef = useRef(whiteboardId)
  const readOnlyRef = useRef(readOnly || forceViewOnly)
  const excalidrawAPIRef = useRef<any>(null)
  const isReadyRef = useRef(false)
  const lastPersistedHashRef = useRef<string | null>(null)
  const latestSceneRef = useRef<ExcalidrawScene | null>(null)

  useEffect(() => {
    whiteboardIdRef.current = whiteboardId
    isReadyRef.current = false
    lastPersistedHashRef.current = null
    latestSceneRef.current = null
  }, [whiteboardId])

  useEffect(() => {
    readOnlyRef.current = readOnly || forceViewOnly
  }, [readOnly, forceViewOnly])

  const handleExcalidrawAPI = useCallback((api: any) => {
    excalidrawAPIRef.current = api
    requestAnimationFrame(() => {
      isReadyRef.current = true
    })
  }, [])

  const excalidrawInitialData = useMemo(() => {
    const scene = resolveWhiteboardScene(whiteboardId, initialData)
    return toInitialData(scene)
  }, [whiteboardId, initialData])

  const patchCaches = useCallback(
    (targetId: string, scene: ExcalidrawScene) => {
      queryClient.setQueryData<Whiteboard[]>(WHITEBOARDS_QUERY_KEY, (prev) => {
        if (!prev) return prev
        return prev.map((w) => (w.id === targetId ? { ...w, content: scene } : w))
      })
      queryClient.setQueryData<{ whiteboard: Whiteboard; readOnly: boolean }>(
        [...WHITEBOARDS_QUERY_KEY, targetId],
        (prev) => {
          if (!prev) return prev
          return { ...prev, whiteboard: { ...prev.whiteboard, content: scene } }
        },
      )
    },
    [queryClient],
  )

  const persistScene = useCallback(
    async (scene: ExcalidrawScene, targetId: string, options?: { silent?: boolean; force?: boolean }) => {
      if (readOnlyRef.current) return

      const hash = JSON.stringify(scene)
      if (!options?.force && hash === lastPersistedHashRef.current) return

      if (!options?.silent) setSaveStatus('saving')
      try {
        await updateWhiteboard(targetId, { content: scene })
        lastPersistedHashRef.current = hash
        clearWhiteboardDraft(targetId)
        patchCaches(targetId, scene)
        if (!options?.silent) {
          setSaveStatus('saved')
          if (savedHideTimerRef.current) clearTimeout(savedHideTimerRef.current)
          savedHideTimerRef.current = setTimeout(() => setSaveStatus('idle'), 2000)
        }
      } catch {
        if (!options?.silent) setSaveStatus('error')
      }
    },
    [patchCaches],
  )

  const getSceneFromApi = useCallback((): ExcalidrawScene | null => {
    const api = excalidrawAPIRef.current
    if (!api) return latestSceneRef.current
    return buildScene(api.getSceneElements(), api.getAppState(), api.getFiles())
  }, [])

  const flushSave = useCallback(async () => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
      debounceRef.current = null
    }
    const scene = getSceneFromApi()
    if (!scene || readOnlyRef.current) return
    await persistScene(scene, whiteboardIdRef.current, { silent: true, force: true })
  }, [getSceneFromApi, persistScene])

  useEffect(() => {
    onRegisterFlush?.(flushSave)
    return () => onRegisterFlush?.(null)
  }, [flushSave, onRegisterFlush])

  const handleChange = useCallback(
    (elements: readonly unknown[], appState: unknown, files: unknown) => {
      if (!isReadyRef.current || readOnlyRef.current) return
      if (hasEditingElement(appState)) return

      const scene = buildScene(
        elements as Record<string, unknown>[],
        appState as Record<string, unknown>,
        files as Record<string, unknown>,
      )
      latestSceneRef.current = scene
      saveWhiteboardDraft(whiteboardIdRef.current, scene)

      const isDragging =
        typeof appState === 'object' &&
        appState !== null &&
        'draggingElement' in appState &&
        (appState as ExcalidrawAppStateSlice).draggingElement != null

      if (isDragging) {
        if (Date.now() - lastSaveRef.current > 1000) {
          lastSaveRef.current = Date.now()
          void persistScene(scene, whiteboardIdRef.current)
        }
        wasDraggingRef.current = true
      } else if (wasDraggingRef.current) {
        wasDraggingRef.current = false
        lastSaveRef.current = Date.now()
        void persistScene(scene, whiteboardIdRef.current)
        // Clear debounce to prevent duplicate POST after drag ends
        if (debounceRef.current) {
          clearTimeout(debounceRef.current)
          debounceRef.current = null
        }
      }
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        void persistScene(scene, whiteboardIdRef.current)
      }, 1000)
    },
    [persistScene],
  )

  useEffect(() => {
    const idAtMount = whiteboardId
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
        debounceRef.current = null
      }
      const scene = latestSceneRef.current ?? getSceneFromApi()
      if (scene && !readOnlyRef.current) {
        updateWhiteboardKeepalive(idAtMount, scene)
        void persistScene(scene, idAtMount, { silent: true, force: true }).catch(() => {})
      }
    }
  }, [whiteboardId, getSceneFromApi, persistScene])

  useEffect(() => {
    const saveOnPageUnload = () => {
      const scene = latestSceneRef.current ?? getSceneFromApi()
      if (scene && !readOnlyRef.current) {
        updateWhiteboardKeepalive(whiteboardIdRef.current, scene)
      }
    }
    window.addEventListener('beforeunload', saveOnPageUnload)
    return () => window.removeEventListener('beforeunload', saveOnPageUnload)
  }, [getSceneFromApi])

  const prevPathRef = useRef(pathname)
  useEffect(() => {
    if (prevPathRef.current !== pathname) {
      void flushSave()
      prevPathRef.current = pathname
    }
  }, [pathname, flushSave])

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      if (savedHideTimerRef.current) clearTimeout(savedHideTimerRef.current)
    }
  }, [])

  return (
    <div className="relative flex h-full flex-col">
      {forceViewOnly && (
        <div className="shrink-0 border-b border-yellow-300 bg-yellow-50 px-3 py-2 text-center text-sm text-yellow-900">
          Editing is only available on desktop. Viewing in read-only mode.
        </div>
      )}

      {!readOnly && saveStatus !== 'idle' && (
        <div
          className={cn(
            'pointer-events-none absolute right-3 top-3 z-10 text-xs font-medium',
            saveStatus === 'saving' && 'text-zinc-500',
            saveStatus === 'saved' && 'text-green-600',
            saveStatus === 'error' && 'text-red-600',
          )}
        >
          {saveStatus === 'saving' && 'Saving...'}
          {saveStatus === 'saved' && 'Saved ✓'}
          {saveStatus === 'error' && 'Save failed'}
        </div>
      )}

      <div className="goalslot-whiteboard-canvas min-h-0 flex-1">
        <ExcalidrawCanvasInner
          key={whiteboardId}
          excalidrawAPI={handleExcalidrawAPI}
          UIOptions={UI_OPTIONS}
          initialData={excalidrawInitialData}
          onChange={handleChange}
          viewModeEnabled={readOnly || forceViewOnly}
        />
      </div>
    </div>
  )
}
